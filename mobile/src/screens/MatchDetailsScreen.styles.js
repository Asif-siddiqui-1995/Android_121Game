import {StyleSheet} from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F5F9",
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    backButton: {
        alignSelf: "flex-start",
        paddingVertical: 10,
        marginBottom: 12,
    },
    backButtonText: {
        color: "#2457C5",
        fontSize: 15,
        fontWeight: "600",
    },
    screenTitle: {
        fontSize: 27,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 16,
    },
    summaryCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 18,
        marginBottom: 24,
        elevation: 2,
    },
    roomCode: {
        fontSize: 18,
        fontWeight: "800",
        color: "#172033",
    },
    dateText: {
        fontSize: 12,
        color: "#747D90",
        marginTop: 5,
        marginBottom: 16,
    },
    winnerPanel: {
        backgroundColor: "#E8F7ED",
        borderRadius: 14,
        alignItems: "center",
        padding: 20,
        marginBottom: 22,
    },
    trophy: {
        fontSize: 34,
        marginBottom: 6,
    },
    winnerLabel: {
        color: "#287445",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
    },
    winnerName: {
        color: "#165B32",
        fontSize: 24,
        fontWeight: "800",
        marginTop: 6,
        textAlign: "center",
    },
    winnerScore: {
        color: "#287445",
        fontSize: 14,
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 12,
    },
    scoreRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#DDE2EA",
    },
    rank: {
        width: 30,
        color: "#747D90",
        fontSize: 15,
        fontWeight: "700",
    },
    scorePlayerName: {
        flex: 1,
        color: "#283349",
        fontSize: 15,
        fontWeight: "600",
    },
    scoreValue: {
        minWidth: 35,
        textAlign: "right",
        color: "#2457C5",
        fontSize: 17,
        fontWeight: "800",
    },
    matchInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
    },
    mutedText: {
        color: "#747D90",
        fontSize: 13,
    },
    infoValue: {
        color: "#283349",
        fontSize: 14,
        fontWeight: "700",
    },
    roundCard: {
        backgroundColor: "#FFFFFF",
        padding: 15,
        borderRadius: 16,
        marginBottom: 14,
        elevation: 1,
    },
    roundHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    roundTitle: {
        color: "#172033",
        fontSize: 17,
        fontWeight: "800",
    },
    winningValue: {
        color: "#2457C5",
        fontSize: 12,
        fontWeight: "700",
    },
    playedCardRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F6F7FA",
        padding: 12,
        borderRadius: 10,
        marginBottom: 7,
        borderWidth: 1,
        borderColor: "transparent",
    },
    winningCardRow: {
        backgroundColor: "#E8F7ED",
        borderColor: "#A9DDB9",
    },
    cardPlayerInfo: {
        flex: 1,
        gap: 4,
    },
    playerName: {
        color: "#283349",
        fontSize: 14,
        fontWeight: "600",
    },
    playedCard: {
        color: "#26344D",
        fontSize: 20,
        fontWeight: "800",
    },
    redSuit: {
        color: "#D93045",
    },
    winnerBadge: {
        color: "#287445",
        fontSize: 10,
        fontWeight: "900",
        marginLeft: 8,
    },
    roundFooter: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#DDE2EA",
        marginTop: 7,
        paddingTop: 12,
    },
    roundWinnerLabel: {
        color: "#747D90",
        fontSize: 12,
    },
    roundWinnerNames: {
        color: "#165B32",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
    },
    statusText: {
        textAlign: "center",
        color: "#59657A",
        marginTop: 12,
    },
    errorText: {
        color: "#C62828",
        fontSize: 14,
        marginVertical: 12,
    },
    retryButton: {
        alignSelf: "flex-start",
        backgroundColor: "#2457C5",
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    emptyText: {
        color: "#747D90",
        fontSize: 14,
        marginBottom: 16,
    },
});

export default styles;
