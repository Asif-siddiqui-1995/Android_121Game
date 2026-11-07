const express = require("express");
const mongoose = require("mongoose");
const Match = require("../models/Match");

const router = express.Router();

// GET /api/matches?limit=20&page=1
// Get recent completed matches.
router.get("/", async (req, res) => {
    try {
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
            100,
        );

        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

        const [matches, total] = await Promise.all([
            Match.find({})
                .select(
                    "roomCode players winnerId targetScore finishedAt createdAt",
                )
                .sort({finishedAt: -1, _id: -1})
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Match.countDocuments({}),
        ]);

        res.json({
            success: true,
            data: matches,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Failed to fetch match history:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch match history.",
        });
    }
});

// GET /api/matches/room/:roomCode
// Get a match using its private room code.
router.get("/room/:roomCode", async (req, res) => {
    try {
        const roomCode = req.params.roomCode.trim().toUpperCase();

        const match = await Match.findOne({roomCode}).lean();

        if (!match) {
            return res.status(404).json({
                success: false,
                message: "Match not found.",
            });
        }

        return res.json({
            success: true,
            data: match,
        });
    } catch (error) {
        console.error("Failed to fetch match by room:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch match.",
        });
    }
});

// GET /api/matches/:id
// Get one match by its MongoDB document ID.
router.get("/:id", async (req, res) => {
    try {
        const {id} = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid match ID.",
            });
        }

        const match = await Match.findById(id).lean();

        if (!match) {
            return res.status(404).json({
                success: false,
                message: "Match not found.",
            });
        }

        return res.json({
            success: true,
            data: match,
        });
    } catch (error) {
        console.error("Failed to fetch match:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch match.",
        });
    }
});

module.exports = router;
