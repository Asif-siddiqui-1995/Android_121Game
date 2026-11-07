import React, {memo} from "react";
import {StyleSheet, View} from "react-native";
import PlayingCard from "../../../components/PlayingCard";

// The few cards played before the top one, fanned out slightly.
function DiscardTrail({cards, tableW}) {
    return (
        <View
            style={[
                styles.box,
                {width: tableW * 2.1, height: tableW * 1.45},
            ]}
        >
            {cards.map((card, index) => (
                <View
                    key={card.id}
                    style={{
                        marginLeft: index === 0 ? 0 : -tableW * 0.44,
                        transform: [{rotate: `${((index * 7) % 13) - 6}deg`}],
                    }}
                >
                    <PlayingCard card={card} width={Math.round(tableW * 0.78)} />
                </View>
            ))}
        </View>
    );
}

export default memo(DiscardTrail);

const styles = StyleSheet.create({
    box: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginRight: 8,
    },
});
