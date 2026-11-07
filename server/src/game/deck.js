const SUITS = ["clubs", "diamonds", "hearts", "spades"];

const RANKS = [
    {name: "2", value: 2},
    {name: "3", value: 3},
    {name: "4", value: 4},
    {name: "5", value: 5},
    {name: "6", value: 6},
    {name: "7", value: 7},
    {name: "8", value: 8},
    {name: "9", value: 9},
    {name: "10", value: 10},
    {name: "J", value: 11},
    {name: "Q", value: 12},
    {name: "K", value: 13},
    {name: "A", value: 14},
];

function createDeck() {
    return SUITS.flatMap((suit) =>
        RANKS.map((rank) => ({
            suit,
            rank: rank.name,
            value: rank.value,
            id: `${rank.name}-${suit}`,
        })),
    );
}

function shuffleDeck(cards) {
    const deck = [...cards];

    // Fisher-Yates shuffle.
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

module.exports = {createDeck, shuffleDeck};
