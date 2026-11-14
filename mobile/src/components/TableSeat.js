import React, {useEffect, useRef} from "react";
import {Animated, StyleSheet, View} from "react-native";
import Text from "./AppText";
import Avatar from "./Avatar";
import {ScoreBar} from "./PlayerSeat";
import {colors} from "../components/Theme";

// An avatar whose gold ring pulses while it is that player's turn.
export function PulseAvatar({
    name,
    size = 38,
    active,
    badge,
    dealer,
    innerRef,
}) {
    const pulse = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!active) {
            pulse.setValue(active ? 1 : 0);
            return undefined;
        }

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.25,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [active, pulse]);

    const box = size + 12;

    return (
        <View
            ref={innerRef}
            collapsable={false}
            style={{
                width: box,
                height: box,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Animated.View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: box / 2,
                    borderWidth: 2.5,
                    borderColor: colors.saffron,
                    opacity: pulse,
                }}
            />
            <Avatar name={name} size={size} />

            {badge !== undefined ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            ) : null}
            {dealer ? (
                <View style={styles.dealer}>
                    <Text style={styles.dealerText}>D</Text>
                </View>
            ) : null}
        </View>
    );
}

// A compact opponent for the landscape table: avatar, card count, score.
export default function TableSeat({player, isCurrent, limit = 121, innerRef}) {
    return (
        <View style={[styles.seat, player.eliminated && {opacity: 0.4}]}>
            <PulseAvatar
                name={player.name}
                size={34}
                active={isCurrent}
                badge={player.eliminated ? "✕" : player.cardCount}
                dealer={player.isDealer}
                innerRef={innerRef}
            />
            <Text numberOfLines={1} style={styles.name}>
                {player.name}
            </Text>
            <ScoreBar score={player.score} limit={limit} width={52} />
            <Text style={styles.score}>{player.score} pts</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    seat: {alignItems: "center", marginHorizontal: 8, width: 72},
    name: {
        color: colors.text,
        fontSize: 11.5,
        fontWeight: "600",
        maxWidth: 70,
        marginTop: 1,
    },
    score: {color: colors.textMuted, fontSize: 10.5, marginTop: 2},
    badge: {
        position: "absolute",
        top: -2,
        right: -4,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 3,
        borderRadius: 4,
        backgroundColor: "#D32F2F",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.7)",
    },
    badgeText: {color: "#FFFFFF", fontSize: 11, fontWeight: "700"},
    dealer: {
        position: "absolute",
        left: -2,
        bottom: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.ivory,
        alignItems: "center",
        justifyContent: "center",
    },
    dealerText: {color: colors.ink, fontSize: 9, fontWeight: "800"},
});
