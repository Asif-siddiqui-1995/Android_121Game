import React, {memo} from "react";
import {Pressable, StyleSheet} from "react-native";
import Text from "../../../components/AppText";
import {colors} from "../../../components/Theme";

function ActionButton({title, onPress, disabled, variant = "primary"}) {
    const primary = variant === "primary";

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            style={({pressed}) => [
                styles.btn,
                primary ? styles.primary : styles.ghost,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
            ]}
        >
            <Text style={[styles.text, primary && styles.textPrimary]}>
                {title}
            </Text>
        </Pressable>
    );
}

export default memo(ActionButton);

const styles = StyleSheet.create({
    btn: {
        height: 34,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
    },
    primary: {
        backgroundColor: colors.saffron,
        borderBottomWidth: 3,
        borderBottomColor: colors.saffronDark,
    },
    ghost: {
        borderWidth: 1.5,
        borderColor: colors.line,
        backgroundColor: "rgba(40,8,20,0.5)",
    },
    disabled: {opacity: 0.35},
    pressed: {opacity: 0.8},
    text: {color: colors.text, fontSize: 13.5, fontWeight: "700"},
    textPrimary: {color: colors.ink},
});
