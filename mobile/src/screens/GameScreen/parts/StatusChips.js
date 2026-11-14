import React, {memo} from "react";
import {StyleSheet, View} from "react-native";
import Text from "../../../components/AppText";
import {SuitIcon} from "../../../components/Glyphs";
import {colors, isRedSuit} from "../../../components/Theme";

// Chips sit side by side and are sized from the table card, so two chips
// never push the table off a short landscape screen.
function StatusChips({chosenSuit, pendingDraw, size = 90}) {
    const chip = {
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.15),
    };
    const label = {fontSize: Math.round(size * 0.22)};

    return (
        <View style={[styles.chips, {minWidth: size}]}>
            {chosenSuit ? (
                <View style={[styles.chip, chip]}>
                    <Text style={[styles.chipText, label]}>Play</Text>
                    <SuitIcon
                        suit={chosenSuit}
                        size={Math.round(size * 0.32)}
                        color={isRedSuit(chosenSuit) ? colors.danger : colors.ivory}
                        style={styles.chipSuit}
                    />
                </View>
            ) : null}
            {pendingDraw > 0 ? (
                // A 2 or J♣ was played: this is the most important thing on
                // the table, so it is bigger than the other chip and shows
                // the number large.
                <View
                    style={[
                        styles.chip,
                        styles.chipDanger,
                        {
                            width: Math.round(size * 1.5),
                            height: Math.round(size * 1.25),
                            borderRadius: Math.round(size * 0.18),
                        },
                    ]}
                >
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.chipText,
                            styles.danger,
                            {fontSize: Math.round(size * 0.22)},
                        ]}
                    >
                        DRAW
                    </Text>
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[
                            styles.drawNumber,
                            {
                                fontSize: Math.round(size * 0.6),
                                lineHeight: Math.round(size * 0.72),
                            },
                        ]}
                    >
                        +{pendingDraw}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

export default memo(StatusChips);

const styles = StyleSheet.create({
    chips: {
        flexDirection: "row",
        marginLeft: 12,
        gap: 8,
        alignItems: "center",
    },
    chip: {
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2.5,
        borderColor: colors.saffron,
        paddingHorizontal: 4,
        backgroundColor: "rgba(84, 19, 10, 0.86)",
    },
    chipDanger: {
        borderColor: colors.danger,
        borderWidth: 3,
        backgroundColor: "rgba(110, 14, 14, 0.92)",
    },
    drawNumber: {
        color: colors.ivory,
        fontWeight: "900",
        textAlign: "center",
        includeFontPadding: false,
    },
    chipText: {
        color: colors.saffron,
        fontWeight: "800",
        textAlign: "center",
    },
    chipSuit: {marginTop: 4},
    danger: {color: colors.danger},
});
