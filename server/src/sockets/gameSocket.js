const {
    createRoom,
    joinRoom,
    getRoomByCode,
    startRound,
    playCard,
    drawCard,
    passTurn,
    getCompletedMatchData,
    claimMatchSave,
    markPlayerDisconnected,
    removePlayer,
    getPrivateStates,
} = require("../services/roomService");
const {saveCompletedMatch} = require("../services/matchService");

// Send every player their own hand (never the other players' hands).
function emitHands(io, code) {
    const states = getPrivateStates(code);

    for (const [playerId, state] of Object.entries(states)) {
        io.to(playerId).emit("hand:updated", state);
    }
}

function broadcast(io, room) {
    io.to(room.code).emit("room:updated", room);
    emitHands(io, room.code);
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
        socket.on("room:create", (payload = {}, ack = () => {}) => {
            try {
                const room = createRoom(socket.id, payload.name);
                socket.join(room.code);

                ack({ok: true, room});
                io.to(room.code).emit("room:updated", room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("room:join", (payload = {}, ack = () => {}) => {
            try {
                const room = joinRoom(socket.id, payload.code, payload.name);
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
                const result = startRound(socket.id, payload.code);

                ack({ok: true, room: result.room});
                broadcast(io, result.room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("game:play", async (payload = {}, ack = () => {}) => {
            try {
                const result = playCard(
                    socket.id,
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

        socket.on("game:draw", (payload = {}, ack = () => {}) => {
            try {
                const result = drawCard(socket.id, payload.code);

                ack({ok: true, room: result.room});
                broadcast(io, result.room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        socket.on("game:pass", (payload = {}, ack = () => {}) => {
            try {
                const result = passTurn(socket.id, payload.code);

                ack({ok: true, room: result.room});
                broadcast(io, result.room);
            } catch (error) {
                ack({ok: false, error: error.message});
            }
        });

        // A player leaves the table on purpose (the Lobby button).
        socket.on("room:leave", async (payload = {}, ack = () => {}) => {
            const result = removePlayer(socket.id);

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
            }
        });

        socket.on("disconnect", () => {
            const result = markPlayerDisconnected(socket.id, io);
            if (!result) return;

            io.to(result.code).emit("room:updated", result.room);
        });
    });
}

module.exports = {registerGameSocket};
