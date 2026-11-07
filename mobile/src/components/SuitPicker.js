import React from "react";
import {Modal, Pressable, StyleSheet, View} from "react-native";
import Text from "./AppText";
import {colors, isRedSuit, SUIT_ORDER, SUIT_SYMBOLS} from "../components/Theme";
import UIButton from "./UIButton";

export default function SuitPicker({visible, onPick, onCancel}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            supportedOrientations={["portrait", "landscape"]}
            onRequestClose={onCancel}
        >
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>Pick a suit</Text>
                    <Text style={styles.sub}>
                        The next player has to follow it.
                    </Text>

                    <View style={styles.row}>
                        {SUIT_ORDER.map((suit) => (
                            <Pressable
                                key={suit}
                                onPress={() => onPick(suit)}
                                accessibilityRole="button"
                                accessibilityLabel={suit}
                                style={({pressed}) => [
                                    styles.suit,
                                    pressed && {opacity: 0.7},
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.symbol,
                                        {
                                            color: isRedSuit(suit)
                                                ? colors.suitRed
                                                : colors.ink,
                                        },
                                    ]}
                                >
                                    {SUIT_SYMBOLS[suit]}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <UIButton
                        title="Cancel"
                        variant="ghost"
                        onPress={onCancel}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(25,5,12,0.78)",
        alignItems: "center",
        justifyContent: "center",
    },
    sheet: {
        width: "86%",
        maxWidth: 420,
        backgroundColor: colors.baize,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: colors.saffron,
    },
    title: {color: colors.text, fontSize: 20, fontWeight: "bold"},
    sub: {color: colors.textMuted, marginTop: 2, marginBottom: 12},
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    suit: {
        width: 64,
        height: 64,
        borderRadius: 8,
        backgroundColor: colors.ivory,
        alignItems: "center",
        justifyContent: "center",
    },
    symbol: {fontSize: 34},
});
