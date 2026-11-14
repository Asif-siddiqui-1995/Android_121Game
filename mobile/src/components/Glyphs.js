import React, {memo, useMemo} from "react";
import Svg, {Circle, G, Path} from "react-native-svg";
import Text from "./AppText";
import glyphData from "./glyphData";

// Everything here is drawn as vector shapes, not text.
//
// Why: Android's "High contrast text" accessibility setting (and some
// phone makers' themes) repaint every piece of *text* black or white with
// an outline. Card suits, ranks, the logo and the gear were text, so on
// those phones red hearts turned black, the gold logo turned white and the
// faint wallpaper turned bright white. Shapes keep their colours everywhere.

// ---------------------------------------------------------------- suits

const SUIT_KEYS = {
    hearts: "hearts",
    diamonds: "diamonds",
    clubs: "clubs",
    spades: "spades",
    h: "hearts",
    d: "diamonds",
    c: "clubs",
    s: "spades",
    "♥": "hearts",
    "♦": "diamonds",
    "♣": "clubs",
    "♠": "spades",
};

export const suitKey = (suit) =>
    SUIT_KEYS[String(suit).toLowerCase()] || SUIT_KEYS[suit] || "spades";

const HEART =
    "M50 92C22 70 4 54 4 32 4 16 16 6 29 6 39 6 46 12 50 21 54 12 61 6 71 6 84 6 96 16 96 32 96 54 78 70 50 92Z";
const DIAMOND = "M50 2 88 50 50 98 12 50Z";
const SPADE =
    "M50 4C62 24 95 40 95 62 95 76 85 84 73 84 64 84 57 79 54 72 55 82 59 90 67 96H33C41 90 45 82 46 72 43 79 36 84 27 84 15 84 5 76 5 62 5 40 38 24 50 4Z";
const CLUB_STEM = "M45 58C45 76 41 88 32 96H68C59 88 55 76 55 58Z";

// The shapes of one suit in a 100x100 box, for use inside any <Svg>.
export function SuitShape({suit, color}) {
    switch (suitKey(suit)) {
        case "hearts":
            return <Path d={HEART} fill={color} />;
        case "diamonds":
            return <Path d={DIAMOND} fill={color} />;
        case "clubs":
            return (
                <G fill={color}>
                    <Circle cx={50} cy={27} r={21} />
                    <Circle cx={27} cy={59} r={21} />
                    <Circle cx={73} cy={59} r={21} />
                    <Circle cx={50} cy={52} r={12} />
                    <Path d={CLUB_STEM} />
                </G>
            );
        default:
            return <Path d={SPADE} fill={color} />;
    }
}

export const SuitIcon = memo(function SuitIcon({suit, size, color, style}) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <SuitShape suit={suit} color={color} />
        </Svg>
    );
});

// ---------------------------------------------------------------- text

// Lays out `text` from the extracted Poppins letter shapes. Returns null if
// a character is not available, so callers can fall back to normal text.
function layoutGlyphs(text, weight, size, letterSpacing) {
    const set = weight >= 900 ? glyphData.w900 : glyphData.w800;
    const scale = size / glyphData.unitsPerEm;
    const spacing = letterSpacing / scale;
    const parts = [];
    let x = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let top = 0;
    let bottom = 0;

    for (const ch of String(text)) {
        const g = set[ch];
        if (!g) return null;
        if (g.d) {
            minX = Math.min(minX, x + g.x0);
            maxX = Math.max(maxX, x + g.x1);
            top = Math.min(top, g.top);
            bottom = Math.max(bottom, g.bottom);
            parts.push({d: g.d, x});
        }
        x += g.adv + spacing;
    }

    if (!parts.length) return null;
    return {parts, scale, minX, maxX, top, bottom};
}

// Text drawn as shapes. The box hugs the letters (no line-height padding),
// so position it by its top edge. Optional outline and drop shadow.
export const GlyphText = memo(function GlyphText({
    text,
    size,
    color,
    weight = 800,
    letterSpacing = 0,
    stroke,
    strokeWidth = 0,
    shadowColor,
    shadowOffset = 0,
    style,
}) {
    const layout = useMemo(
        () => layoutGlyphs(text, weight, size, letterSpacing),
        [text, weight, size, letterSpacing],
    );

    if (!layout) {
        // Unknown character: still show something readable.
        return (
            <Text
                allowFontScaling={false}
                style={[
                    {color, fontSize: size, fontWeight: String(weight)},
                    style,
                ]}
            >
                {text}
            </Text>
        );
    }

    const {parts, scale, minX, maxX, top, bottom} = layout;
    const sw = strokeWidth / scale; // stroke in font units
    const sh = shadowColor ? shadowOffset / scale : 0;
    const pad = sw / 2 + 2;
    const vbX = minX - pad;
    const vbY = top - pad;
    const vbW = maxX - minX + pad * 2;
    const vbH = bottom - top + pad * 2 + sh;

    const layer = (key, fill, extra, dy = 0) => (
        <G key={key} fill={fill} {...extra}>
            {parts.map((p, i) => (
                <Path key={i} d={p.d} transform={`translate(${p.x} ${dy})`} />
            ))}
        </G>
    );

    const outline = {
        stroke,
        strokeWidth: sw,
        strokeLinejoin: "round",
    };

    return (
        <Svg
            width={Math.ceil(vbW * scale)}
            height={Math.ceil(vbH * scale)}
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            style={style}
        >
            {sh
                ? layer("shadow", shadowColor, {...outline, stroke: shadowColor}, sh)
                : null}
            {stroke && sw ? layer("stroke", stroke, outline) : null}
            {layer("fill", color)}
        </Svg>
    );
});

// ---------------------------------------------------------------- gear

export const GearIcon = memo(function GearIcon({size, color, style}) {
    const g = glyphData.gear;
    const w = g.x1 - g.x0;
    const h = g.bottom - g.top;
    return (
        <Svg
            width={size}
            height={size}
            viewBox={`${g.x0} ${g.top} ${w} ${h}`}
            style={style}
        >
            <Path d={g.d} fill={color} />
        </Svg>
    );
});
