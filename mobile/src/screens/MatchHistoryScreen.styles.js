import {StyleSheet} from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F6FA",
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginVertical: 20,
        color: "#172033",
    },
    list: {
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 14,
        marginBottom: 14,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    roomCode: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#3446A5",
    },
    date: {
        fontSize: 12,
        color: "#687084",
    },
    winner: {
        fontSize: 19,
        fontWeight: "bold",
        color: "#16794B",
        marginBottom: 6,
    },
    subtitle: {
        color: "#687084",
        marginBottom: 12,
    },
    playerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: "#EDF0F5",
    },
    playerName: {
        color: "#172033",
    },
    score: {
        fontWeight: "600",
        color: "#172033",
    },
    detailsLink: {
        color: "#3446A5",
        fontWeight: "600",
        marginTop: 12,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    message: {
        color: "#687084",
        textAlign: "center",
        marginTop: 12,
    },
    error: {
        color: "#B42318",
        textAlign: "center",
        marginBottom: 16,
    },
    button: {
        backgroundColor: "#3446A5",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: "center",
    },
});
