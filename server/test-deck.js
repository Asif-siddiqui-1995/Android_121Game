const {createDeck, shuffleDeck} = require("./src/game/deck");

const deck = createDeck();
const shuffled = shuffleDeck(deck);

console.log("Total cards:", deck.length);
console.log("Unique cards:", new Set(deck.map((card) => card.id)).size);
console.log("Shuffled deck:", shuffled.length);
console.log("Sample card:", shuffled[0]);

if (deck.length !== 52 || new Set(deck.map((card) => card.id)).size !== 52) {
    throw new Error("Deck validation failed!");
}

console.log("Deck test passed!");
