const {
    createRoom,
    createSoloRoom,
    joinRoom,
    getRoomByCode,
    startRound,
    playCard,
    drawCard,
    passTurn,
    markPlayerDisconnected,
    reconnectPlayer,
    removePlayer,
    getPrivateStates,
    getPlayerRoomCode,
    assertCanJoin,
    isBotTurn,
    runBotTurn,
} = require("../services/roomService");

const botTimers = new Map();

// Send every player their own hand (never the other players' hands).
// Each player has a private channel named after their permanent playerId.
function emitHands(io, code) {
    const states = getPrivateStates(code);

    for (const [playerId, state] of Object.entries(states)) {
        io.to(playerId).emit("hand:updated", state);
    }
}

// If it's a bot's turn, play it after a short "thinking" delay.
// broadcast() calls this, so consecutive bot turns chain automatically.
function scheduleBots(io, code) {
    clearTimeout(botTimers.get(code));

    if (!isBotTurn(code)) {
        botTimers.delete(code);
        return;
    }

    const delay = 700 + Math.random() * 800;
    const timer = setTimeout(() => {
        botTimers.delete(code);
        try {
            const result = runBotTurn(code);
            if (result) broadcast(io, result.room);
        } catch (error) {
            // Never let a bot error crash the whole server.
            console.error("Bot turn failed:", error);
        }
    }, delay);

    botTimers.set(code, timer);
}

function clearBots(code) {
    clearTimeout(botTimers.get(code));
    botTimers.delete(code);
}

function broadcast(io, room) {
    io.to(room.code).emit("room:updated", room);
    emitHands(io, room.code);
    scheduleBots(io, room.code);
}

// After removePlayer(): update the table, or tell everyone it closed.
function handleRemoval(io, result) {
    if (!result) return;

    if (result.room) {
        broadcast(io, result.room);
    } else {
        clearBots(result.code);
        io.to(result.code).emit("room:closed");
    }
}

function registerGameSocket(io) {
    // A player can only sit at one table. Leave the old one (if any) before
    // creating or joining another, otherwise they would block both rooms.
    function leaveCurrentRoom(socket, playerId, keepCode) {
        const code = getPlayerRoomCode(playerId);
        if (!code || code === keepCode) return;

        socket.leave(code);
        handleRemoval(io, removePlayer(playerId));
    }

    io.on("connection", (socket) => {
        // Permanent id from the app. It stays the same when the phone
        // reconnects (socket.id does not). Falls back to socket.id.
        const rawId = socket.handshake.auth?.playerId;
        const playerId =
            typeof rawId === "string" && rawId.length >= 8 && rawId.length <= 64
                ? rawId
                : socket.id;

        // Private channel for this player's hand.
        socket.join(playerId);

        // Known player coming back (screen unlocked, call ended, etc.):
        // give the seat back and resend the table and their hand.
        const resumed = reconnectPlayer(playerId);
        if (resumed) {
            socket.join(resumed.code);
            socket.emit("room:updated", resumed.room);
            io.to(resumed.code).emit("room:updated", resumed.room);
            const hands = getPrivateStates(resumed.code);
            if (hands[playerId]) socket.emit("hand:updated", hands[playerId]);
            scheduleBots(io, resumed.code);
        }

        socket.on("room:create", (payload = {}, ack = () => {}) => {
            try {
                leaveCurrentRoom(socket, playerId);
                const room = createRoom(playerId, payload.name);
                socket.join(room.code);

                ack({ok: true, room});
                io.to(room.code).emit("room:updated", room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("room:create-solo", (payload = {}, ack = () => {}) => {
            try {
                leaveCurrentRoom(socket, playerId);
                const room = createSoloRoom(
                    playerId,
                    payload.name,
                    payload.bots,
                );
                socket.join(room.code);

                ack({ok: true, room});
                io.to(room.code).emit("room:updated", room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("room:join", (payload = {}, ack = () => {}) => {
            try {
                const target = assertCanJoin(
                    playerId,
                    payload.code,
                    payload.name,
                );
                leaveCurrentRoom(socket, playerId, target.code);
                const room = joinRoom(playerId, payload.code, payload.name);
                socket.join(room.code);

                ack({ok: true, room});
                io.to(room.code).emit("room:updated", room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("room:get", (payload = {}, ack = () => {}) => {
            const room = getRoomByCode(payload.code);

            if (!room) {
                ack({ok: false, error: "Room not found."});
                return;
            }

            ack({ok: true, room});
        });

        socket.on("game:start", (payload = {}, ack = () => {}) => {
            try {
                const result = startRound(playerId, payload.code);

                ack({ok: true, room: result.room});
                broadcast(io, result.room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("game:play", (payload = {}, ack = () => {}) => {
            try {
                const result = playCard(
                    playerId,
                    payload.code,
                    payload.cardId,
                    payload.suit,
                );

                ack({ok: true, room: result.room, roundOver: result.roundOver});
                broadcast(io, result.room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("game:draw", (payload = {}, ack = () => {}) => {
            try {
                const result = drawCard(playerId, payload.code);

                ack({ok: true, room: result.room});
                broadcast(io, result.room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("game:pass", (payload = {}, ack = () => {}) => {
            try {
                const result = passTurn(playerId, payload.code);

                ack({ok: true, room: result.room});
                broadcast(io, result.room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        // A player leaves the table on purpose (the Lobby button).
        socket.on("room:leave", (_payload = {}, ack = () => {}) => {
            const result = removePlayer(playerId);

            if (result) socket.leave(result.code);
            ack({ok: true});
            handleRemoval(io, result);
        });

        socket.on("disconnect", () => {
            // The same player may already be back on a newer socket.
            // If so, there is nothing to mark.
            const stillConnected = io.sockets.adapter.rooms.get(playerId);
            if (stillConnected && stillConnected.size > 0) return;

            const result = markPlayerDisconnected(playerId, (removed) =>
                handleRemoval(io, removed),
            );
            if (!result) return;

            io.to(result.code).emit("room:updated", result.room);
        });
    });
}

module.exports = {registerGameSocket};
