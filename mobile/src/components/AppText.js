import React from "react";
import {
    StyleSheet,
    Text as RNText,
    TextInput as RNTextInput,
} from "react-native";
import {fontFor} from "../components/Theme";

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
    return <RNText {...props} style={poppins(style)} />;
}

export function TextInput({style, ...props}) {
    return <RNTextInput {...props} style={poppins(style)} />;
}
