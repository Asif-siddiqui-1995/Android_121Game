const SPECIAL_CARDS = {
    DRAW_TWO: "2",
    DRAW_FIVE: "J-clubs",
    SKIP: "10",
    ACE: "A",
    WILD: "8",
};

// Returns the points a card adds to a player's score.
function getCardPoints(card) {
    if (!card) return 0;

    // Jack of Clubs is worth 25 points.
    if (card.rank === "J" && card.suit === "clubs") {
        return 25;
    }

    // Ace and 8 are worth zero.
    if (card.rank === "A" || card.rank === "8") {
        return 0;
    }

    // Number cards are worth their face value.
    if (["2", "3", "4", "5", "6", "7", "9", "10"].includes(card.rank)) {
        return Number(card.rank);
    }

    // Other face cards are worth 10.
    if (["J", "Q", "K"].includes(card.rank)) {
        return 10;
    }

    return 0;
}

// Returns the total points in a player's remaining hand.
function calculateHandPoints(hand) {
    return hand.reduce((total, card) => {
        return total + getCardPoints(card);
    }, 0);
}

// Checks whether a card is the Jack of Clubs.
function isJackOfClubs(card) {
    return card?.rank === "J" && card?.suit === "clubs";
}

function isDrawTwo(card) {
    return card?.rank === "2";
}

function isDrawFive(card) {
    return isJackOfClubs(card);
}

function isSkipCard(card) {
    return card?.rank === "10";
}

function isAce(card) {
    return card?.rank === "A";
}

function isWildCard(card) {
    return card?.rank === "8";
}

module.exports = {
    SPECIAL_CARDS,
    getCardPoints,
    calculateHandPoints,
    isJackOfClubs,
    isDrawTwo,
    isDrawFive,
    isSkipCard,
    isAce,
    isWildCard,
};
