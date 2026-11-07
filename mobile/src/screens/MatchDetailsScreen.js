import React, {useCallback, useEffect, useState} from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";

import {SERVER_URL} from "../config";
import Text from "../components/AppText";
import PlayingCard from "../components/PlayingCard";
import ScreenBackground from "../components/ScreenBackground";

const C = {
    gold: "#E7B34A",
    wine: "#7C1030",
    wineDark: "#5A0B22",
    cream: "#FCEBDD",
    cream2: "#FFF6DD",
    pink: "#F4C9CC",
    pinkLine: "#EBC4C4",
    panel: "#F8DDD3",
};

function formatDate(value) {
    if (!value) return "No date";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({match, winner, rounds, onBack, onRefresh}) {
    const players = Array.isArray(match?.players) ? match.players : [];
    const ranked = [...players].sort(
        (a, b) => (a.finalScore ?? 0) - (b.finalScore ?? 0),
    );

    return (
        <View>
            <View style={styles.topRow}>
                <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
                    <Text style={styles.chevron}>‹</Text>
                    <Text style={styles.backText}>Back to history</Text>
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
                <Text style={styles.title}>Match Results</Text>
            </View>

            {match ? (
                <>
                    <View style={styles.card}>
                        <View style={styles.cardHead}>
                            <View style={styles.headShine} />
                            <Text style={styles.headTitle}>
                                Room: {match.roomCode}
                            </Text>
                            <View style={styles.dateWrap}>
                                <Text style={styles.calendar}></Text>
                                <Text style={styles.date}>
                                    {formatDate(
                                        match.finishedAt || match.createdAt,
                                    )}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.winnerPanel}>
                                <Text style={styles.winnerTrophy}>🏆</Text>

                                <View style={styles.flex}>
                                    <View style={styles.winnerTopRow}>
                                        <Text
                                            style={styles.winnerName}
                                            numberOfLines={1}
                                        >
                                            {winner?.name ||
                                                "Winner unavailable"}
                                        </Text>

                                        <View style={styles.pillStart}>
                                            <Text style={styles.pillText}>
                                                {winner?.finalScore ?? "—"} pts
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.winnerLabel}>
                                        Match winner
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.sectionTitle}>
                                Final scoreboard
                            </Text>
                            <Text style={styles.hint}>
                                The lowest score is best.
                            </Text>

                            {ranked.map((player, index) => (
                                <View
                                    key={player.playerId}
                                    style={[
                                        styles.scoreRow,
                                        index > 0 && styles.rowLine,
                                    ]}
                                >
                                    <View style={styles.rank}>
                                        <Text style={styles.rankText}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <Text
                                        style={styles.playerName}
                                        numberOfLines={1}
                                    >
                                        {player.name}
                                        {player.playerId === match.winnerId
                                            ? " 🏆"
                                            : ""}
                                        {player.eliminated ? "  (out)" : ""}
                                    </Text>
                                    <View style={styles.pill}>
                                        <Text style={styles.pillText}>
                                            {player.finalScore ?? 0} pts
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.rule} />

                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Out at</Text>
                                <Text style={styles.infoValue}>
                                    {match.targetScore ?? 121} points
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>
                                    Rounds played
                                </Text>
                                <Text style={styles.infoValue}>
                                    {rounds.length}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionHeading}>Round by round</Text>
                </>
            ) : null}
        </View>
    );
}

// ---------------------------------------------------------------------------
// One round
// ---------------------------------------------------------------------------

function RoundCard({round, players}) {
    const winnerIds = Array.isArray(round.winnerIds) ? round.winnerIds : [];
    const winners = players.filter((player) =>
        winnerIds.includes(player.playerId),
    );
    const entries = Array.isArray(round.cards) ? round.cards : [];

    return (
        <View style={styles.card}>
            <View style={styles.cardHead}>
                <View style={styles.headShine} />
                <Text style={styles.headTitle}>Round {round.number}</Text>
                <Text style={styles.headRight} numberOfLines={1}>
                    {winners.length > 0
                        ? `${winners.map((p) => p.name).join(", ")} went out`
                        : "No winner"}
                </Text>
            </View>

            <View style={styles.cardBody}>
                {entries.length === 0 ? (
                    <Text style={styles.muted}>
                        No player details were saved for this round.
                    </Text>
                ) : (
                    entries.map((entry, index) => {
                        const didWin = winnerIds.includes(entry.playerId);
                        const hand = Array.isArray(entry.card)
                            ? entry.card
                            : entry.card
                              ? [entry.card]
                              : [];

                        return (
                            <View
                                key={`${round.number}-${entry.playerId}-${index}`}
                                style={[
                                    styles.entry,
                                    index > 0 && styles.rowLine,
                                ]}
                            >
                                <View style={styles.entryTop}>
                                    <Text
                                        style={styles.playerName}
                                        numberOfLines={1}
                                    >
                                        {entry.name || "Player"}
                                        {didWin ? " 🏆" : ""}
                                        {entry.eliminated ? "  (out)" : ""}
                                    </Text>

                                    <View style={styles.entryScore}>
                                        <View
                                            style={
                                                didWin
                                                    ? styles.pillWin
                                                    : styles.pill
                                            }
                                        >
                                            <Text
                                                style={
                                                    didWin
                                                        ? styles.pillWinText
                                                        : styles.pillText
                                                }
                                            >
                                                +{entry.points ?? 0} pts
                                            </Text>
                                        </View>
                                        <Text style={styles.total}>
                                            Total {entry.total ?? "—"}
                                        </Text>
                                    </View>
                                </View>

                                {didWin ? (
                                    <Text style={styles.wentOut}>
                                        Played every card
                                    </Text>
                                ) : hand.length > 0 ? (
                                    <View style={styles.hand}>
                                        {hand.map((card, i) => (
                                            <PlayingCard
                                                key={card.id ?? i}
                                                card={card}
                                                size="sm"
                                                style={styles.miniCard}
                                            />
                                        ))}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })
                )}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function MatchDetailsView({
    match,
    loading,
    refreshing,
    error,
    onBack,
    onRefresh,
}) {
    const players = Array.isArray(match?.players) ? match.players : [];
    const rounds = Array.isArray(match?.rounds) ? match.rounds : [];
    const winner = players.find(
        (player) => player.playerId === match?.winnerId,
    );

    if (loading) {
        return (
            <ScreenBackground>
                <Header onBack={onBack} onRefresh={onRefresh} rounds={rounds} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={C.gold} />
                    <Text style={styles.message}>Loading match results...</Text>
                </View>
            </ScreenBackground>
        );
    }

    if (error && !match) {
        return (
            <ScreenBackground>
                <Header onBack={onBack} onRefresh={onRefresh} rounds={rounds} />
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
                data={rounds}
                keyExtractor={(round, index) => String(round.number ?? index)}
                renderItem={({item}) => (
                    <RoundCard round={item} players={players} />
                )}
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
                ListHeaderComponent={
                    <Header
                        match={match}
                        winner={winner}
                        rounds={rounds}
                        onBack={onBack}
                        onRefresh={onRefresh}
                    />
                }
                ListEmptyComponent={
                    match ? (
                        <Text style={styles.empty}>
                            No round history was saved for this match.
                        </Text>
                    ) : null
                }
            />
        </ScreenBackground>
    );
}

export default function MatchDetailsScreen({matchId, onBack}) {
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchMatch = useCallback(
        async (isRefresh = false) => {
            if (!matchId) {
                setError("No match ID was provided.");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            setError("");

            try {
                const response = await fetch(
                    `${SERVER_URL}/api/matches/${encodeURIComponent(matchId)}`,
                );
                const result = await response.json();

                if (!response.ok || result.success === false) {
                    throw new Error(
                        result.message || "Unable to load match details.",
                    );
                }

                const matchData = result.data ?? result.match ?? result;

                if (!matchData || !Array.isArray(matchData.players)) {
                    throw new Error("The server returned invalid match data.");
                }

                setMatch(matchData);
            } catch (err) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [matchId],
    );

    useEffect(() => {
        fetchMatch();
    }, [fetchMatch]);

    return (
        <MatchDetailsView
            match={match}
            loading={loading}
            refreshing={refreshing}
            error={error}
            onBack={onBack}
            onRefresh={() => fetchMatch(true)}
        />
    );
}

const styles = StyleSheet.create({
    flex: {flex: 1},
    list: {paddingHorizontal: 16, paddingBottom: 24},

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
    headTitle: {color: "#FFFFFF", fontSize: 15, fontWeight: "700"},
    headRight: {
        color: "#FFFFFF",
        fontSize: 12.5,
        fontWeight: "500",
        flexShrink: 1,
        marginLeft: 10,
    },
    dateWrap: {flexDirection: "row", alignItems: "center"},
    calendar: {fontSize: 12, marginRight: 5},
    date: {color: "#FFFFFF", fontSize: 13, fontWeight: "500"},
    cardBody: {padding: 12, paddingTop: 10},

    winnerPanel: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: C.panel,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.gold,
        padding: 10,
    },
    winnerTrophy: {fontSize: 34, marginRight: 10},
    winnerLabel: {color: "#6A2A3A", fontSize: 12},
    winnerName: {color: C.wine, fontSize: 20, fontWeight: "700"},
    sectionTitle: {
        color: C.wine,
        fontSize: 15,
        fontWeight: "700",
        marginTop: 12,
    },
    hint: {color: "#6A2A3A", fontSize: 11.5, marginBottom: 4},

    scoreRow: {flexDirection: "row", alignItems: "center", paddingVertical: 5},
    rowLine: {borderTopWidth: 1, borderTopColor: C.pinkLine},
    rank: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: C.wine,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    rankText: {color: "#FFFFFF", fontSize: 12, fontWeight: "700"},
    playerName: {
        color: "#4A1020",
        fontSize: 14.5,
        fontWeight: "600",
        flex: 1,
        marginRight: 8,
    },
    pill: {
        backgroundColor: C.pink,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    pillStart: {
        alignSelf: "flex-start",
        backgroundColor: C.pink,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginTop: 6,
    },
    pillText: {color: C.wine, fontSize: 13.5, fontWeight: "700"},
    pillWin: {
        backgroundColor: C.wine,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    pillWinText: {color: "#FFFFFF", fontSize: 13.5, fontWeight: "700"},

    rule: {height: 1, backgroundColor: C.pinkLine, marginVertical: 8},
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 2,
    },
    infoLabel: {color: "#6A2A3A", fontSize: 13},
    infoValue: {color: C.wine, fontSize: 13, fontWeight: "700"},

    sectionHeading: {
        color: C.cream2,
        fontSize: 18,
        fontWeight: "700",
        fontStyle: "italic",
        marginBottom: 10,
        marginLeft: 2,
    },

    entry: {paddingVertical: 7},
    entryTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    winnerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },

    winnerName: {
        color: C.wine,
        fontSize: 22,
        fontWeight: "700",
        flex: 1,
    },

    winnerLabel: {
        color: "#6A2A3A",
        fontSize: 13,
        marginTop: 2,
    },

    pillStart: {
        backgroundColor: C.pink,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },

    pillText: {
        color: C.wine,
        fontSize: 15,
        fontWeight: "700",
    },
    entryScore: {alignItems: "flex-end"},
    total: {color: "#6A2A3A", fontSize: 11, marginTop: 1},
    wentOut: {color: C.wine, fontStyle: "italic", fontSize: 13, marginTop: 2},
    hand: {flexDirection: "row", flexWrap: "wrap", marginTop: 6},
    miniCard: {marginRight: 4, marginBottom: 4},
    muted: {color: "#6A2A3A", fontSize: 13},

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
    empty: {color: C.cream2, textAlign: "center", fontSize: 14, marginTop: 8},
});
