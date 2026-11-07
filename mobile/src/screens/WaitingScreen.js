import React from "react";
import {ScrollView, StatusBar, StyleSheet, View} from "react-native";
import Text from "../components/AppText";
import ScreenBackground from "../components/ScreenBackground";
import Avatar from "../components/Avatar";
import UIButton from "../components/UIButton";
import {colors} from "../components/Theme";

const RULES = [
    "Match the top card by suit or rank, or draw a card and pass.",
    "A 2 makes the next player draw 2 and a J♣ makes them draw 5. They then still play a card or draw one.",
    "First to play every card wins the round.",
    "Everyone else scores the cards left in hand.",
    "Hit 121 points and you are out. Last player standing wins.",
];

export default function WaitingScreen({room, myId, message, onStart, onLeave}) {
    const me = room.players.find((p) => p.id === myId);
    const isHost = Boolean(me?.isHost);
    const canStart = room.players.length >= 2;

    return (
        <ScreenBackground>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.baizeDeep}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Table code</Text>
                <Text style={styles.code} selectable>
                    {room.code}
                </Text>
                <Text style={styles.hint}>
                    Share it with up to {room.maxPlayers - 1} friends.
                </Text>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>
                        At the table ({room.players.length} of {room.maxPlayers}
                        )
                    </Text>

                    {room.players.map((player) => (
                        <View key={player.id} style={styles.playerRow}>
                            <Avatar name={player.name} size={36} />
                            <Text style={styles.playerName}>
                                {player.name}
                                {player.id === myId ? " (you)" : ""}
                            </Text>
                            {player.isHost ? (
                                <Text style={styles.host}>Host</Text>
                            ) : null}
                        </View>
                    ))}
                </View>

                <View style={styles.panel}>
                    <Text style={styles.panelTitle}>How it works</Text>
                    {RULES.map((rule) => (
                        <Text key={rule} style={styles.rule}>
                            {rule}
                        </Text>
                    ))}
                </View>

                {message ? <Text style={styles.message}>{message}</Text> : null}

                {isHost ? (
                    <>
                        <UIButton
                            title="Deal the first hand"
                            onPress={onStart}
                            disabled={!canStart}
                        />
                        {!canStart ? (
                            <Text style={styles.hint}>
                                You need at least 2 players.
                            </Text>
                        ) : null}
                    </>
                ) : (
                    <Text style={styles.hint}>
                        Waiting for the host to deal.
                    </Text>
                )}

                <UIButton
                    title="Leave table"
                    variant="ghost"
                    onPress={onLeave}
                    style={{marginTop: 12}}
                />
            </ScrollView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.baizeDeep},
    content: {padding: 24, paddingBottom: 40},
    label: {color: colors.textMuted, textAlign: "center", marginTop: 12},
    code: {
        color: colors.saffron,
        fontWeight: "bold",
        fontSize: 52,
        letterSpacing: 8,
        textAlign: "center",
        marginTop: 4,
    },
    hint: {
        color: colors.textMuted,
        textAlign: "center",
        marginTop: 6,
        marginBottom: 12,
    },
    panel: {
        backgroundColor: colors.baize,
        borderRadius: 18,
        padding: 16,
        marginTop: 14,
        borderWidth: 1,
        borderColor: colors.line,
    },
    panelTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },
    playerRow: {flexDirection: "row", alignItems: "center", paddingVertical: 8},
    playerName: {color: colors.text, fontSize: 16, marginLeft: 12},
    host: {
        marginLeft: "auto",
        color: colors.saffron,
        fontWeight: "700",
        fontSize: 13,
        borderWidth: 1,
        borderColor: colors.saffron,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    rule: {color: colors.text, fontSize: 15, lineHeight: 22, marginTop: 6},
    message: {color: colors.danger, textAlign: "center", marginVertical: 12},
});
