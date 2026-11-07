import React, {memo} from "react";
import {StyleSheet, View} from "react-native";
import Text from "../../../components/AppText";
import {colors} from "../../../components/Theme";

function TurnBanner({text, isMyTurn, message}) {
    return (
        <>
            <View style={[styles.pill, isMyTurn && styles.pillMine]}>
                <Text style={[styles.text, isMyTurn && styles.textMine]}>
                    {text}
                </Text>
            </View>
            {message ? <Text style={styles.error}>{message}</Text> : null}
        </>
    );
}

export default memo(TurnBanner);

const styles = StyleSheet.create({
    pill: {
        marginTop: 8,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 4,
        backgroundColor: "rgba(40,8,20,0.7)",
    },
    pillMine: {backgroundColor: colors.saffron},
    text: {color: colors.text, fontWeight: "700", fontSize: 12.5},
    textMine: {color: colors.ink},
    error: {
        color: colors.danger,
        fontSize: 12,
        fontWeight: "600",
        marginTop: 3,
    },
});
