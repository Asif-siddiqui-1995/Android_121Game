import React, {memo} from "react";
import {Pressable, StyleSheet, useWindowDimensions, View} from "react-native";
import Text from "../../../components/AppText";
import {colors} from "../../../components/Theme";

const BAR_WIDTH = 150;
const GAP = 6;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// One big tappable button. "primary" is filled, "ghost" is outlined.
function BarButton({
    title,
    onPress,
    disabled,
    variant,
    height,
    fontSize,
    flex,
}) {
    const primary = variant === "primary";

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({pressed}) => [
                styles.button,
                {height},
                flex && styles.flex,
                primary ? styles.primary : styles.ghost,
                disabled && styles.disabled,
                pressed && styles.pressed,
            ]}
        >
            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                    styles.text,
                    {fontSize},
                    primary ? styles.primaryText : styles.ghostText,
                ]}
            >
                {title}
            </Text>
        </Pressable>
    );
}

function ActionsBar({drawLabel, canDraw, onDraw, showPass, onPass, onLobby}) {
    const {height: screenH} = useWindowDimensions();

    // Heights follow the screen height, because a landscape phone is short.
    const drawH = clamp(Math.round(screenH * 0.15), 46, 60);
    const smallH = Math.round(drawH * 0.85);

    return (
        <View style={styles.actions}>
            <BarButton
                title={drawLabel}
                onPress={onDraw}
                disabled={!canDraw}
                variant="primary"
                height={drawH}
                fontSize={26}
            />

            <View style={styles.row}>
                {showPass ? (
                    <BarButton
                        title="Pass"
                        onPress={onPass}
                        variant="ghost"
                        height={smallH}
                        fontSize={20}
                        flex
                    />
                ) : null}
                <BarButton
                    title="Lobby"
                    onPress={onLobby}
                    variant="ghost"
                    height={smallH}
                    fontSize={20}
                    flex
                />
            </View>
        </View>
    );
}

export default memo(ActionsBar);

const styles = StyleSheet.create({
    actions: {
        width: BAR_WIDTH,
        alignSelf: "stretch",
        justifyContent: "flex-end",
        gap: GAP,
        marginBottom: 15,
    },
    row: {flexDirection: "row", gap: GAP},
    flex: {flex: 1},
    button: {
        borderRadius: 16,
        borderWidth: 2.5,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    primary: {
        backgroundColor: colors.saffron,
        borderColor: colors.saffron,
        borderBottomWidth: 5,
    },
    ghost: {
        backgroundColor: "rgba(84, 19, 10, 0.86)",
        borderColor: colors.saffron,
    },
    disabled: {opacity: 0.4},
    pressed: {opacity: 0.8, transform: [{scale: 0.97}]},
    text: {fontWeight: "800", textAlign: "center"},
    primaryText: {color: "#2A1B00"},
    ghostText: {color: colors.saffron},
});
