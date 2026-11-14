import React, {useMemo} from "react";
import {StyleSheet, useWindowDimensions, View} from "react-native";
import Svg, {G, Rect} from "react-native-svg";
import {SuitShape} from "./Glyphs";

const CELL = 64;
const INK = "rgba(255,255,255,0.075)";

// Order repeats diagonally, like the doodle wallpaper in a chat app.
const KINDS = [
    "card",
    "spades",
    "card",
    "hearts",
    "card",
    "diamonds",
    "card",
    "clubs",
    "card",
    "hearts",
    "card",
    "spades",
    "card",
    "clubs",
    "card",
    "diamonds",
];
const CARD_SUITS = ["spades", "hearts", "clubs", "diamonds"];

// Mini card outline size.
const MINI_W = 22;
const MINI_H = 30;

function random(seed) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

// One doodle, rotated around its own centre.
function Item({item}) {
    if (item.kind === "card") {
        const cx = item.x + MINI_W / 2;
        const cy = item.y + MINI_H / 2;
        return (
            <G transform={`rotate(${item.rot} ${cx} ${cy})`}>
                <Rect
                    x={item.x + 0.75}
                    y={item.y + 0.75}
                    width={MINI_W - 1.5}
                    height={MINI_H - 1.5}
                    rx={4}
                    fill="none"
                    stroke={INK}
                    strokeWidth={1.5}
                />
                <G
                    transform={`translate(${cx - 4.5} ${cy - 4.5}) scale(0.09)`}
                >
                    <SuitShape suit={item.suit} color={INK} />
                </G>
            </G>
        );
    }

    // A loose suit symbol, about the size the old text glyph had.
    const size = item.size * 0.8;
    const cx = item.x + size / 2;
    const cy = item.y + size / 2;
    return (
        <G
            transform={`rotate(${item.rot} ${cx} ${cy}) translate(${item.x} ${item.y}) scale(${size / 100})`}
        >
            <SuitShape suit={item.kind} color={INK} />
        </G>
    );
}

// A tiled, softly rotated wallpaper of card symbols, drawn as shapes so
// phone text settings (high contrast text, themes) can't recolour it.
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
        // The wallpaper never changes, so let the GPU keep it as one picture
        // instead of redrawing it behind every animation.
        <View
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
        >
            <Svg width={width} height={height}>
                {items.map((item) => (
                    <Item key={item.key} item={item} />
                ))}
            </Svg>
        </View>
    );
}

export default React.memo(CardPattern);
