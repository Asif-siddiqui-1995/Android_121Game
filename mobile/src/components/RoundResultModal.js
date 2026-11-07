import React from "react";
import {Modal, ScrollView, StyleSheet, View} from "react-native";
import Text from "./AppText";
import Avatar from "./Avatar";
import PlayingCard from "./PlayingCard";
import UIButton from "./UIButton";
import {colors} from "../components/Theme";

export default function RoundResultModal({
    room,
    isHost,
    onNextRound,
    onLeave,
    onOpenHistory,
}) {
    const result = room?.roundResult;
    if (!result) return null;

    const finished = room.status === "finished";
    const gameWinner = room.players.find((p) => p.id === room.gameWinnerId);
    const roundWinner = result.cards.find(
        (c) => c.playerId === result.winnerId,
    );

    const rows = [...result.cards].sort((a, b) => a.total - b.total);

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            supportedOrientations={["portrait", "landscape"]}
        >
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    {finished ? (
                        <>
                            <Text style={styles.bigTitle}>
                                {gameWinner
                                    ? `${gameWinner.name} wins`
                                    : "Game over"}
                            </Text>
                            <Text style={styles.sub}>
                                Last player standing under 121.
                            </Text>
                        </>
                    ) : result.cancelled ? (
                        <>
                            <Text style={styles.bigTitle}>Round cancelled</Text>
                            <Text style={styles.sub}>
                                A player left, so nobody scored.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.bigTitle}>
                                {roundWinner
                                    ? `${roundWinner.name} went out`
                                    : "Round over"}
                            </Text>
                            <Text style={styles.sub}>
                                Round {result.number}. Everyone else scores the
                                cards they hold.
                            </Text>
                        </>
                    )}

                    <ScrollView
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                    >
                        {rows.map((row) => {
                            const won = row.playerId === result.winnerId;

                            return (
                                <View key={row.playerId} style={styles.row}>
                                    <View style={styles.rowTop}>
                                        <Avatar name={row.name} size={30} />
                                        <Text
                                            style={styles.name}
                                            numberOfLines={1}
                                        >
                                            {row.name}
                                        </Text>
                                        {row.eliminated ? (
                                            <Text style={styles.out}>Out</Text>
                                        ) : null}
                                        <View style={styles.points}>
                                            <Text style={styles.plus}>
                                                {won ? "0" : `+${row.points}`}
                                            </Text>
                                            <Text style={styles.total}>
                                                {row.total} total
                                            </Text>
                                        </View>
                                    </View>

                                    {won ? (
                                        <Text style={styles.wentOut}>
                                            Played every card
                                        </Text>
                                    ) : (
                                        <View style={styles.hand}>
                                            {row.card.map((card) => (
                                                <PlayingCard
                                                    key={card.id}
                                                    card={card}
                                                    size="sm"
                                                    style={styles.miniCard}
                                                />
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>

                    {finished ? (
                        <View style={styles.actions}>
                            <UIButton
                                title="Match history"
                                onPress={onOpenHistory}
                                style={styles.flex}
                            />
                            <UIButton
                                title="Leave table"
                                variant="ghost"
                                onPress={onLeave}
                                style={styles.flex}
                            />
                        </View>
                    ) : isHost ? (
                        <UIButton
                            title="Deal next round"
                            onPress={onNextRound}
                        />
                    ) : (
                        <Text style={styles.waiting}>
                            Waiting for the host to deal.
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(25,5,12,0.8)",
        alignItems: "center",
        justifyContent: "center",
    },
    sheet: {
        width: "92%",
        maxWidth: 640,
        maxHeight: "94%",
        backgroundColor: colors.baize,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: colors.saffron,
    },
    bigTitle: {color: colors.saffron, fontSize: 22, fontWeight: "bold"},
    sub: {color: colors.textMuted, marginTop: 2, marginBottom: 8, fontSize: 13},
    list: {flexGrow: 0, flexShrink: 1, marginBottom: 10},
    row: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
    },
    rowTop: {flexDirection: "row", alignItems: "center"},
    name: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
        flexShrink: 1,
    },
    out: {
        color: colors.danger,
        fontWeight: "700",
        fontSize: 12,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: colors.danger,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 1,
    },
    points: {marginLeft: "auto", alignItems: "flex-end"},
    plus: {color: colors.text, fontSize: 20, fontWeight: "bold"},
    total: {color: colors.textMuted, fontSize: 12},
    wentOut: {color: colors.saffron, marginTop: 8, fontStyle: "italic"},
    hand: {flexDirection: "row", flexWrap: "wrap", marginTop: 8},
    miniCard: {marginRight: 4, marginBottom: 4},
    actions: {flexDirection: "row", gap: 10},
    flex: {flex: 1},
    waiting: {
        color: colors.textMuted,
        textAlign: "center",
        paddingVertical: 12,
    },
});
