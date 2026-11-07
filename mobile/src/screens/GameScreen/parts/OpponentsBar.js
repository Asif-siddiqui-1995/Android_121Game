import React, {memo} from "react";
import {StyleSheet, View} from "react-native";
import Text from "../../../components/AppText";
import TableSeat from "../../../components/TableSeat";
import {colors} from "../../../components/Theme";

function OpponentsBar({
    opponents,
    getSeatRef,
    playing,
    currentPlayerId,
    targetScore,
    code,
    roundNumber,
}) {
    const seat = (player) => (
        <TableSeat
            key={player.id}
            player={player}
            isCurrent={playing && player.id === currentPlayerId}
            limit={targetScore}
            innerRef={getSeatRef(player.id)}
        />
    );

    const infoPill = (
        <View style={styles.infoPill}>
            <Text style={styles.infoTop}>Table {code}</Text>
            <Text style={styles.infoSub}>Round {roundNumber}</Text>
        </View>
    );

    let left = null;
    let center = infoPill;
    let right = null;

    if (opponents.length === 1) {
        center = seat(opponents[0]);
        right = infoPill;
    } else {
        const half = Math.ceil(opponents.length / 2);
        left = opponents.slice(0, half).map(seat);
        right = opponents.slice(half).map(seat);
    }

    return (
        <View style={styles.bar}>
            <View style={[styles.side, styles.sideStart]}>{left}</View>
            <View style={styles.center}>{center}</View>
            <View style={[styles.side, styles.sideEnd]}>{right}</View>
        </View>
    );
}

export default memo(OpponentsBar);

const styles = StyleSheet.create({
    bar: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 10,
        paddingTop: 4,
    },
    side: {flex: 1, flexDirection: "row"},
    sideStart: {justifyContent: "flex-start"},
    sideEnd: {justifyContent: "flex-end"},
    center: {alignItems: "center", paddingHorizontal: 6},
    infoPill: {
        backgroundColor: "rgba(40,8,20,0.7)",
        borderWidth: 1,
        borderColor: "rgba(231,179,74,0.6)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignItems: "center",
        marginTop: 6,
    },
    infoTop: {color: colors.saffron, fontSize: 12, fontWeight: "700"},
    infoSub: {color: colors.textMuted, fontSize: 10.5},
});
