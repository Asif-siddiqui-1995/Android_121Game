import React, {memo, useEffect, useRef} from "react";
import {Animated, StyleSheet} from "react-native";
import Text from "../../../components/AppText";
import {colors} from "../../../components/Theme";

function WinnerBanner({name, isMe}) {
    const pop = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(pop, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
        }).start();
    }, [pop]);

    const scale = pop.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]});

    return (
        <Animated.View
            style={[styles.pill, {opacity: pop, transform: [{scale}]}]}
        >
            <Text style={styles.text}>
                🏆{" "}
                {isMe
                    ? "You won the round!"
                    : `${name || "A player"} won the round!`}
            </Text>
        </Animated.View>
    );
}

export default memo(WinnerBanner);

const styles = StyleSheet.create({
    pill: {
        marginTop: 8,
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: colors.saffron,
    },
    text: {color: colors.ink, fontWeight: "800", fontSize: 17},
});
