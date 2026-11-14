import React, {memo, useEffect, useRef} from "react";
import {Animated, Easing} from "react-native";
import PlayingCard, {CardBack} from "./PlayingCard";

const CARD_RATIO = 1.45;

// One card travelling across the screen: from a hand, seat or the draw pile
// to its destination. Positions are centres, relative to the overlay.
// `calm` (reduce motion) keeps the move but drops the hop and spin.
function FlyingCard({flight, onDone}) {
    const {id, card, from, to, delay, duration, rotFrom, rotTo, calm} = flight;
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.timing(progress, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
            isInteraction: false,
        });
        anim.start(() => onDone(id));
        return () => anim.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fw = Math.round(from.w);
    const fh = Math.round(fw * CARD_RATIO);
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
        outputRange: [0, calm ? 0 : -24, 0],
    });
    const scale = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [
            1,
            calm ? (1 + endScale) / 2 : Math.max(1, endScale) * 1.1,
            endScale,
        ],
    });
    const rotate = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [`${calm ? 0 : rotFrom}deg`, `${calm ? 0 : rotTo}deg`],
    });
    // Invisible while waiting for its delay, so staggered cards don't
    // sit on top of the pile before they start moving.
    const opacity = progress.interpolate({
        inputRange: [0, 0.01, 1],
        outputRange: [0, 1, 1],
        extrapolate: "clamp",
    });

    return (
        <Animated.View
            pointerEvents="none"
            // Draw the card once into a GPU texture and move that, instead of
            // re-drawing borders/shadows/text every frame. This is what keeps
            // the flight smooth (and visible) on low-end Android phones.
            renderToHardwareTextureAndroid
            shouldRasterizeIOS
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: fw,
                height: fh,
                zIndex: 50,
                // On Android, elevation decides what is drawn on top, not
                // zIndex. Without this the card can slide *under* the hand.
                elevation: 50,
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
                <PlayingCard card={card} width={fw} />
            ) : (
                <CardBack width={fw} />
            )}
        </Animated.View>
    );
}

export default memo(FlyingCard);
