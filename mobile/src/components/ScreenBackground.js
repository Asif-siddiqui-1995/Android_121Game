import React from "react";
import {StyleSheet, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import CardPattern from "./CardPattern";
import {colors} from "../components/Theme";

// Wine background with the card-symbol wallpaper, shared by every screen.
export default function ScreenBackground({children}) {
    return (
        <View style={styles.root}>
            <CardPattern />
            <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: colors.baizeDeep},
    safe: {flex: 1},
});
