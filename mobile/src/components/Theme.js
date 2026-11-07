export const colors = {
    baizeDeep: "#4A1628", // screen background (wine)
    baize: "#38101E", // panels and table surface
    baizeLight: "#5A2237", // raised panels, inputs
    line: "rgba(255,255,255,0.12)",
    ivory: "#F6EFE0", // card faces
    ink: "#1D1B24",
    suitRed: "#B3261E",
    saffron: "#F2B544", // the one accent: turn, playable, primary action
    saffronDark: "#A67A25",
    text: "#F3E6D8",
    textMuted: "#B99AA3",
    danger: "#E5604F",
};

// Poppins, loaded in App.js. Custom fonts need one family name per weight,
// so <Text> (components/AppText.js) turns fontWeight/fontStyle into these.
const REGULAR = {
    400: "Poppins_400Regular",
    500: "Poppins_500Medium",
    600: "Poppins_600SemiBold",
    700: "Poppins_700Bold",
    800: "Poppins_800ExtraBold",
    900: "Poppins_900Black",
};
const ITALIC = {
    400: "Poppins_400Regular_Italic",
    700: "Poppins_700Bold_Italic",
};

export function fontFor(weight, italic = false) {
    let w = 400;
    if (weight === "bold") w = 700;
    else if (weight && weight !== "normal") w = parseInt(weight, 10) || 400;

    if (italic) return w >= 600 ? ITALIC[700] : ITALIC[400];

    const keys = Object.keys(REGULAR).map(Number);
    const nearest = keys.reduce((a, b) =>
        Math.abs(b - w) < Math.abs(a - w) ? b : a,
    );
    return REGULAR[nearest];
}

export const SUIT_SYMBOLS = {
    clubs: "♣",
    diamonds: "♦",
    hearts: "♥",
    spades: "♠",
};

export const SUIT_ORDER = ["clubs", "diamonds", "hearts", "spades"];
export const RANK_ORDER = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];

export const isRedSuit = (suit) => suit === "hearts" || suit === "diamonds";

// Sort a hand by suit, then rank, so it reads like a held fan.
export function sortHand(hand) {
    return [...hand].sort((a, b) => {
        const suitDiff =
            SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit);
        if (suitDiff !== 0) return suitDiff;
        return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
    });
}

const AVATAR_COLORS = [
    "#C8553D",
    "#5B8E7D",
    "#7B6CA8",
    "#D08C3E",
    "#4F7CAC",
    "#A84F6E",
];

export function avatarColor(name = "") {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
