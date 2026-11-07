import React, {useEffect, useRef} from "react";
import {Animated, Easing} from "react-native";
import PlayingCard, {CardBack} from "./PlayingCard";

// One card travelling across the screen: from a hand, seat or the draw pile
// to its destination. Positions are centres, relative to the overlay.
export default function FlyingCard({flight, onDone}) {
    const {id, card, from, to, delay, duration, rotFrom, rotTo} = flight;
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => onDone(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fw = from.w;
    const fh = Math.round(fw * 1.45);
    const endScale = to.w / from.w;

    const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [from.cx - fw / 2, to.cx - fw / 2],
    });
    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [from.cy - fh / 2, to.cy - fh / 2],
    });
    // A small hop in the middle makes the card feel thrown, not slid.
    const arc = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -24, 0],
    });
    const scale = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, Math.max(1, endScale) * 1.1, endScale],
    });
    const rotate = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [`${rotFrom}deg`, `${rotTo}deg`],
    });
    const opacity = progress.interpolate({
        inputRange: [0, 0.001, 1],
        outputRange: [0, 1, 1],
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: fw,
                height: fh,
                zIndex: 50,
                opacity,
                transform: [
                    {translateX},
                    {translateY},
                    {translateY: arc},
                    {rotate},
                    {scale},
                ],
            }}
        >
            {card ? (
                <PlayingCard card={card} width={fw} glow />
            ) : (
                <CardBack width={fw} />
            )}
        </Animated.View>
    );
}
