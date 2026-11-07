const {
    getCardPoints,
    calculateHandPoints,
    isJackOfClubs,
    isDrawTwo,
    isDrawFive,
    isSkipCard,
    isAce,
    isWildCard,
} = require("./121Rules");

const testCards = [
    {rank: "2", suit: "hearts", value: 2},
    {rank: "8", suit: "spades", value: 8},
    {rank: "A", suit: "diamonds", value: 14},
    {rank: "J", suit: "clubs", value: 11},
    {rank: "Q", suit: "hearts", value: 12},
    {rank: "K", suit: "spades", value: 13},
    {rank: "10", suit: "diamonds", value: 10},
];

console.assert(getCardPoints(testCards[0]) === 2, "2 should be worth 2");
console.assert(getCardPoints(testCards[1]) === 0, "8 should be worth 0");
console.assert(getCardPoints(testCards[2]) === 0, "Ace should be worth 0");
console.assert(
    getCardPoints(testCards[3]) === 25,
    "Jack of Clubs should be worth 25",
);
console.assert(getCardPoints(testCards[4]) === 10, "Queen should be worth 10");
console.assert(getCardPoints(testCards[5]) === 10, "King should be worth 10");
console.assert(getCardPoints(testCards[6]) === 10, "10 should be worth 10");

const handPoints = calculateHandPoints(testCards);
console.assert(handPoints === 57, `Expected 57 points, got ${handPoints}`);

console.assert(isJackOfClubs(testCards[3]), "Should detect Jack of Clubs");
console.assert(isDrawTwo(testCards[0]), "Should detect draw two");
console.assert(isDrawFive(testCards[3]), "Should detect draw five");
console.assert(isSkipCard(testCards[6]), "Should detect skip card");
console.assert(isAce(testCards[2]), "Should detect Ace");
console.assert(isWildCard(testCards[1]), "Should detect wild card");

console.log("121 rules tests passed!");
