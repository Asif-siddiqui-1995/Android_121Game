import React, {useMemo} from "react";
import {StyleSheet, Text, useWindowDimensions, View} from "react-native";

const CELL = 64;
const INK = "rgba(255,255,255,0.075)";

// Order repeats diagonally, like the doodle wallpaper in a chat app.
const KINDS = [
    "card",
    "♠",
    "card",
    "♥",
    "card",
    "♦",
    "card",
    "♣",
    "card",
    "♥",
    "card",
    "♠",
    "card",
    "♣",
    "card",
    "♦",
];
const CARD_SUITS = ["♠", "♥", "♣", "♦"];

function random(seed) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

function Item({item}) {
    const common = {
        position: "absolute",
        left: item.x,
        top: item.y,
        transform: [{rotate: `${item.rot}deg`}],
    };

    if (item.kind === "card") {
        return (
            <View style={[common, styles.mini]}>
                <Text style={styles.miniSuit}>{item.suit}</Text>
            </View>
        );
    }

    return (
        <Text
            style={[
                common,
                {
                    color: INK,
                    fontSize: item.size,
                    fontWeight: "700",
                },
            ]}
        >
            {item.kind}
        </Text>
    );
}

// A tiled, softly rotated wallpaper of card symbols.
function CardPattern() {
    const {width, height} = useWindowDimensions();

    const items = useMemo(() => {
        const rand = random(121);
        const cols = Math.ceil(width / CELL) + 1;
        const rows = Math.ceil(height / CELL) + 1;
        const out = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const index = r * 5 + c * 3;
                out.push({
                    key: `${r}-${c}`,
                    kind: KINDS[index % KINDS.length],
                    suit: CARD_SUITS[(r + c) % CARD_SUITS.length],
                    x: c * CELL + (r % 2 ? CELL / 2 : 0) + rand() * 10 - 22,
                    y: r * CELL + rand() * 10 - 10,
                    rot: Math.round(rand() * 56 - 28),
                    size: 20 + Math.round(rand() * 8),
                });
            }
        }

        return out;
    }, [width, height]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {items.map((item) => (
                <Item key={item.key} item={item} />
            ))}
        </View>
    );
}

export default React.memo(CardPattern);

const styles = StyleSheet.create({
    mini: {
        width: 22,
        height: 30,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: INK,
        alignItems: "center",
        justifyContent: "center",
    },
    miniSuit: {color: INK, fontSize: 12},
});
