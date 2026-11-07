import React, {memo, useMemo} from "react";
import {StyleSheet, useWindowDimensions, View} from "react-native";
import Text from "../../../components/AppText";
import {PulseAvatar} from "../../../components/TableSeat";
import {colors} from "../../../components/Theme";
import {clamp} from "../utils";
import HandCard from "./HandCard";

function HandFan({
    handRef,
    hand,
    handW,
    isMyTurn,
    playableSet,
    hiddenId,
    delays,
    onCardPress,
    myName,
}) {
    const {width} = useWindowDimensions();
    const count = hand.length;

    // Overlap more when the hand is big.
    const step = useMemo(
        () =>
            clamp(
                count > 1 ? (width * 0.5 - handW) / (count - 1) : handW,
                26,
                handW * 0.66,
            ),
        [width, handW, count],
    );
    const mid = (count - 1) / 2;

    return (
        <View style={styles.area} ref={handRef} collapsable={false}>
            <View style={styles.fan}>
                {count === 0 ? (
                    <Text style={styles.waiting}>Waiting for your cards...</Text>
                ) : (
                    hand.map((card, index) => {
                        const offset = index - mid;
                        const playable = isMyTurn && playableSet.has(card.id);

                        return (
                            <HandCard
                                key={card.id}
                                card={card}
                                width={handW}
                                playable={playable}
                                dimmed={isMyTurn && !playable}
                                hidden={hiddenId === card.id}
                                delay={delays[card.id]}
                                tilt={clamp(offset * 2.4, -12, 12)}
                                baseY={Math.abs(offset) * 1.6}
                                marginLeft={index === 0 ? 0 : step - handW}
                                onPress={onCardPress}
                            />
                        );
                    })
                )}
            </View>

            <View style={styles.avatar} pointerEvents="none">
                <PulseAvatar name={myName || "?"} size={32} active={isMyTurn} />
            </View>
        </View>
    );
}

export default memo(HandFan);

const styles = StyleSheet.create({
    area: {flex: 1, alignItems: "center", justifyContent: "flex-end"},
    fan: {flexDirection: "row", alignItems: "flex-end", paddingTop: 20},
    waiting: {color: colors.textMuted, paddingVertical: 30},
    avatar: {
        position: "absolute",
        bottom: -10,
        alignSelf: "center",
        zIndex: 5,
    },
});
