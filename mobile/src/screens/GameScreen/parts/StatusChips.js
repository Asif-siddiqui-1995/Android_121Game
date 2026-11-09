import React, {memo} from "react";
import {StyleSheet, View} from "react-native";
import Text from "../../../components/AppText";
import {colors, isRedSuit, SUIT_SYMBOLS} from "../../../components/Theme";

const CHIP_SIZE = 110;

function StatusChips({chosenSuit, pendingDraw}) {
    return (
        <View style={styles.chips}>
            {chosenSuit ? (
                <View style={styles.chip}>
                    <Text style={styles.chipText}>Play</Text>
                    <Text
                        style={[
                            styles.chipSuit,
                            isRedSuit(chosenSuit) && styles.danger,
                        ]}
                    >
                        {SUIT_SYMBOLS[chosenSuit]}
                    </Text>
                </View>
            ) : null}
            {pendingDraw > 0 ? (
                <View style={[styles.chip, styles.chipDanger]}>
                    <Text style={[styles.chipText, styles.danger]}>
                        Draw {pendingDraw}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

export default memo(StatusChips);

const styles = StyleSheet.create({
    chips: {
        marginLeft: 16,
        minWidth: CHIP_SIZE + 16,
        alignItems: "center",
        justifyContent: "center",
    },
    chip: {
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2.5,
        borderColor: colors.saffron,
        borderRadius: 16,
        marginVertical: 5,
        backgroundColor: "rgba(84, 19, 10, 0.86)",
    },
    chipDanger: {borderColor: colors.danger},
    chipText: {
        color: colors.saffron,
        fontWeight: "800",
        fontSize: 25,
        textAlign: "center",
    },
    chipSuit: {color: colors.ivory, fontSize: 34, marginTop: 2},
    danger: {color: colors.danger},
});
