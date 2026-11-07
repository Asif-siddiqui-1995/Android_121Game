require("dotenv").config();

const express = require("express");
const http = require("node:http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const {Server} = require("socket.io");
const matchRoutes = require("../src/routes/matchRoutes");
const connectDB = require("./config/db");
const {registerGameSocket} = require("./sockets/gameSocket");
const {default: mongoose} = require("mongoose");

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({origin: process.env.CLIENT_ORIGIN || "*"}));
app.use(express.json());
app.use("/api/matches", matchRoutes);

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        limit: 100,
        standardHeaders: true,
        legacyHeaders: false,
    }),
);

app.get("/health", (_req, res) => {
    res.json({ok: true, service: "card-arena-server"});
});

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "*",
        methods: ["GET", "POST"],
    },
});

registerGameSocket(io);

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await connectDB();

        server.listen(PORT, "0.0.0.0", () => {
            console.log(`Card Arena server running on port ${PORT}`);
            console.log("DB host:", mongoose.connection.host);
            console.log("DB name:", mongoose.connection.name);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
