import React, {memo, useEffect, useRef} from "react";
import {Animated} from "react-native";
import PlayingCard from "../../../components/PlayingCard";

// The card on top of the table: pops when it lands.
function TopCard({card, width, hidden}) {
    const pop = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (hidden) return;
        pop.setValue(0.8);
        Animated.spring(pop, {
            toValue: 1,
            friction: 5,
            tension: 140,
            useNativeDriver: true,
        }).start();
    }, [hidden, card?.id, pop]);

    return (
        <Animated.View
            style={{opacity: hidden ? 0 : 1, transform: [{scale: pop}]}}
        >
            <PlayingCard card={card} width={width} glow />
        </Animated.View>
    );
}

export default memo(TopCard);
