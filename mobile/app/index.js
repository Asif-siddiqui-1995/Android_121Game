import React, {useState} from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from "react-native";

import {useGameSocket} from "../src/hooks/useGameSocket";
import PlayingCard from "../src/components/PlayingCard";

export default function HomeScreen() {
    const {connected, room, playerId, error, setError, emitAck} =
        useGameSocket();

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);

    async function perform(action) {
        setBusy(true);
        setError("");

        try {
            await action();
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setBusy(false);
        }
    }

    function createRoom() {
        return perform(() => emitAck("room:create", {name}));
    }

    function joinRoom() {
        return perform(() => emitAck("room:join", {name, code}));
    }

    function startGame() {
        return perform(() => emitAck("game:start"));
    }

    function revealRound() {
        return perform(() => emitAck("game:reveal"));
    }

    function nextRound() {
        return perform(() => emitAck("game:next"));
    }

    const me = room?.players.find((player) => player.id === playerId);

    const isHost = room?.hostId === playerId;
    const revealed = room?.winners.length > 0;
    const gameFinished = room?.status === "finished";

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.logo}>♠ CARD ARENA ♥</Text>
            <Text style={styles.subtitle}>
                Private multiplayer card battles
            </Text>

            <Text style={styles.connection}>
                {connected ? "● Connected" : "○ Connecting to server..."}
            </Text>

            {!room ? (
                <View style={styles.panel}>
                    <Text style={styles.heading}>Enter the game</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Your player name"
                        value={name}
                        onChangeText={setName}
                        maxLength={24}
                    />

                    <Pressable
                        style={[styles.button, styles.primary]}
                        disabled={!connected || busy || !name.trim()}
                        onPress={createRoom}
                    >
                        <Text style={styles.buttonText}>
                            Create Private Room
                        </Text>
                    </Pressable>

                    <Text style={styles.or}>OR JOIN FRIENDS</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="6-character invite code"
                        value={code}
                        onChangeText={(value) =>
                            setCode(value.toUpperCase().slice(0, 6))
                        }
                        autoCapitalize="characters"
                        maxLength={6}
                    />

                    <Pressable
                        style={[styles.button, styles.secondary]}
                        disabled={
                            !connected ||
                            busy ||
                            !name.trim() ||
                            code.length !== 6
                        }
                        onPress={joinRoom}
                    >
                        <Text style={styles.buttonText}>Join Room</Text>
                    </Pressable>

                    {busy && <ActivityIndicator style={styles.loader} />}
                </View>
            ) : (
                <>
                    <View style={styles.panel}>
                        <Text style={styles.heading}>Room: {room.code}</Text>
                        <Text style={styles.subtitle}>
                            Share this code with your friends
                        </Text>

                        <Text style={styles.status}>
                            {room.status === "waiting"
                                ? "Waiting for players"
                                : gameFinished
                                  ? "Match finished"
                                  : `Round ${room.round}`}
                        </Text>

                        <Text style={styles.sectionTitle}>
                            Players ({room.players.length}/6)
                        </Text>

                        {room.players.map((player) => (
                            <View key={player.id} style={styles.playerRow}>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>
                                        {player.name}
                                        {player.id === room.hostId ? " 👑" : ""}
                                        {player.id === playerId ? " (You)" : ""}
                                    </Text>
                                    <Text style={styles.muted}>
                                        {player.connected
                                            ? "Online"
                                            : "Disconnected"}
                                    </Text>
                                </View>
                                <Text style={styles.score}>
                                    {player.score} pts
                                </Text>
                            </View>
                        ))}
                    </View>

                    {room.status === "waiting" && isHost && (
                        <Pressable
                            style={[
                                styles.button,
                                styles.primary,
                                room.players.length < 2 && styles.disabled,
                            ]}
                            disabled={busy || room.players.length < 2}
                            onPress={startGame}
                        >
                            <Text style={styles.buttonText}>Start Game</Text>
                        </Pressable>
                    )}

                    {room.status !== "waiting" && (
                        <View style={styles.panel}>
                            <Text style={styles.heading}>
                                {revealed ? "Round Results" : "Your Card"}
                            </Text>

                            <View style={styles.cards}>
                                {room.players.map((player) => (
                                    <View
                                        key={player.id}
                                        style={styles.cardPlayer}
                                    >
                                        <PlayingCard card={player.card} />
                                        <Text style={styles.cardName}>
                                            {player.name}
                                        </Text>
                                        {revealed &&
                                            room.winners.includes(
                                                player.id,
                                            ) && (
                                                <Text style={styles.winner}>
                                                    Round winner!
                                                </Text>
                                            )}
                                    </View>
                                ))}
                            </View>

                            {!revealed && !gameFinished && (
                                <Pressable
                                    style={[styles.button, styles.primary]}
                                    disabled={busy}
                                    onPress={revealRound}
                                >
                                    <Text style={styles.buttonText}>
                                        Reveal Cards
                                    </Text>
                                </Pressable>
                            )}

                            {gameFinished && (
                                <Text style={styles.winner}>
                                    {room.players.find(
                                        (player) =>
                                            player.id === room.gameWinnerId,
                                    )?.name || "Match"}{" "}
                                    wins the match!
                                </Text>
                            )}

                            {revealed && !gameFinished && isHost && (
                                <Pressable
                                    style={[styles.button, styles.secondary]}
                                    disabled={busy}
                                    onPress={nextRound}
                                >
                                    <Text style={styles.buttonText}>
                                        Next Round
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    )}
                </>
            )}

            {busy && <ActivityIndicator style={styles.loader} />}

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Text style={styles.footer}>
                High Card Showdown · First to 5 points
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: {
        flexGrow: 1,
        backgroundColor: "#0B1220",
        padding: 20,
        paddingTop: 54,
        paddingBottom: 40,
    },
    logo: {
        fontSize: 25,
        fontWeight: "900",
        color: "#FFFFFF",
        textAlign: "center",
    },
    subtitle: {
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 8,
    },
    connection: {
        color: "#86EFAC",
        textAlign: "center",
        marginVertical: 18,
    },
    panel: {
        backgroundColor: "#172033",
        padding: 18,
        borderRadius: 18,
        marginBottom: 18,
    },
    heading: {
        color: "#FFFFFF",
        fontSize: 21,
        fontWeight: "800",
        marginBottom: 12,
    },
    input: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 14,
        marginVertical: 8,
        color: "#111827",
    },
    button: {
        padding: 15,
        borderRadius: 11,
        alignItems: "center",
        marginVertical: 7,
    },
    primary: {
        backgroundColor: "#2563EB",
    },
    secondary: {
        backgroundColor: "#475569",
    },
    disabled: {
        opacity: 0.45,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    or: {
        textAlign: "center",
        color: "#9CA3AF",
        marginTop: 18,
    },
    status: {
        color: "#93C5FD",
        marginVertical: 12,
    },
    sectionTitle: {
        color: "#FFFFFF",
        fontWeight: "800",
        marginBottom: 8,
    },
    playerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    muted: {
        color: "#9CA3AF",
        marginTop: 4,
    },
    score: {
        color: "#FCD34D",
        fontWeight: "800",
    },
    cards: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 14,
        marginVertical: 20,
    },
    cardPlayer: {
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
    },
    cardName: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    winner: {
        color: "#86EFAC",
        fontWeight: "800",
        textAlign: "center",
        marginVertical: 10,
    },
    error: {
        color: "#FCA5A5",
        textAlign: "center",
        marginVertical: 12,
    },
    loader: {
        marginVertical: 12,
    },
    footer: {
        textAlign: "center",
        color: "#64748B",
        marginTop: 18,
    },
});
