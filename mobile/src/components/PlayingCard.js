import React from "react";
import {View, Text, Pressable, StyleSheet} from "react-native";

const CARD_SIZES = {
    sm: {
        width: 42,
        height: 62,
        rank: 13,
        centerSuit: 25,
        radius: 6,
    },
    md: {
        width: 66,
        height: 96,
        rank: 18,
        centerSuit: 43,
        radius: 8,
    },
    lg: {
        width: 96,
        height: 138,
        rank: 24,
        centerSuit: 65,
        radius: 10,
    },
};

const SUITS = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
    h: "♥",
    d: "♦",
    c: "♣",
    s: "♠",
    "♥": "♥",
    "♦": "♦",
    "♣": "♣",
    "♠": "♠",
};

function getSuit(suit) {
    const key = String(suit).toLowerCase();
    return SUITS[key] || suit;
}

function isRed(suit) {
    const key = String(suit).toLowerCase();

    return (
        key === "hearts" ||
        key === "diamonds" ||
        key === "h" ||
        key === "d" ||
        key === "♥" ||
        key === "♦"
    );
}

// Card back
export function CardBack({size = "md", style}) {
    const s = CARD_SIZES[size] || CARD_SIZES.md;

    return (
        <View
            style={[
                styles.cardBack,
                {
                    width: s.width,
                    height: s.height,
                    borderRadius: s.radius,
                },
                style,
            ]}
        >
            <View style={styles.backInner}>
                <Text style={styles.backSuit}>♠</Text>

                {/* <Text
                    style={[
                        styles.backLogo,
                        {
                            fontSize:
                                size === "sm" ? 12 : size === "lg" ? 22 : 17,
                        },
                    ]}
                >
                    121
                </Text> */}

                <Text style={styles.backSuit}>♥</Text>
            </View>
        </View>
    );
}

// Playing card
export default function PlayingCard({
    card,
    size = "md",
    playable = false,
    dimmed = false,
    onPress,
    style,
}) {
    if (!card) return null;

    const s = CARD_SIZES[size] || CARD_SIZES.md;

    const suit = getSuit(card.suit);
    const cardColor = isRed(card.suit) ? "#C32643" : "#191919";

    const cardFace = (
        <View
            style={[
                styles.card,
                {
                    width: s.width,
                    height: s.height,
                    borderRadius: s.radius,
                    borderColor: playable ? "#E5AF39" : "#D8D0C3",
                    borderWidth: playable ? 2.5 : 1,
                    opacity: dimmed ? 0.4 : 1,
                },
                playable && styles.playableShadow,
                style,
            ]}
        >
            {/* Top-left rank ONLY */}
            <View style={styles.topCorner}>
                <Text
                    style={[
                        styles.rank,
                        {
                            color: cardColor,
                            fontSize: s.rank,
                        },
                    ]}
                >
                    {card.rank}
                </Text>
            </View>

            {/* Single large suit in the centre */}
            <View style={styles.center}>
                <Text
                    style={{
                        color: cardColor,
                        fontSize: s.centerSuit,
                        fontWeight: "400",
                        lineHeight: s.centerSuit + 5,
                    }}
                >
                    {suit}
                </Text>
            </View>

            {/* Bottom-right rank ONLY */}
            <View style={styles.bottomCorner}>
                <Text
                    style={[
                        styles.rank,
                        {
                            color: cardColor,
                            fontSize: s.rank,
                        },
                    ]}
                >
                    {card.rank}
                </Text>
            </View>
        </View>
    );

    if (!onPress) {
        return cardFace;
    }

    return (
        <Pressable
            onPress={onPress}
            disabled={!playable || dimmed}
            style={{borderRadius: s.radius}}
            accessibilityRole="button"
            accessibilityLabel={`${card.rank} of ${card.suit}`}
            accessibilityState={{
                disabled: !playable || dimmed,
            }}
        >
            {cardFace}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFEFA",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.14,
        shadowRadius: 3,
        elevation: 3,
    },

    topCorner: {
        position: "absolute",
        top: 5,
        left: 6,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },

    bottomCorner: {
        position: "absolute",
        bottom: 5,
        right: 6,
        alignItems: "center",
        justifyContent: "center",
        transform: [{rotate: "180deg"}],
        zIndex: 2,
    },

    rank: {
        fontWeight: "900",
        textAlign: "center",
    },

    center: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },

    playableShadow: {
        shadowColor: "#E5AF39",
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 7,
    },

    cardBack: {
        backgroundColor: "#64142F",
        borderWidth: 1.5,
        borderColor: "#D6A64D",
        alignItems: "center",
        justifyContent: "center",
        padding: 4,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },

    backInner: {
        flex: 1,
        width: "100%",
        borderWidth: 1,
        borderColor: "rgba(232,187,101,0.65)",
        alignItems: "center",
        justifyContent: "space-evenly",
        borderRadius: 4,
    },

    backSuit: {
        color: "#E8BB65",
        fontSize: 18,
    },

    backLogo: {
        color: "#FFE4A5",
        fontWeight: "900",
        letterSpacing: 2,
    },
});
