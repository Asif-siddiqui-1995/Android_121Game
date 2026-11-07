import React, {memo} from "react";
import {StyleSheet, View} from "react-native";
import Text from "../../../components/AppText";
import {ScoreBar} from "../../../components/PlayerSeat";
import {colors} from "../../../components/Theme";

function PlayerPanel({name, score, limit, log}) {
    const last = log.length - 1;

    return (
        <View style={styles.box}>
            <View style={styles.meRow}>
                <Text style={styles.meName} numberOfLines={1}>
                    {name || "You"}
                </Text>
                <Text style={styles.meScore}>
                    {score || 0}/{limit}
                </Text>
            </View>
            <ScoreBar score={score || 0} limit={limit} />
            {log.map((line, index) => (
                <Text
                    key={`${index}-${line}`}
                    numberOfLines={index === last ? 3 : 1}
                    style={[styles.line, index === last && styles.lineLast]}
                >
                    {line}
                </Text>
            ))}
        </View>
    );
}

export default memo(PlayerPanel);

const styles = StyleSheet.create({
    box: {
        width: "24%",
        maxWidth: 210,
        alignSelf: "stretch",
        backgroundColor: "rgba(40,8,20,0.7)",
        borderWidth: 1,
        borderColor: "rgba(231,179,74,0.45)",
        borderRadius: 8,
        padding: 7,
        overflow: "hidden",
    },
    meRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 3,
    },
    meName: {
        color: colors.text,
        fontSize: 12,
        fontWeight: "700",
        flex: 1,
        marginRight: 6,
    },
    meScore: {color: colors.textMuted, fontSize: 11},
    line: {color: colors.textMuted, fontSize: 10, marginTop: 3},
    lineLast: {color: colors.text},
});
