require("dotenv").config();

const express = require("express");
const http = require("node:http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const {Server} = require("socket.io");
// No database: games live in memory, and each phone keeps its own match
// history (the finished match is sent to players in room.matchResult).
const {registerGameSocket} = require("./sockets/gameSocket");

const app = express();
const server = http.createServer(app);

// Behind Render's proxy: use the real client IP for rate limiting,
// otherwise every player shares one limit.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({origin: process.env.CLIENT_ORIGIN || "*"}));
app.use(express.json());

// Must be registered before the routes, otherwise it never runs for them.
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

function startServer() {
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Card Arena server running on port ${PORT}`);
    });
}

startServer();
