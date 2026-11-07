import React from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import Text, {TextInput} from "./AppText";
import {SERVER_URL} from "../config";

const L = {
    panel: "#38101E",
    field: "#5A2237",
    gold: "#F2C14E",
    cream: "#FFF6DD",
    muted: "#C9A6B0",
    danger: "#FF8A7A",
};

function Dialog({visible, onClose, title, children}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.backdrop}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.card}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{title}</Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={12}
                            accessibilityLabel="Close"
                        >
                            <Text style={styles.close}>✕</Text>
                        </Pressable>
                    </View>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function DialogButton({title, onPress, disabled}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({pressed}) => [
                styles.button,
                disabled && {opacity: 0.4},
                pressed && {opacity: 0.8},
            ]}
        >
            <Text style={styles.buttonText}>{title}</Text>
        </Pressable>
    );
}

// Create a room (name only) or join one (name + invite code).
export function RoomModal({
    mode,
    onClose,
    name,
    setName,
    codeInput,
    setCodeInput,
    connected,
    message,
    onSubmit,
}) {
    const joining = mode === "join";
    const canSubmit =
        connected && name.trim() && (!joining || codeInput.trim().length === 6);

    return (
        <Dialog
            visible={Boolean(mode)}
            onClose={onClose}
            title={joining ? "Join a room" : "Create a room"}
        >
            <Text style={styles.label}>Your name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={L.muted}
                value={name}
                onChangeText={setName}
                maxLength={20}
                autoCapitalize="words"
            />

            {joining ? (
                <>
                    <Text style={styles.label}>Invite code</Text>
                    <TextInput
                        style={[styles.input, styles.code]}
                        placeholder="ABC123"
                        placeholderTextColor={L.muted}
                        value={codeInput}
                        onChangeText={setCodeInput}
                        maxLength={6}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />
                </>
            ) : (
                <Text style={styles.note}>
                    You will get a six-character code to share with friends.
                </Text>
            )}

            {!connected ? (
                <Text style={styles.error}>
                    Not connected to the server yet.
                </Text>
            ) : message ? (
                <Text style={styles.error}>{message}</Text>
            ) : null}

            <DialogButton
                title={joining ? "Join room" : "Create room"}
                onPress={onSubmit}
                disabled={!canSubmit}
            />
        </Dialog>
    );
}

const RULES = [
    [
        "Goal",
        "Be first to play every card. Everyone else scores the cards left in their hand. Reach 121 points and you are out. The last player left wins.",
    ],
    [
        "Dealing",
        "5 cards each. The player next to the dealer gets 6. One card is turned face up to start.",
    ],
    [
        "Your turn",
        "Play a card that matches the top card by suit or rank, or draw a card and pass. If the card you draw can be played, you may play it.",
    ],
    [
        "2",
        "The next player must draw 2 cards. After drawing, they still play a card or draw one from the deck.",
    ],
    [
        "Jack of Clubs",
        "The next player must draw 5 cards. After drawing, they still play a card or draw one from the deck. If the first card of a round is a 2 or J♣, the first player draws.",
    ],
    ["Ace", "Play one more card that matches. If you cannot, draw one card."],
    ["10", "The next player is skipped."],
    [
        "8",
        "Play it any time and choose a suit. The next player must follow that suit or play another 8.",
    ],
    [
        "Points left in hand",
        "2 to 10 count face value. Jack, Queen and King count 10. Ace and 8 count 0. Jack of Clubs counts 25.",
    ],
];

export function RulesModal({visible, onClose}) {
    return (
        <Dialog visible={visible} onClose={onClose} title="Game rules">
            <ScrollView
                style={styles.rules}
                showsVerticalScrollIndicator={false}
            >
                {RULES.map(([head, body]) => (
                    <View key={head} style={styles.rule}>
                        <Text style={styles.ruleHead}>{head}</Text>
                        <Text style={styles.ruleBody}>{body}</Text>
                    </View>
                ))}
            </ScrollView>
        </Dialog>
    );
}

export function SettingsModal({visible, onClose, connected}) {
    return (
        <Dialog visible={visible} onClose={onClose} title="Settings">
            <Text style={styles.label}>Connection</Text>
            <Text
                style={[styles.value, {color: connected ? L.gold : L.danger}]}
            >
                {connected ? "Connected to the game server" : "Not connected"}
            </Text>

            <Text style={[styles.label, {marginTop: 16}]}>Server address</Text>
            <Text style={styles.value} selectable>
                {String(SERVER_URL)}
            </Text>

            <Text style={styles.note}>
                If you cannot connect, check that the server is running and that
                this address is reachable from your phone.
            </Text>
        </Dialog>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(25,5,12,0.82)",
        justifyContent: "center",
        padding: 22,
    },
    card: {
        backgroundColor: L.panel,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: L.gold,
        padding: 20,
        maxHeight: "86%",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    title: {color: L.cream, fontSize: 24, fontWeight: "800"},
    close: {color: L.muted, fontSize: 20},
    label: {color: L.muted, fontSize: 14, marginBottom: 6},
    input: {
        backgroundColor: L.field,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        color: L.cream,
        fontSize: 17,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 14,
    },
    code: {
        textAlign: "center",
        letterSpacing: 5,
        fontWeight: "800",
        fontSize: 20,
    },
    note: {color: L.muted, fontSize: 14, lineHeight: 20, marginBottom: 16},
    error: {color: L.danger, fontWeight: "600", marginBottom: 12},
    value: {color: L.cream, fontSize: 16},
    button: {
        backgroundColor: L.gold,
        borderRadius: 24,
        minHeight: 50,
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 4,
        borderBottomColor: "#B8860B",
    },
    buttonText: {color: "#2A1B00", fontSize: 17, fontWeight: "800"},
    rules: {flexGrow: 0},
    rule: {marginBottom: 12},
    ruleHead: {color: L.gold, fontSize: 16, fontWeight: "800"},
    ruleBody: {color: L.cream, fontSize: 14.5, lineHeight: 21, marginTop: 2},
});
