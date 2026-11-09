const {
    createRoom,
    createSoloRoom,
    joinRoom,
    getRoomByCode,
    startRound,
    playCard,
    drawCard,
    passTurn,
    getCompletedMatchData,
    claimMatchSave,
    markPlayerDisconnected,
    reconnectPlayer,
    removePlayer,
    getPrivateStates,
    isBotTurn,
    runBotTurn,
} = require("../services/roomService");
const {saveCompletedMatch} = require("../services/matchService");

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
        const result = runBotTurn(code);
        if (result) broadcast(io, result.room);
    }, delay);

    botTimers.set(code, timer);
}

function broadcast(io, room) {
    io.to(room.code).emit("room:updated", room);
    emitHands(io, room.code);
    scheduleBots(io, room.code);
}

async function saveMatchOnce(code) {
    try {
        if (!claimMatchSave(code)) return;

        const matchData = getCompletedMatchData(code);
        if (!matchData || matchData.rounds.length === 0) return;

        const saved = await saveCompletedMatch(matchData);
        console.log(
            "Saved completed match",
            matchData.roomCode,
            saved?._id?.toString(),
        );
    } catch (error) {
        console.error("Failed to save match:", error);
    }
}

function registerGameSocket(io) {
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

        socket.on("game:play", async (payload = {}, ack = () => {}) => {
            try {
                const result = playCard(
                    playerId,
                    payload.code,
                    payload.cardId,
                    payload.suit,
                );

                ack({ok: true, room: result.room, roundOver: result.roundOver});
                broadcast(io, result.room);

                if (result.room.status === "finished") {
                    await saveMatchOnce(result.room.code);
                }
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("game:draw", async (payload = {}, ack = () => {}) => {
            try {
                const result = drawCard(playerId, payload.code);

                ack({ok: true, room: result.room});
                broadcast(io, result.room);

                if (result.room.status === "finished") {
                    await saveMatchOnce(result.room.code);
                }
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
        socket.on("room:leave", async (payload = {}, ack = () => {}) => {
            const result = removePlayer(playerId);

            if (!result) {
                ack({ok: true});
                return;
            }

            socket.leave(result.code);
            ack({ok: true});

            if (result.room) {
                broadcast(io, result.room);

                if (result.room.status === "finished") {
                    await saveMatchOnce(result.code);
                }
            } else {
                // Room deleted: stop any pending bot move.
                clearTimeout(botTimers.get(result.code));
                botTimers.delete(result.code);
            }
        });

        socket.on("disconnect", () => {
            // The same player may already be back on a newer socket.
            // If so, there is nothing to mark.
            const stillConnected = io.sockets.adapter.rooms.get(playerId);
            if (stillConnected && stillConnected.size > 0) return;

            const result = markPlayerDisconnected(playerId, io);
            if (!result) return;

            io.to(result.code).emit("room:updated", result.room);
        });
    });
}

module.exports = {registerGameSocket};
