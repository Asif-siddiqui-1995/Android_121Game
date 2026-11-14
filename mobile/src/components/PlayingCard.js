import React, {memo} from "react";
import {View, Pressable, StyleSheet} from "react-native";
import {GlyphText, SuitIcon, suitKey} from "./Glyphs";

// Every card is drawn from its width, so it fits the layout on every screen.
// Height always follows the same ratio (see GameScreen/utils CARD_RATIO).
const CARD_RATIO = 1.45;

const PRESET_WIDTHS = {sm: 42, md: 66, lg: 96};
const BACK_GOLD = "#E8BB65";

function isRed(suit) {
    const key = suitKey(suit);
    return key === "hearts" || key === "diamonds";
}

function dims(width, size) {
    const w = Math.round(width || PRESET_WIDTHS[size] || PRESET_WIDTHS.md);
    return {
        width: w,
        height: Math.round(w * CARD_RATIO),
        rank: Math.max(9, Math.round(w * 0.3)),
        centerSuit: Math.round(w * 0.68),
        radius: Math.max(4, Math.round(w * 0.12)),
        inset: Math.max(3, Math.round(w * 0.08)),
    };
}

// Card back
export const CardBack = memo(function CardBack({size = "md", width, style}) {
    const s = dims(width, size);
    const suitSize = Math.round(s.width * 0.24);

    return (
        <View
            style={[
                styles.cardBack,
                {
                    width: s.width,
                    height: s.height,
                    borderRadius: s.radius,
                    padding: Math.max(2, Math.round(s.width * 0.06)),
                },
                style,
            ]}
        >
            <View style={styles.backInner}>
                <SuitIcon suit="spades" size={suitSize} color={BACK_GOLD} />
                <SuitIcon suit="hearts" size={suitSize} color={BACK_GOLD} />
            </View>
        </View>
    );
});

// Playing card
function PlayingCard({
    card,
    size = "md",
    width,
    playable = false,
    dimmed = false,
    onPress,
    style,
}) {
    if (!card) return null;

    const s = dims(width, size);
    const cardColor = isRed(card.suit) ? "#C32643" : "#191919";
    const rank = (
        <GlyphText
            text={String(card.rank)}
            size={s.rank}
            color={cardColor}
            letterSpacing={-s.rank * 0.06}
        />
    );

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
            <View style={[styles.topCorner, {top: s.inset, left: s.inset}]}>
                {rank}
            </View>

            <View style={styles.center}>
                <SuitIcon
                    suit={card.suit}
                    size={s.centerSuit}
                    color={cardColor}
                />
            </View>

            <View
                style={[
                    styles.bottomCorner,
                    {bottom: s.inset, right: s.inset},
                ]}
            >
                {rank}
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

export default memo(PlayingCard);

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFEFA",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",

        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.14,
        shadowRadius: 3,
        elevation: 2,
    },

    topCorner: {
        position: "absolute",
        alignItems: "center",
        zIndex: 2,
    },

    bottomCorner: {
        position: "absolute",
        alignItems: "center",
        transform: [{rotate: "180deg"}],
        zIndex: 2,
    },

    center: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },

    playableShadow: {
        shadowColor: "#E5AF39",
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 5,
    },

    cardBack: {
        backgroundColor: "#64142F",
        borderWidth: 1.5,
        borderColor: "#D6A64D",
        alignItems: "center",
        justifyContent: "center",

        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
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
});
