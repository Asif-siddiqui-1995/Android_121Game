import React from "react";
import {View} from "react-native";
import Text from "./AppText";
import {avatarColor, colors} from "../components/Theme";

export default function Avatar({name = "?", size = 44}) {
    const initial = (name.trim()[0] || "?").toUpperCase();

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: avatarColor(name),
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Text
                style={{
                    color: colors.ivory,
                    fontWeight: "bold",
                    fontSize: size * 0.45,
                }}
            >
                {initial}
            </Text>
        </View>
    );
}
