import React from "react";
import {Pressable, StyleSheet} from "react-native";
import Text from "./AppText";
import {colors} from "../components/Theme";

export default function UIButton({
    title,
    onPress,
    disabled,
    variant = "primary",
    style,
}) {
    const primary = variant === "primary";

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            style={({pressed}) => [
                styles.base,
                primary ? styles.primary : styles.ghost,
                disabled && styles.disabled,
                pressed && !disabled && {opacity: 0.8},
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    primary ? styles.primaryText : styles.ghostText,
                ]}
            >
                {title}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: 48,
        paddingHorizontal: 20,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    primary: {backgroundColor: colors.saffron},
    ghost: {
        borderWidth: 1.5,
        backgroundColor: "#c84368",
        // backgroundColor: "transparent",
        borderColor: "#5A1E2D",
    },
    disabled: {opacity: 0.35},
    text: {fontSize: 16, fontWeight: "700"},
    primaryText: {color: colors.ink},
    // ghostText: {color: colors.text},
    ghostText: {color: "#F5E9E7"},
});
