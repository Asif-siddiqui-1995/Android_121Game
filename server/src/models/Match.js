const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
    {
        number: {type: Number, required: true},
        winnerId: {type: String, default: null},
        winnerIds: [String],
        // One entry per player: the cards left in their hand and points scored.
        cards: [
            {
                playerId: {type: String, required: true},
                name: {type: String, required: true},
                card: mongoose.Schema.Types.Mixed, // array of remaining cards
                points: {type: Number, default: 0},
                total: {type: Number, default: 0},
                eliminated: {type: Boolean, default: false},
            },
        ],
    },
    {_id: false},
);

const matchSchema = new mongoose.Schema(
    {
        roomCode: {type: String, required: true, index: true},
        players: [
            {
                playerId: {type: String, required: true},
                name: {type: String, required: true},
                finalScore: {type: Number, required: true},
                eliminated: {type: Boolean, default: false},
            },
        ],
        rounds: [roundSchema],
        winnerId: {type: String, default: null},
        targetScore: {type: Number, default: 121},
        finishedAt: {type: Date, default: Date.now},
    },
    {timestamps: true},
);

module.exports = mongoose.model("Match", matchSchema);
