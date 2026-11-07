import React, {useCallback, useEffect, useState} from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";

import {SERVER_URL} from "../config";
import Text from "../components/AppText";
import PlayingCard from "../components/PlayingCard";
import ScreenBackground from "../components/ScreenBackground";

const C = {
    gold: "#E7B34A",
    goldLight: "#F6D88A",
    wine: "#7C1030",
    wineDark: "#5A0B22",
    cream: "#FCEBDD",
    pink: "#F4C9CC",
    pinkLine: "#EBC4C4",
    cream2: "#FFF6DD",
};

function formatDate(value) {
    if (!value) return "No date";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// One saved match
// ---------------------------------------------------------------------------

export function MatchCard({item, onPress}) {
    const players = Array.isArray(item.players) ? item.players : [];
    const winner = players.find((player) => player.playerId === item.winnerId);

    // Lowest score first, because the lowest score is the best.
    const ranked = [...players].sort(
        (a, b) => (a.finalScore ?? 0) - (b.finalScore ?? 0),
    );

    return (
        <View style={styles.card}>
            <View style={styles.cardHead}>
                <View style={styles.headShine} />
                <Text style={styles.room}>Room: {item.roomCode}</Text>

                <View style={styles.dateWrap}>
                    <Text style={styles.calendar}></Text>
                    <Text style={styles.date}>
                        {formatDate(item.finishedAt || item.createdAt)}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.winnerRow}>
                    <Text style={styles.trophy}>🏆</Text>

                    <View style={styles.flex}>
                        <Text style={styles.winnerName} numberOfLines={1}>
                            {winner?.name || "Winner unavailable"}
                        </Text>
                        <Text style={styles.sub}>
                            {players.length} players • Target score:{" "}
                            {item.targetScore ?? 121}
                        </Text>
                    </View>
                </View>

                <View style={styles.rule} />

                {ranked.map((player, index) => (
                    <View
                        key={player.playerId}
                        style={[
                            styles.playerRow,
                            index > 0 && styles.playerRowLine,
                        ]}
                    >
                        <Text style={styles.playerName} numberOfLines={1}>
                            {player.name}
                            {player.eliminated ? "  (out)" : ""}
                        </Text>

                        <View style={styles.pill}>
                            <Text style={styles.pillText}>
                                {player.finalScore ?? 0} pts
                            </Text>
                        </View>
                    </View>
                ))}

                <Pressable
                    onPress={onPress}
                    accessibilityRole="button"
                    accessibilityLabel={`View results for room ${item.roomCode}`}
                    style={({pressed}) => [
                        styles.viewButton,
                        pressed && {opacity: 0.85},
                    ]}
                >
                    <Text style={styles.viewText}>View results →</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Header and footer
// ---------------------------------------------------------------------------

function Header({backLabel, onBack, onRefresh}) {
    return (
        <View>
            <View style={styles.topRow}>
                <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
                    <Text style={styles.chevron}>‹</Text>
                    <Text style={styles.backText}>{backLabel}</Text>
                </Pressable>

                <Pressable
                    onPress={onRefresh}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh"
                    style={styles.round}
                >
                    <Text style={styles.roundText}>↻</Text>
                </Pressable>
            </View>

            <View style={styles.titleBlock}>
                <View style={styles.trophyRow}>
                    <View style={styles.swoosh} />
                    <Text style={styles.bigTrophy}>🏆</Text>
                    <View style={styles.swoosh} />
                </View>
                <Text style={styles.title}>Match History</Text>
            </View>
        </View>
    );
}

const FAN = [
    {
        card: {id: "h1", rank: "A", suit: "spades"},
        dx: -96,
        rot: "-16deg",
        y: 14,
    },
    {card: {id: "h2", rank: "A", suit: "hearts"}, dx: -46, rot: "-5deg", y: 2},
    {card: {id: "h3", rank: "A", suit: "clubs"}, dx: 4, rot: "5deg", y: 2},
    {
        card: {id: "h4", rank: "A", suit: "diamonds"},
        dx: 54,
        rot: "16deg",
        y: 14,
    },
];

function Footer() {
    const {width} = useWindowDimensions();

    return (
        <View style={styles.footer}>
            <View
                style={[
                    styles.arc,
                    {
                        width: width * 1.6,
                        height: width * 1.6,
                        left: -width * 0.3,
                        borderRadius: width * 0.8,
                    },
                ]}
            />

            <View style={styles.fan}>
                {FAN.map(({card, dx, rot, y}) => (
                    <View
                        key={card.id}
                        style={[
                            styles.fanCard,
                            {
                                marginLeft: dx - 33,
                                top: y,
                                transform: [{rotate: rot}],
                            },
                        ]}
                    >
                        <PlayingCard card={card} size="md" />
                    </View>
                ))}
            </View>

            <View style={styles.stars}>
                <Text style={styles.starSmall}>★</Text>
                <Text style={styles.starSmall}>★</Text>
                <Text style={styles.starBig}>★</Text>
                <Text style={styles.starSmall}>★</Text>
                <Text style={styles.starSmall}>★</Text>
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MatchHistoryView({
    matches,
    loading,
    refreshing,
    error,
    backLabel,
    onBack,
    onRefresh,
    onSelectMatch,
}) {
    const header = (
        <Header backLabel={backLabel} onBack={onBack} onRefresh={onRefresh} />
    );

    if (loading) {
        return (
            <ScreenBackground>
                {header}
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={C.gold} />
                    <Text style={styles.message}>Loading match history...</Text>
                </View>
            </ScreenBackground>
        );
    }

    if (error) {
        return (
            <ScreenBackground>
                {header}
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable onPress={onRefresh} style={styles.retry}>
                        <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground>
            <FlatList
                data={matches}
                keyExtractor={(item) => String(item._id)}
                renderItem={({item}) => (
                    <MatchCard
                        item={item}
                        onPress={() => onSelectMatch?.(item._id)}
                    />
                )}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    <Text style={styles.empty}>
                        No matches yet. Finish a game and it will show up here.
                    </Text>
                }
                ListFooterComponent={<Footer />}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={C.gold}
                        colors={[C.gold]}
                    />
                }
            />
        </ScreenBackground>
    );
}

export default function MatchHistoryScreen({
    onSelectMatch,
    onBack,
    backLabel = "Back",
}) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadMatches = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        try {
            const response = await fetch(
                `${SERVER_URL}/api/matches?limit=50&page=1`,
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load match history.",
                );
            }

            setMatches(result.data || []);
        } catch (err) {
            setError(err.message || "Could not connect to the server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadMatches();
    }, [loadMatches]);

    return (
        <MatchHistoryView
            matches={matches}
            loading={loading}
            refreshing={refreshing}
            error={error}
            backLabel={backLabel}
            onBack={onBack}
            onRefresh={() => loadMatches(true)}
            onSelectMatch={onSelectMatch}
        />
    );
}

const styles = StyleSheet.create({
    flex: {flex: 1},
    list: {paddingHorizontal: 16, paddingBottom: 20},

    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 8,
    },
    back: {flexDirection: "row", alignItems: "center", paddingVertical: 4},
    chevron: {
        color: C.gold,
        fontSize: 28,
        lineHeight: 32,
        marginRight: 5,
        fontWeight: "600",
    },
    backText: {color: C.gold, fontSize: 15, fontWeight: "600"},
    round: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: C.gold,
        backgroundColor: "rgba(60,8,24,0.85)",
        alignItems: "center",
        justifyContent: "center",
    },
    roundText: {color: C.gold, fontSize: 21, lineHeight: 26},

    titleBlock: {alignItems: "center", marginTop: -2, marginBottom: 14},
    trophyRow: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "stretch",
    },
    swoosh: {
        flex: 1,
        height: 1.5,
        backgroundColor: C.gold,
        opacity: 0.8,
        marginHorizontal: 10,
    },
    bigTrophy: {fontSize: 36},
    title: {
        color: C.cream2,
        fontSize: 28,
        fontWeight: "700",
        fontStyle: "italic",
        marginTop: 0,
        textShadowColor: "rgba(0,0,0,0.4)",
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 3,
    },
    underline: {width: "50%", height: 2, backgroundColor: C.gold, marginTop: 2},

    card: {
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: C.gold,
        backgroundColor: C.cream,
        overflow: "hidden",
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: {width: 0, height: 2},
        elevation: 3,
    },
    cardHead: {
        backgroundColor: C.wine,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headShine: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "45%",
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    room: {color: "#FFFFFF", fontSize: 15, fontWeight: "700"},
    dateWrap: {flexDirection: "row", alignItems: "center"},
    calendar: {fontSize: 12, marginRight: 5},
    date: {color: "#FFFFFF", fontSize: 13, fontWeight: "500"},

    cardBody: {padding: 12, paddingTop: 10},
    winnerRow: {flexDirection: "row", alignItems: "center"},
    trophy: {fontSize: 30, marginRight: 10},
    winnerName: {color: C.wine, fontSize: 19, fontWeight: "700"},
    sub: {color: "#6A2A3A", fontSize: 12.5, marginTop: -2},
    rule: {height: 1, backgroundColor: C.pinkLine, marginVertical: 8},

    playerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 5,
    },
    playerRowLine: {borderTopWidth: 1, borderTopColor: C.pinkLine},
    playerName: {
        color: "#4A1020",
        fontSize: 14.5,
        fontWeight: "600",
        flex: 1,
        marginRight: 10,
    },
    pill: {
        backgroundColor: C.pink,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    pillText: {color: C.wine, fontSize: 13.5, fontWeight: "700"},

    viewButton: {
        alignSelf: "center",
        backgroundColor: C.wine,
        borderRadius: 8,
        paddingHorizontal: 22,
        paddingVertical: 8,
        marginTop: 10,
        borderBottomWidth: 3,
        borderBottomColor: C.wineDark,
    },
    viewText: {color: "#FFFFFF", fontSize: 14.5, fontWeight: "600"},

    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },
    message: {color: C.cream2, marginTop: 12, fontSize: 14},
    errorText: {
        color: "#FFB4A8",
        fontSize: 14.5,
        textAlign: "center",
        marginBottom: 14,
    },
    retry: {
        backgroundColor: C.gold,
        borderRadius: 8,
        paddingHorizontal: 22,
        paddingVertical: 9,
        borderBottomWidth: 3,
        borderBottomColor: "#B8860B",
    },
    retryText: {color: "#2A1B00", fontSize: 15, fontWeight: "700"},
    empty: {
        color: C.cream2,
        textAlign: "center",
        fontSize: 14,
        lineHeight: 21,
        marginTop: 36,
        paddingHorizontal: 20,
    },

    footer: {
        height: 150,
        marginTop: 2,
        overflow: "hidden",
        alignItems: "center",
    },
    arc: {position: "absolute", top: 82, borderWidth: 2, borderColor: C.gold},
    fan: {position: "absolute", top: 0, left: "50%"},
    fanCard: {position: "absolute"},
    stars: {
        position: "absolute",
        bottom: 4,
        flexDirection: "row",
        alignItems: "flex-end",
    },
    starSmall: {
        color: C.gold,
        fontSize: 11,
        marginHorizontal: 8,
        marginBottom: 5,
    },
    starBig: {color: C.gold, fontSize: 30, marginHorizontal: 2},
});
