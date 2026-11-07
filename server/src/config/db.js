const mongoose = require("mongoose");

async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is missing from server/.env");
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log("MongoDB connected successfully");

        return mongoose.connection;
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
}

module.exports = connectDB;
