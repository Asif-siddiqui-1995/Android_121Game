const crypto = require("node:crypto");
const {createDeck, shuffleDeck} = require("../game/deck");

const rooms = new Map();
const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
const ELIMINATION_SCORE = 121;

// false: a 2 or Jack of Clubs cannot be answered. The next player must draw
// the penalty (2 or 5 cards), then still plays a card or draws from the deck.
// true: the penalty can be passed on with another 2 / Jack of Clubs and stacks.
const ALLOW_PENALTY_STACKING = false;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const SUITS = ["clubs", "diamonds", "hearts", "spades"];
const SUIT_SYMBOLS = {clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠"};
const SUIT_ALIASES = {
    "♣": "clubs",
    "♦": "diamonds",
    "♥": "hearts",
    "♠": "spades",
};
const RANK_ALIASES = {ACE: "A", 1: "A", JACK: "J", QUEEN: "Q", KING: "K"};

// ---------------------------------------------------------------------------
// Card helpers. Cards are normalised once when dealt, so the rest of the
// code can rely on rank: "A","2".."10","J","Q","K" and suit: "clubs", etc.
// ---------------------------------------------------------------------------

function normalizeSuit(rawSuit) {
    const raw = String(rawSuit ?? "")
        .trim()
        .toLowerCase();
    if (!raw) return "";
    if (SUIT_ALIASES[raw]) return SUIT_ALIASES[raw];
    return SUITS.find((suit) => suit.startsWith(raw)) ?? raw;
}

function normalizeRank(rawRank) {
    const raw = String(rawRank ?? "")
        .trim()
        .toUpperCase();
    return RANK_ALIASES[raw] || raw;
}

function normalizeCard(card) {
    const rank = normalizeRank(card.rank);
    const suit = normalizeSuit(card.suit);
    return {id: card.id ?? `${rank}-${suit}`, rank, suit};
}

function cardLabel(card) {
    return `${card.rank}${SUIT_SYMBOLS[card.suit] ?? ""}`;
}

// 2-10 face value, J/Q/K 10, Ace 0, 8 0, Jack of Clubs 25.
function cardPoints(card) {
    if (card.rank === "J") return card.suit === "clubs" ? 25 : 10;
    if (card.rank === "Q" || card.rank === "K") return 10;
    if (card.rank === "A" || card.rank === "8") return 0;
    return Number(card.rank) || 0;
}

// Draw penalty a card adds: any 2 = 2, Jack of Clubs = 5.
function penaltyOf(card) {
    if (card.rank === "2") return 2;
    if (card.rank === "J" && card.suit === "clubs") return 5;
    return 0;
}

function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Room helpers
// ---------------------------------------------------------------------------

function generateRoomCode() {
    let code;
    do {
        code = Array.from(
            crypto.randomBytes(6),
            (byte) => CODE_CHARS[byte % CODE_CHARS.length],
        ).join("");
    } while (rooms.has(code));

    return code;
}

function cleanName(name) {
    if (typeof name !== "string") return "";
    return name.trim().replace(/\s+/g, " ").slice(0, 20);
}

function findRoom(code) {
    const normalized =
        typeof code === "string" ? code.trim().toUpperCase() : "";
    return rooms.get(normalized);
}

function activePlayers(room) {
    return room.players.filter((player) => !player.eliminated);
}

// First non-eliminated player at or after the preferred player's seat.
function firstActiveFrom(room, preferredId) {
    const count = room.players.length;
    let start = room.players.findIndex((player) => player.id === preferredId);
    if (start === -1) start = 0;

    for (let i = 0; i < count; i++) {
        const player = room.players[(start + i) % count];
        if (!player.eliminated) return player.id;
    }

    return null;
}

// Next active player clockwise. steps = 2 skips one player (the 10).
function nextActiveId(room, fromId, steps = 1) {
    const active = activePlayers(room);
    let index = active.findIndex((player) => player.id === fromId);
    if (index === -1) index = 0;

    return active[(index + steps) % active.length].id;
}

function topCardOf(round) {
    return round.discardPile[round.discardPile.length - 1];
}

// Can this card be played right now?
function canPlay(round, card) {
    // After drawing a card, only that drawn card may be played (or pass).
    if (round.drawnCardId && card.id !== round.drawnCardId) return false;

    // Facing a draw penalty: the player must draw, unless stacking is allowed.
    if (round.pendingDraw > 0) {
        return ALLOW_PENALTY_STACKING && penaltyOf(card) > 0;
    }

    // An 8 can always be played.
    if (card.rank === "8") return true;

    // After an 8, players must follow the chosen suit (or play another 8).
    if (round.chosenSuit) return card.suit === round.chosenSuit;

    const top = topCardOf(round);
    return card.suit === top.suit || card.rank === top.rank;
}

// Draw cards, reshuffling the discard pile (minus the top card) when empty.
function drawFromPile(round, count) {
    const drawn = [];

    while (drawn.length < count) {
        if (round.drawPile.length === 0) {
            if (round.discardPile.length <= 1) break; // nothing left to draw

            const top = round.discardPile.pop();
            round.drawPile = shuffleDeck(round.discardPile);
            round.discardPile = [top];
        }

        drawn.push(round.drawPile.pop());
    }

    return drawn;
}

function advanceTurn(room, steps = 1) {
    const round = room.round;
    round.currentPlayerId = nextActiveId(room, round.currentPlayerId, steps);
    round.drawnCardId = null;
    round.extraTurn = false;
}

// Tells clients what just happened so they can animate it (a card flying
// onto the table, or cards being drawn). seq only ever goes up.
function setEvent(room, type, playerId, extra = {}) {
    room.eventSeq = (room.eventSeq || 0) + 1;
    room.lastEvent = {seq: room.eventSeq, type, playerId, ...extra};
}

function playerName(room, playerId) {
    return (
        room.players.find((player) => player.id === playerId)?.name || "Player"
    );
}

// ---------------------------------------------------------------------------
// Public / private state
// ---------------------------------------------------------------------------

function getPublicRoom(room) {
    const round = room.round;

    return {
        code: room.code,
        hostId: room.hostId,
        status: room.status,
        roundNumber: room.roundNumber,
        targetScore: ELIMINATION_SCORE,
        maxPlayers: MAX_PLAYERS,
        players: room.players.map((player) => ({
            id: player.id,
            name: player.name,
            isHost: player.id === room.hostId,
            isDealer: round ? round.dealerId === player.id : false,
            score: room.scores[player.id] || 0,
            eliminated: Boolean(player.eliminated),
            cardCount: round?.hands[player.id]?.length ?? 0,
        })),
        currentPlayerId: round && !round.result ? round.currentPlayerId : null,
        topCard: round ? topCardOf(round) : null,
        chosenSuit: round?.chosenSuit ?? null,
        pendingDraw: round?.pendingDraw ?? 0,
        drawPileCount: round?.drawPile.length ?? 0,
        canPass: Boolean(round?.drawnCardId),
        extraTurn: Boolean(round?.extraTurn),
        recentDiscards: round ? round.discardPile.slice(-6) : [],
        lastEvent: room.lastEvent || null,
        lastAction: round?.lastAction ?? "",
        roundResult: round?.result ?? null,
        gameWinnerId: room.gameWinnerId || null,
    };
}

// Each player's private hand, plus which of their cards are playable now.
function getPrivateStates(rawCode) {
    const room = findRoom(rawCode);
    if (!room?.round) return {};

    const round = room.round;
    const states = {};

    for (const player of room.players) {
        const hand = round.hands[player.id];
        if (!hand) continue;

        const myTurn = !round.result && round.currentPlayerId === player.id;

        states[player.id] = {
            roundNumber: round.number,
            cards: [...hand],
            playableIds: myTurn
                ? hand.filter((card) => canPlay(round, card)).map((c) => c.id)
                : [],
        };
    }

    return states;
}

// ---------------------------------------------------------------------------
// Room lifecycle
// ---------------------------------------------------------------------------

function createRoom(socketId, rawName) {
    const name = cleanName(rawName);
    if (!name) throw new Error("Enter a player name.");

    const code = generateRoomCode();
    const room = {
        code,
        hostId: socketId,
        dealerId: socketId,
        status: "waiting",
        players: [{id: socketId, name, eliminated: false}],
        scores: {[socketId]: 0},
        roundNumber: 0,
        round: null,
        gameWinnerId: null,
        history: [],
        matchSaved: false,
        eventSeq: 0,
        lastEvent: null,
    };

    rooms.set(code, room);
    return getPublicRoom(room);
}

function joinRoom(socketId, rawCode, rawName) {
    const room = findRoom(rawCode);
    const name = cleanName(rawName);

    if (!name) throw new Error("Enter a player name.");
    if (!room) throw new Error("Room not found. Check the invite code.");
    if (room.status !== "waiting") {
        throw new Error("This game has already started.");
    }

    if (room.players.some((player) => player.id === socketId)) {
        return getPublicRoom(room);
    }

    if (room.players.length >= MAX_PLAYERS) {
        throw new Error("This room is full.");
    }

    room.players.push({id: socketId, name, eliminated: false});
    room.scores[socketId] = 0;

    return getPublicRoom(room);
}

function getRoomByCode(rawCode) {
    const room = findRoom(rawCode);
    return room ? getPublicRoom(room) : null;
}

function startRound(socketId, rawCode) {
    const room = findRoom(rawCode);

    if (!room) throw new Error("Room not found.");

    if (room.hostId !== socketId) {
        throw new Error("Only the host can start or continue the game.");
    }

    if (room.status === "finished") {
        throw new Error("This game has finished.");
    }

    if (room.round && !room.round.result) {
        throw new Error("The current round has not finished.");
    }

    const active = activePlayers(room);

    if (active.length < MIN_PLAYERS) {
        throw new Error("At least 2 players are needed to start.");
    }

    // Dealer rotates clockwise after every round, skipping eliminated players.
    if (room.nextDealerId) {
        room.dealerId = room.nextDealerId;
        delete room.nextDealerId;
    }
    room.dealerId = firstActiveFrom(room, room.dealerId);

    const dealerIndex = active.findIndex((p) => p.id === room.dealerId);
    const firstPlayerId = active[(dealerIndex + 1) % active.length].id;

    const deck = shuffleDeck(createDeck()).map(normalizeCard);

    // 5 cards each; the player next to the dealer gets 6.
    const hands = {};
    for (const player of active) {
        hands[player.id] = [];
        for (let i = 0; i < 5; i++) hands[player.id].push(deck.pop());
    }
    hands[firstPlayerId].push(deck.pop());

    // One random card face-up starts the discard pile.
    const firstDiscardCard = deck.pop();

    room.roundNumber += 1;
    room.status = "playing";
    room.gameWinnerId = null;
    room.lastEvent = null;

    // If the opening card is a 2 or the Jack of Clubs, the first player
    // must draw its penalty (2 or 5 cards), then plays on as normal.
    const openingPenalty = penaltyOf(firstDiscardCard);
    const firstName = playerName(room, firstPlayerId);

    room.round = {
        number: room.roundNumber,
        dealerId: room.dealerId,
        currentPlayerId: firstPlayerId,
        hands,
        drawPile: deck,
        discardPile: [firstDiscardCard],
        pendingDraw: openingPenalty,
        chosenSuit: null,
        drawnCardId: null,
        extraTurn: false,
        lastAction: openingPenalty
            ? `Round ${room.roundNumber} started. The first card is ${cardLabel(firstDiscardCard)}, so ${firstName} must draw ${openingPenalty}.`
            : `Round ${room.roundNumber} started. ${firstName} goes first.`,
        result: null,
    };

    // The next dealer is the next active player clockwise.
    room.nextDealerId = nextActiveId(room, room.dealerId, 1);

    return {room: getPublicRoom(room)};
}

// ---------------------------------------------------------------------------
// Turn actions
// ---------------------------------------------------------------------------

function getTurnContext(socketId, rawCode) {
    const room = findRoom(rawCode);

    if (!room) throw new Error("Room not found.");
    if (room.status !== "playing" || !room.round) {
        throw new Error("The game is not currently playing.");
    }

    const round = room.round;

    if (round.result) throw new Error("This round has already finished.");
    if (!round.hands[socketId]) {
        throw new Error("You are not a player in this round.");
    }
    if (round.currentPlayerId !== socketId) {
        throw new Error("It is not your turn.");
    }

    return {room, round, hand: round.hands[socketId]};
}

function playCard(socketId, rawCode, cardId, rawSuit) {
    const {room, round, hand} = getTurnContext(socketId, rawCode);

    const cardIndex = hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) throw new Error("That card is not in your hand.");

    const card = hand[cardIndex];

    if (!canPlay(round, card)) {
        throw new Error(
            round.pendingDraw > 0
                ? ALLOW_PENALTY_STACKING
                    ? `Play a 2 or the Jack of Clubs, or draw ${round.pendingDraw} cards.`
                    : `You must draw ${round.pendingDraw} cards.`
                : round.drawnCardId
                  ? "After drawing, you can only play the card you drew."
                  : "That card cannot be played now.",
        );
    }

    let chosenSuit = null;
    if (card.rank === "8") {
        chosenSuit = normalizeSuit(rawSuit);
        if (!SUITS.includes(chosenSuit)) {
            throw new Error("Choose a suit for the 8.");
        }
    }

    // Move the card from the hand to the discard pile.
    hand.splice(cardIndex, 1);
    round.discardPile.push(card);
    round.chosenSuit = chosenSuit;
    round.drawnCardId = null;
    setEvent(room, "play", socketId, {card});

    const name = playerName(room, socketId);
    let action = `${name} played ${cardLabel(card)}.`;

    // Going out ends the round immediately, before the card's effect.
    if (hand.length === 0) {
        endRound(room, socketId);
        return {room: getPublicRoom(room), roundOver: true};
    }

    const penalty = penaltyOf(card);

    if (penalty > 0) {
        // Draw penalties stack: the amounts add together.
        round.pendingDraw += penalty;
        action += ALLOW_PENALTY_STACKING
            ? ` Next player must draw ${round.pendingDraw} (or answer with a 2 / J♣).`
            : ` Next player must draw ${round.pendingDraw}.`;
        advanceTurn(room, 1);
    } else if (card.rank === "10") {
        action += " The next player is skipped.";
        advanceTurn(room, 2);
    } else if (card.rank === "A") {
        action += ` ${name} must play another card.`;
        // Same player continues, and must play if they can.
        round.extraTurn = true;
    } else if (card.rank === "8") {
        action += ` Suit is now ${SUIT_SYMBOLS[chosenSuit]} ${chosenSuit}.`;
        advanceTurn(room, 1);
    } else {
        advanceTurn(room, 1);
    }

    round.lastAction = action;
    return {room: getPublicRoom(room), roundOver: false};
}

function drawCard(socketId, rawCode) {
    const {room, round, hand} = getTurnContext(socketId, rawCode);
    const name = playerName(room, socketId);

    // Accept the draw penalty (the player then carries on with their turn).
    if (round.pendingDraw > 0) {
        const wanted = round.pendingDraw;
        const drawn = drawFromPile(round, wanted);
        hand.push(...drawn);
        round.pendingDraw = 0;
        setEvent(room, "draw", socketId, {count: drawn.length, penalty: true});

        // The turn is NOT over: after taking the penalty, the same player
        // can still play a matching card, or draw a card from the deck.
        round.lastAction = `${name} drew ${drawn.length} card${drawn.length === 1 ? "" : "s"} as a penalty and still plays.`;

        return {room: getPublicRoom(room)};
    }

    if (round.drawnCardId) {
        throw new Error("You already drew a card. Play it or pass.");
    }

    // Drawing instead of playing is allowed, except for the extra card after
    // an Ace, which is mandatory whenever a matching card can be played.
    if (round.extraTurn && hand.some((card) => canPlay(round, card))) {
        throw new Error("After an Ace you must play another card if you can.");
    }

    const [drawn] = drawFromPile(round, 1);

    if (!drawn) {
        round.lastAction = `${name} could not draw (no cards left) and passed.`;
        advanceTurn(room, 1);
        return {room: getPublicRoom(room)};
    }

    hand.push(drawn);
    setEvent(room, "draw", socketId, {count: 1, penalty: false});

    if (canPlay(round, drawn)) {
        // The drawn card is playable: the player may play it or pass.
        round.drawnCardId = drawn.id;
        round.lastAction = `${name} drew a card and may play it.`;
    } else {
        round.lastAction = `${name} drew a card and passed.`;
        advanceTurn(room, 1);
    }

    return {room: getPublicRoom(room)};
}

// Used after drawing a playable card the player chooses not to play.
function passTurn(socketId, rawCode) {
    const {room, round} = getTurnContext(socketId, rawCode);

    if (!round.drawnCardId) {
        throw new Error("You can only pass after drawing a playable card.");
    }

    round.lastAction = `${playerName(room, socketId)} passed.`;
    advanceTurn(room, 1);

    return {room: getPublicRoom(room)};
}

// ---------------------------------------------------------------------------
// End of round / game
// ---------------------------------------------------------------------------

function endRound(room, winnerId) {
    const round = room.round;

    const cards = Object.keys(round.hands).map((playerId) => {
        const hand = round.hands[playerId];
        const points =
            playerId === winnerId
                ? 0
                : hand.reduce((total, card) => total + cardPoints(card), 0);

        room.scores[playerId] = (room.scores[playerId] || 0) + points;

        const player = room.players.find((item) => item.id === playerId);
        if (player && room.scores[playerId] >= ELIMINATION_SCORE) {
            player.eliminated = true;
        }

        return {
            playerId,
            name: player?.name || "Player",
            card: [...hand], // cards left in hand
            points,
            total: room.scores[playerId],
            eliminated: Boolean(player?.eliminated),
        };
    });

    round.result = {
        number: round.number,
        cancelled: false,
        winnerId,
        winnerIds: [winnerId],
        cards,
    };

    round.lastAction = `${playerName(room, winnerId)} played their last card and won the round!`;
    room.history.push(cloneData(round.result));

    const remaining = activePlayers(room);

    if (remaining.length <= 1) {
        room.status = "finished";
        room.gameWinnerId = remaining[0]?.id ?? winnerId;
    }
}

// ---------------------------------------------------------------------------
// Disconnects
// ---------------------------------------------------------------------------

const RECONNECT_GRACE_MS = 60_000;
const disconnectTimers = new Map();

function markPlayerDisconnected(socketId, io) {
    for (const [code, room] of rooms) {
        const player = room.players.find((item) => item.id === socketId);

        if (!player) continue;

        player.connected = false;
        player.reconnectUntil = Date.now() + RECONNECT_GRACE_MS;

        const timerKey = `${code}:${socketId}`;
        clearTimeout(disconnectTimers.get(timerKey));

        const timer = setTimeout(() => {
            const currentRoom = rooms.get(code);
            if (!currentRoom) {
                disconnectTimers.delete(timerKey);
                return;
            }

            const currentPlayer = currentRoom.players.find(
                (item) => item.id === socketId,
            );

            if (
                !currentPlayer ||
                currentPlayer.connected !== false ||
                currentPlayer.reconnectUntil > Date.now()
            ) {
                disconnectTimers.delete(timerKey);
                return;
            }

            const result = removePlayer(socketId);

            disconnectTimers.delete(timerKey);

            if (!result) return;

            if (result.room) {
                io.to(result.code).emit("room:updated", result.room);
            } else {
                io.to(result.code).emit("room:closed");
            }
        }, RECONNECT_GRACE_MS);

        disconnectTimers.set(timerKey, timer);

        return {code, room: getPublicRoom(room)};
    }

    return null;
}

function removePlayer(socketId) {
    for (const [code, room] of rooms) {
        const index = room.players.findIndex(
            (player) => player.id === socketId,
        );

        if (index === -1) continue;

        const timerKey = `${code}:${socketId}`;
        clearTimeout(disconnectTimers.get(timerKey));
        disconnectTimers.delete(timerKey);

        room.players.splice(index, 1);
        delete room.scores[socketId];

        if (room.round) {
            delete room.round.hands[socketId];

            if (room.round.result) {
                room.round.result.cards = room.round.result.cards.filter(
                    (item) => item.playerId !== socketId,
                );
                room.round.result.winnerIds =
                    room.round.result.winnerIds.filter((id) => id !== socketId);
            }
        }

        if (room.players.length === 0) {
            rooms.delete(code);
            return {code, room: null};
        }

        if (room.hostId === socketId) {
            room.hostId = room.players[0].id;
        }

        // A round interrupted by a player leaving is cancelled (no points).
        if (room.status === "playing" && room.round && !room.round.result) {
            room.round.result = {
                number: room.round.number,
                cancelled: true,
                winnerId: null,
                winnerIds: [],
                cards: [],
            };
            room.round.lastAction =
                "A player left, so the round was cancelled.";
        }

        // If only one active player is left, they win the game.
        if (room.status === "playing") {
            const remaining = activePlayers(room);
            if (remaining.length <= 1) {
                room.status = "finished";
                room.gameWinnerId = remaining[0]?.id ?? null;
            }
        }

        return {code, room: getPublicRoom(room)};
    }

    return null;
}

// ---------------------------------------------------------------------------
// Match saving
// ---------------------------------------------------------------------------

function getCompletedMatchData(rawCode) {
    const room = findRoom(rawCode);

    if (!room || room.status !== "finished") {
        console.log("Match is not finished:", {
            found: Boolean(room),
            status: room?.status,
        });
        return null;
    }

    return {
        roomCode: room.code,
        players: room.players.map((player) => ({
            playerId: player.id,
            name: player.name,
            finalScore: room.scores[player.id] || 0,
            eliminated: Boolean(player.eliminated),
        })),
        rounds: cloneData(room.history),
        winnerId: room.gameWinnerId,
        targetScore: ELIMINATION_SCORE,
    };
}

function claimMatchSave(rawCode) {
    const room = findRoom(rawCode);

    if (!room || room.status !== "finished" || room.matchSaved) {
        return false;
    }

    room.matchSaved = true;
    return true;
}

module.exports = {
    createRoom,
    joinRoom,
    getRoomByCode,
    startRound,
    playCard,
    drawCard,
    passTurn,
    removePlayer,
    getCompletedMatchData,
    claimMatchSave,
    markPlayerDisconnected,
    getPrivateStates,
};
