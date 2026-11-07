const Match = require("../models/Match");

async function saveCompletedMatch(result) {
    if (!result || !result.roomCode) {
        throw new Error("Invalid completed match data.");
    }

    if (!result.winnerId) {
        throw new Error(
            `Cannot save match ${result.roomCode}: winnerId is missing.`,
        );
    }

    return Match.create({
        roomCode: result.roomCode,
        players: result.players,
        rounds: result.rounds || [],
        winnerId: result.winnerId,
        targetScore: result.targetScore || 5,
        finishedAt: new Date(),
    });
}

module.exports = {saveCompletedMatch};
