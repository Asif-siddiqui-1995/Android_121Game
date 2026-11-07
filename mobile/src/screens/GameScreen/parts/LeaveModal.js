import React, {memo} from "react";
import {Modal, StyleSheet, View} from "react-native";
import Text from "../../../components/AppText";
import UIButton from "../../../components/UIButton";
import {colors} from "../../../components/Theme";

function LeaveModal({visible, onStay, onLeave}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            supportedOrientations={["portrait", "landscape"]}
            onRequestClose={onStay}
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>Leave the table?</Text>
                    <Text style={styles.body}>
                        You will be removed from the game and the current round
                        is cancelled for everyone.
                    </Text>
                    <View style={styles.row}>
                        <UIButton
                            title="Stay"
                            variant="ghost"
                            style={styles.flex}
                            onPress={onStay}
                        />
                        <UIButton
                            title="Leave"
                            style={styles.flex}
                            onPress={onLeave}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default memo(LeaveModal);

const styles = StyleSheet.create({
    flex: {flex: 1},
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(25,5,12,0.8)",
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        width: "80%",
        maxWidth: 380,
        backgroundColor: colors.baize,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.saffron,
        padding: 16,
    },
    title: {color: colors.text, fontSize: 18, fontWeight: "700"},
    body: {
        color: colors.textMuted,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 4,
        marginBottom: 12,
    },
    row: {flexDirection: "row", gap: 10},
});
