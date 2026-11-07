import React, {useEffect, useRef, useState} from "react";
import {AccessibilityInfo, Animated, StyleSheet, View} from "react-native";
import Text from "./AppText";
import Avatar from "./Avatar";
import {colors} from "../components/Theme";

// A bar that fills toward the elimination score, so danger is visible.
export function ScoreBar({score = 0, limit = 121, width}) {
    const pct = Math.min(score / limit, 1);
    const fill =
        pct >= 0.8
            ? colors.danger
            : pct >= 0.55
              ? colors.saffron
              : colors.textMuted;

    return (
        <View style={[styles.track, width ? {width} : {alignSelf: "stretch"}]}>
            <View
                style={{
                    width: `${pct * 100}%`,
                    height: "100%",
                    backgroundColor: fill,
                }}
            />
        </View>
    );
}

export default function PlayerSeat({player, isCurrent, limit = 121}) {
    const pulse = useRef(new Animated.Value(0)).current;
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((value) => mounted && setReduceMotion(value))
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    // The pulse is the one ambient motion: it marks whose turn it is.
    useEffect(() => {
        if (!isCurrent || reduceMotion) {
            pulse.setValue(isCurrent ? 1 : 0);
            return undefined;
        }

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 850,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.25,
                    duration: 850,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [isCurrent, reduceMotion, pulse]);

    return (
        <View style={[styles.seat, player.eliminated && {opacity: 0.4}]}>
            <View style={styles.avatarWrap}>
                <Animated.View style={[styles.ring, {opacity: pulse}]} />
                <Avatar name={player.name} size={44} />
                {player.isDealer ? (
                    <View style={styles.dealer}>
                        <Text style={styles.dealerText}>D</Text>
                    </View>
                ) : null}
            </View>

            <Text
                numberOfLines={1}
                style={[
                    styles.name,
                    player.eliminated && {textDecorationLine: "line-through"},
                ]}
            >
                {player.name}
            </Text>

            <ScoreBar score={player.score} limit={limit} />
            <Text style={styles.score}>{player.score} pts</Text>

            <Text style={styles.cards}>
                {player.eliminated
                    ? "Out"
                    : `${player.cardCount} ${player.cardCount === 1 ? "card" : "cards"}`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    seat: {width: 84, alignItems: "center", marginHorizontal: 6},
    avatarWrap: {
        width: 56,
        height: 56,
        alignItems: "center",
        justifyContent: "center",
    },
    ring: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: colors.saffron,
    },
    dealer: {
        position: "absolute",
        right: -2,
        bottom: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.ivory,
        alignItems: "center",
        justifyContent: "center",
    },
    dealerText: {color: colors.ink, fontSize: 11, fontWeight: "800"},
    name: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "600",
        marginTop: 4,
        maxWidth: 80,
    },
    track: {
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.line,
        overflow: "hidden",
        marginTop: 5,
    },
    score: {color: colors.textMuted, fontSize: 12, marginTop: 3},
    cards: {color: colors.text, fontSize: 12, marginTop: 1},
});
