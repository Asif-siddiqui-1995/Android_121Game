const crypto = require("node:crypto");
const {createDeck, shuffleDeck} = require("../game/deck");

const rooms = new Map();
// playerId -> room code, so lookups by player do not scan every room.
const playerRooms = new Map();
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
const BOT_NAMES = ["Nancy", "Maya", "Rashmi", "Zoya", "Tanu"];

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
    return structuredClone(data);
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

// The room a (human) player is currently seated in, if any.
function findPlayerRoom(playerId) {
    const code = playerRooms.get(playerId);
    const room = code ? rooms.get(code) : null;

    if (!room || !room.players.some((player) => player.id === playerId)) {
        playerRooms.delete(playerId);
        return null;
    }

    return room;
}

function getPlayerRoomCode(playerId) {
    return findPlayerRoom(playerId)?.code ?? null;
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

    // 2-player 10: the turn came straight back, so the player must draw first.
    if (round.tenDraw) return false;

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
    round.aceFinish = false;
    round.tenDraw = false;
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
        solo: Boolean(room.solo),
        status: room.status,
        roundNumber: room.roundNumber,
        targetScore: ELIMINATION_SCORE,
        maxPlayers: MAX_PLAYERS,
        players: room.players.map((player) => ({
            id: player.id,
            name: player.name,
            isHost: player.id === room.hostId,
            isDealer: round ? round.dealerId === player.id : false,
            isBot: Boolean(player.isBot),
            connected: player.connected !== false,
            score: room.scores[player.id] || 0,
            eliminated: Boolean(player.eliminated),
            cardCount: round?.hands[player.id]?.length ?? 0,
        })),
        currentPlayerId: round && !round.result ? round.currentPlayerId : null,
        topCard: round ? topCardOf(round) : null,
        chosenSuit: round?.chosenSuit ?? null,
        pendingDraw: round?.pendingDraw ?? 0,
        drawPileCount: round?.drawPile.length ?? 0,
        canPass: Boolean(round?.drawnCardId) && !round?.aceFinish,
        aceFinish: Boolean(round?.aceFinish),
        extraTurn: Boolean(round?.extraTurn),
        tenDraw: Boolean(round?.tenDraw),
        recentDiscards: round ? round.discardPile.slice(-6) : [],
        lastEvent: room.lastEvent || null,
        lastAction: round?.lastAction ?? "",
        roundResult: round?.result ?? null,
        gameWinnerId: room.gameWinnerId || null,
        // Sent once the match is over. Each phone stores it in its own
        // match history (there is no server database).
        matchResult: getMatchResult(room),
    };
}

// Each player's private hand, plus which of their cards are playable now.
function getPrivateStates(rawCode) {
    const room = findRoom(rawCode);
    if (!room?.round) return {};

    const round = room.round;
    const states = {};

    for (const player of room.players) {
        if (player.isBot) continue; // bots have no socket to send to

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

function createRoom(playerId, rawName) {
    const name = cleanName(rawName);
    if (!name) throw new Error("Enter a player name.");

    const code = generateRoomCode();
    const room = {
        code,
        hostId: playerId,
        dealerId: playerId,
        status: "waiting",
        players: [{id: playerId, name, eliminated: false, connected: true}],
        scores: {[playerId]: 0},
        roundNumber: 0,
        round: null,
        gameWinnerId: null,
        history: [],
        finishedAt: null,
        eventSeq: 0,
        lastEvent: null,
        solo: false,
    };

    rooms.set(code, room);
    playerRooms.set(playerId, code);
    return getPublicRoom(room);
}

// Throws if the player cannot join this room. Returns the room otherwise.
function assertCanJoin(playerId, rawCode, rawName) {
    const room = findRoom(rawCode);

    if (!cleanName(rawName)) throw new Error("Enter a player name.");
    if (!room) throw new Error("Room not found. Check the invite code.");

    // Already seated here (e.g. tapped Join twice): always fine.
    if (room.players.some((player) => player.id === playerId)) return room;

    if (room.solo) throw new Error("This is a solo game.");
    if (room.status !== "waiting") {
        throw new Error("This game has already started.");
    }
    if (room.players.length >= MAX_PLAYERS) {
        throw new Error("This room is full.");
    }

    return room;
}

function joinRoom(playerId, rawCode, rawName) {
    const room = assertCanJoin(playerId, rawCode, rawName);

    if (room.players.some((player) => player.id === playerId)) {
        return getPublicRoom(room);
    }

    room.players.push({
        id: playerId,
        name: cleanName(rawName),
        eliminated: false,
        connected: true,
    });
    room.scores[playerId] = 0;
    playerRooms.set(playerId, room.code);

    return getPublicRoom(room);
}

function getRoomByCode(rawCode) {
    const room = findRoom(rawCode);
    return room ? getPublicRoom(room) : null;
}

function startRound(playerId, rawCode) {
    const room = findRoom(rawCode);

    if (!room) throw new Error("Room not found.");

    if (room.hostId !== playerId) {
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
        aceFinish: false,
        tenDraw: false,
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

function getTurnContext(playerId, rawCode) {
    const room = findRoom(rawCode);

    if (!room) throw new Error("Room not found.");
    if (room.status !== "playing" || !room.round) {
        throw new Error("The game is not currently playing.");
    }

    const round = room.round;

    if (round.result) throw new Error("This round has already finished.");
    if (!round.hands[playerId]) {
        throw new Error("You are not a player in this round.");
    }
    if (round.currentPlayerId !== playerId) {
        throw new Error("It is not your turn.");
    }

    return {room, round, hand: round.hands[playerId]};
}

function playCard(playerId, rawCode, cardId, rawSuit) {
    const {room, round, hand} = getTurnContext(playerId, rawCode);

    const cardIndex = hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) throw new Error("That card is not in your hand.");

    const card = hand[cardIndex];

    if (!canPlay(round, card)) {
        throw new Error(
            round.pendingDraw > 0
                ? ALLOW_PENALTY_STACKING
                    ? `Play a 2 or the Jack of Clubs, or draw ${round.pendingDraw} cards.`
                    : `You must draw ${round.pendingDraw} cards.`
                : round.tenDraw
                  ? "You played a 10 and the turn came back to you: draw a card first."
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
    setEvent(room, "play", playerId, {card});

    const name = playerName(room, playerId);
    let action = `${name} played ${cardLabel(card)}.`;
    const penalty = penaltyOf(card);

    round.aceFinish = false;
    round.tenDraw = false;

    // 2 players: a 10 skips the opponent, so the turn comes straight back.
    // The player must then draw a card instead of playing from their hand.
    const twoPlayerTen =
        card.rank === "10" && activePlayers(room).length === 2;

    if (hand.length === 0 && twoPlayerTen) {
        // Going out with a 10 (2 players): draw a card. If it can be played,
        // the player plays it and wins; otherwise the opponent plays on.
        round.aceFinish = true;
        round.tenDraw = true;
        round.lastAction = `${name} played their last card, a 10, and must draw a card. If it can be played, ${name} wins the round.`;
        return {room: getPublicRoom(room), roundOver: false};
    }

    if (hand.length === 0) {
        // Going out with an Ace: the player must draw one more card. If it
        // can be played they win, otherwise the round goes on.
        if (card.rank === "A") {
            round.aceFinish = true;
            round.extraTurn = true;
            round.lastAction = `${name} played their last card, an Ace, and must draw a card. If it can be played, ${name} wins the round.`;
            return {room: getPublicRoom(room), roundOver: false};
        }

        // Going out with a 2 or the Jack of Clubs: the next player still
        // draws the penalty, and those cards count toward their score.
        let note = "";
        if (penalty > 0) {
            const victimId = nextActiveId(room, playerId, 1);
            const total = round.pendingDraw + penalty;
            const drawn = drawFromPile(round, total);
            round.hands[victimId].push(...drawn);
            round.pendingDraw = 0;
            note = `${playerName(room, victimId)} draws ${drawn.length} card${drawn.length === 1 ? "" : "s"}, which count toward their score.`;
        }

        endRound(room, playerId, note);
        return {room: getPublicRoom(room), roundOver: true};
    }

    if (penalty > 0) {
        // Draw penalties stack: the amounts add together.
        round.pendingDraw += penalty;
        action += ALLOW_PENALTY_STACKING
            ? ` Next player must draw ${round.pendingDraw} (or answer with a 2 / J♣).`
            : ` Next player must draw ${round.pendingDraw}.`;
        advanceTurn(room, 1);
    } else if (twoPlayerTen) {
        action += ` The other player is skipped, so ${name} must draw a card. If it matches, ${name} plays again.`;
        advanceTurn(room, 2); // back to the same player (clears flags)
        round.tenDraw = true;
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

function drawCard(playerId, rawCode) {
    const {room, round, hand} = getTurnContext(playerId, rawCode);
    const name = playerName(room, playerId);

    // Accept the draw penalty (the player then carries on with their turn).
    if (round.pendingDraw > 0) {
        const wanted = round.pendingDraw;
        const drawn = drawFromPile(round, wanted);
        hand.push(...drawn);
        round.pendingDraw = 0;
        setEvent(room, "draw", playerId, {count: drawn.length, penalty: true});

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
    round.tenDraw = false; // the required draw has been made

    if (!drawn) {
        // Went out with an Ace and nothing is left to draw: they win.
        if (round.aceFinish && hand.length === 0) {
            endRound(room, playerId, "There were no cards left to draw.");
            return {room: getPublicRoom(room)};
        }

        round.lastAction = `${name} could not draw (no cards left) and passed.`;
        advanceTurn(room, 1);
        return {room: getPublicRoom(room)};
    }

    hand.push(drawn);
    setEvent(room, "draw", playerId, {count: 1, penalty: false});

    if (canPlay(round, drawn)) {
        // The drawn card is playable: the player may play it or pass.
        round.drawnCardId = drawn.id;
        round.lastAction = round.aceFinish
            ? `${name} drew a card and must play it to win.`
            : `${name} drew a card and may play it.`;
    } else {
        round.lastAction = round.aceFinish
            ? `${name} drew a card that cannot be played, so the round goes on.`
            : `${name} drew a card and passed.`;
        advanceTurn(room, 1);
    }

    return {room: getPublicRoom(room)};
}

// Used after drawing a playable card the player chooses not to play.
function passTurn(playerId, rawCode) {
    const {room, round} = getTurnContext(playerId, rawCode);

    if (!round.drawnCardId) {
        throw new Error("You can only pass after drawing a playable card.");
    }

    if (round.aceFinish) {
        throw new Error(
            "You played your last card, so you must play the card you drew.",
        );
    }

    round.lastAction = `${playerName(room, playerId)} passed.`;
    advanceTurn(room, 1);

    return {room: getPublicRoom(room)};
}

// ---------------------------------------------------------------------------
// End of round / game
// ---------------------------------------------------------------------------

function endRound(room, winnerId, note = "") {
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

    round.lastAction = `${playerName(room, winnerId)} played their last card and won the round!${note ? ` ${note}` : ""}`;
    room.history.push(cloneData(round.result));

    const remaining = activePlayers(room);

    if (remaining.length <= 1) {
        room.status = "finished";
        room.gameWinnerId = remaining[0]?.id ?? winnerId;
        room.finishedAt = new Date().toISOString();
    }
}

// ---------------------------------------------------------------------------
// Disconnects and reconnects
//
// Players are identified by a permanent playerId sent by the app, not by
// socket.id (which changes on every reconnect). When a connection drops the
// player keeps their seat for RECONNECT_GRACE_MS and can come back.
// ---------------------------------------------------------------------------

const RECONNECT_GRACE_MS = 120_000;
const disconnectTimers = new Map();

// onExpire(result) is called if the player does not come back in time and is
// removed from the room. result has the same shape as removePlayer().
function markPlayerDisconnected(playerId, onExpire) {
    const room = findPlayerRoom(playerId);
    if (!room) return null;

    const code = room.code;
    const player = room.players.find((item) => item.id === playerId);

    player.connected = false;
    player.reconnectUntil = Date.now() + RECONNECT_GRACE_MS;

    const timerKey = `${code}:${playerId}`;
    clearTimeout(disconnectTimers.get(timerKey));

    const timer = setTimeout(() => {
        const currentRoom = rooms.get(code);
        if (!currentRoom) {
            disconnectTimers.delete(timerKey);
            return;
        }

        const currentPlayer = currentRoom.players.find(
            (item) => item.id === playerId,
        );

        if (
            !currentPlayer ||
            currentPlayer.connected !== false ||
            currentPlayer.reconnectUntil > Date.now()
        ) {
            disconnectTimers.delete(timerKey);
            return;
        }

        disconnectTimers.delete(timerKey);

        const result = removePlayer(playerId);
        if (result && onExpire) onExpire(result);
    }, RECONNECT_GRACE_MS);

    disconnectTimers.set(timerKey, timer);

    return {code, room: getPublicRoom(room)};
}

// Called when a known player connects again. Gives their seat back.
function reconnectPlayer(playerId) {
    const room = findPlayerRoom(playerId);
    if (!room) return null;

    const code = room.code;
    const player = room.players.find((item) => item.id === playerId);

    player.connected = true;
    delete player.reconnectUntil;

    const timerKey = `${code}:${playerId}`;
    clearTimeout(disconnectTimers.get(timerKey));
    disconnectTimers.delete(timerKey);

    return {code, room: getPublicRoom(room)};
}

function removePlayer(playerId) {
    const room = findPlayerRoom(playerId);
    if (!room) return null;

    const code = room.code;
    const index = room.players.findIndex((player) => player.id === playerId);

    playerRooms.delete(playerId);

    const timerKey = `${code}:${playerId}`;
    clearTimeout(disconnectTimers.get(timerKey));
    disconnectTimers.delete(timerKey);

    room.players.splice(index, 1);
    delete room.scores[playerId];

    if (room.round) {
        delete room.round.hands[playerId];

        if (room.round.result) {
            room.round.result.cards = room.round.result.cards.filter(
                (item) => item.playerId !== playerId,
            );
            room.round.result.winnerIds =
                room.round.result.winnerIds.filter((id) => id !== playerId);
        }
    }

    // No humans left (bots do not count): close the room.
    if (room.players.every((player) => player.isBot)) {
        deleteRoom(room);
        return {code, room: null};
    }

    if (room.hostId === playerId) {
        const nextHost =
            room.players.find((player) => !player.isBot) || room.players[0];
        room.hostId = nextHost.id;
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
            room.finishedAt = new Date().toISOString();
        }
    }

    return {code, room: getPublicRoom(room)};
}

function deleteRoom(room) {
    rooms.delete(room.code);

    for (const player of room.players) {
        if (playerRooms.get(player.id) === room.code) {
            playerRooms.delete(player.id);
        }
        const timerKey = `${room.code}:${player.id}`;
        clearTimeout(disconnectTimers.get(timerKey));
        disconnectTimers.delete(timerKey);
    }
}

// ---------------------------------------------------------------------------
// Match result (stored on each phone, not on the server)
// ---------------------------------------------------------------------------

function getMatchResult(room) {
    if (room.status !== "finished" || !room.history.length) return null;

    return {
        _id: `${room.code}-${room.finishedAt}`,
        roomCode: room.code,
        solo: Boolean(room.solo),
        players: room.players.map((player) => ({
            playerId: player.id,
            name: player.name,
            finalScore: room.scores[player.id] || 0,
            eliminated: Boolean(player.eliminated),
        })),
        rounds: cloneData(room.history),
        winnerId: room.gameWinnerId,
        targetScore: ELIMINATION_SCORE,
        finishedAt: room.finishedAt,
    };
}

// ---------------------------------------------------------------------------
// Solo mode: bots
// ---------------------------------------------------------------------------

function createSoloRoom(playerId, rawName, rawBots) {
    const botCount = Math.min(
        Math.max(parseInt(rawBots, 10) || 1, 1),
        MAX_PLAYERS - 1,
    );

    const publicRoom = createRoom(playerId, rawName);
    const room = rooms.get(publicRoom.code);
    room.solo = true;

    for (let i = 0; i < botCount; i++) {
        const id = `bot-${room.code}-${i + 1}`;
        room.players.push({
            id,
            name: BOT_NAMES[i],
            eliminated: false,
            isBot: true,
            connected: true,
        });
        room.scores[id] = 0;
    }

    return getPublicRoom(room);
}

function bestSuit(hand, excludeId) {
    const counts = Object.fromEntries(SUITS.map((s) => [s, 0]));
    for (const card of hand) if (card.id !== excludeId) counts[card.suit]++;
    return [...SUITS].sort((a, b) => counts[b] - counts[a])[0];
}

function chooseBotMove(round, botId) {
    const hand = round.hands[botId];

    // Facing a penalty: stack if allowed, otherwise draw.
    if (round.pendingDraw > 0) {
        const stacker = ALLOW_PENALTY_STACKING
            ? hand.find((card) => canPlay(round, card))
            : null;
        return stacker ? {type: "play", cardId: stacker.id} : {type: "draw"};
    }

    const playable = hand.filter((card) => canPlay(round, card));
    if (playable.length === 0) return {type: "draw"};

    // Keep 8s as a rescue card and dump the highest-point cards first
    // (the Jack of Clubs is worth 25, so it goes early).
    const normal = playable.filter((card) => card.rank !== "8");
    const pool = normal.length ? normal : playable;
    pool.sort((a, b) => cardPoints(b) - cardPoints(a));

    const card = pool[0];
    return {
        type: "play",
        cardId: card.id,
        suit: card.rank === "8" ? bestSuit(hand, card.id) : undefined,
    };
}

function isBotTurn(rawCode) {
    const room = findRoom(rawCode);
    if (!room || room.status !== "playing" || !room.round) return false;
    if (room.round.result) return false;
    const current = room.players.find(
        (p) => p.id === room.round.currentPlayerId,
    );
    return Boolean(current?.isBot);
}

function runBotTurn(rawCode) {
    if (!isBotTurn(rawCode)) return null;

    const room = findRoom(rawCode);
    const botId = room.round.currentPlayerId;
    const move = chooseBotMove(room.round, botId);

    try {
        if (move.type === "play") {
            return playCard(botId, rawCode, move.cardId, move.suit);
        }
        return drawCard(botId, rawCode);
    } catch (error) {
        // Safety net so a bot can never freeze the table.
        console.error("Bot move failed:", error.message);
        try {
            return drawCard(botId, rawCode);
        } catch {
            return passTurn(botId, rawCode);
        }
    }
}

module.exports = {
    createRoom,
    createSoloRoom,
    joinRoom,
    getRoomByCode,
    startRound,
    playCard,
    drawCard,
    passTurn,
    removePlayer,
    markPlayerDisconnected,
    reconnectPlayer,
    getPrivateStates,
    getPlayerRoomCode,
    assertCanJoin,
    isBotTurn,
    runBotTurn,
};
