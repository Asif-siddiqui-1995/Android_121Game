import React, {memo, useMemo} from "react";
import {Pressable, StyleSheet, View} from "react-native";
import Text from "../../../components/AppText";
import {CardBack} from "../../../components/PlayingCard";
import {colors} from "../../../components/Theme";
import {cardHeight} from "../utils";

function DrawPile({pileRef, width, count, canDraw, onDraw}) {
    const boxStyle = useMemo(
        () => ({width: width + 8, height: cardHeight(width) + 6}),
        [width],
    );

    return (
        <Pressable
            onPress={onDraw}
            disabled={!canDraw}
            accessibilityRole="button"
            accessibilityLabel="Draw pile"
            style={styles.pileBox}
        >
            <View ref={pileRef} collapsable={false} style={boxStyle}>
                <CardBack width={width} style={styles.stackA} />
                <CardBack width={width} style={styles.stackB} />
                <CardBack
                    width={width}
                    style={[styles.stackC, canDraw && styles.ready]}
                />
                <View style={styles.count} pointerEvents="none">
                    <Text style={styles.countText}>{count}</Text>
                </View>
            </View>
        </Pressable>
    );
}

export default memo(DrawPile);

const styles = StyleSheet.create({
    pileBox: {marginRight: 14},
    stackA: {position: "absolute", left: 0, top: 6},
    stackB: {position: "absolute", left: 4, top: 3},
    stackC: {position: "absolute", left: 8, top: 0},
    ready: {borderColor: colors.saffron, borderWidth: 2},
    count: {
        position: "absolute",
        left: 8,
        top: 0,
        right: 0,
        bottom: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    countText: {
        color: colors.ivory,
        fontSize: 18,
        fontWeight: "800",
        textShadowColor: "rgba(0,0,0,0.6)",
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 3,
    },
});
