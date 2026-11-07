import React, {memo, useEffect, useRef} from "react";
import {Animated, Easing, Pressable} from "react-native";
import PlayingCard from "../../../components/PlayingCard";

// A card in my hand: slides up when dealt, lifts when playable.
function HandCard({
    card,
    width,
    playable,
    dimmed,
    hidden,
    delay,
    tilt,
    baseY,
    marginLeft,
    onPress,
}) {
    const ref = useRef(null);
    const enter = useRef(
        new Animated.Value(delay === undefined ? 1 : 0),
    ).current;
    const lift = useRef(new Animated.Value(playable ? 1 : 0)).current;

    useEffect(() => {
        if (delay === undefined) return;
        Animated.timing(enter, {
            toValue: 1,
            duration: 340,
            delay,
            easing: Easing.out(Easing.back(1.3)),
            useNativeDriver: true,
        }).start();
        // Only animate on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        Animated.spring(lift, {
            toValue: playable ? 1 : 0,
            friction: 7,
            tension: 90,
            useNativeDriver: true,
        }).start();
    }, [playable, lift]);

    const enterY = enter.interpolate({
        inputRange: [0, 1],
        outputRange: [90, 0],
    });
    const liftY = lift.interpolate({inputRange: [0, 1], outputRange: [0, -16]});
    const opacity = enter.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, 1, 1],
        extrapolate: "clamp",
    });

    function handlePress() {
        if (!playable) return;

        const node = ref.current;
        if (!node?.measureInWindow) {
            onPress(card, null);
            return;
        }

        node.measureInWindow((x, y, w, h) =>
            onPress(card, {cx: x + w / 2, cy: y + h / 2, w}),
        );
    }

    return (
        <Animated.View
            ref={ref}
            collapsable={false}
            style={{
                marginLeft,
                opacity: hidden ? 0 : opacity,
                transform: [
                    {rotate: `${tilt}deg`},
                    {translateY: baseY},
                    {translateY: enterY},
                    {translateY: liftY},
                ],
            }}
        >
            <Pressable
                onPress={handlePress}
                disabled={!playable}
                accessibilityRole="button"
                accessibilityLabel={`${card.rank} of ${card.suit}`}
            >
                <PlayingCard
                    card={card}
                    width={width}
                    playable={playable}
                    dimmed={dimmed}
                />
            </Pressable>
        </Animated.View>
    );
}

export default memo(HandCard);
