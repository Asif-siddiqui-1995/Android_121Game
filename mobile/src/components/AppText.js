import React from "react";
import {
    StyleSheet,
    Text as RNText,
    TextInput as RNTextInput,
} from "react-native";
import {fontFor} from "../components/Theme";

// Phones with "large text" turned on would otherwise blow up every
// fixed-size layout (cards, chips, the landscape table). Allow a little
// growth for readability, but never enough to break the design.
const MAX_FONT_SCALE = 1.15;

// Every text in the app goes through here so it always renders in Poppins,
// on every phone. fontWeight / fontStyle pick the matching Poppins file.
function poppins(style) {
    const flat = StyleSheet.flatten(style) || {};
    return [
        style,
        {
            fontFamily: fontFor(flat.fontWeight, flat.fontStyle === "italic"),
            fontWeight: "normal",
            fontStyle: "normal",
        },
    ];
}

export default function Text({style, ...props}) {
    return (
        <RNText
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            {...props}
            style={poppins(style)}
        />
    );
}

export function TextInput({style, ...props}) {
    return (
        <RNTextInput
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            {...props}
            style={poppins(style)}
        />
    );
}
