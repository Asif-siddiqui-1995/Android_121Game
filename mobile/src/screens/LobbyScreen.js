import React, {useState} from "react";
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import Text from "../components/AppText";
import ScreenBackground from "../components/ScreenBackground";
import {colors} from "../components/Theme";
import {Ionicons} from "@expo/vector-icons";
import PlayingCard from "../components/PlayingCard";
import {RoomModal, RulesModal} from "../components/LobbyModals";
import {useScreenMusic} from "../audio/music";

const L = {
    gold: "#F2C14E",
    goldDeep: "#B8860B",
    navy: "#14234A",
    cream: "#FFF6DD",
};

const MIN_BOTS = 1;
const MAX_BOTS = 5;

// Gold-filled text with a deep red outline, drawn by stacking offset copies.
function OutlinedText({children, size, fill, stroke, shadow, width = 4}) {
    const base = {
        fontSize: size,
        fontWeight: "900",
        letterSpacing: -3,
        lineHeight: size * 1.15,
    };
    const offsets = Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return [Math.cos(a) * width, Math.sin(a) * width];
    });

    return (
        <View>
            <Text
                style={[
                    base,
                    styles.abs,
                    {color: shadow, left: 0, top: width + 5},
                ]}
            >
                {children}
            </Text>
            {offsets.map(([dx, dy], i) => (
                <Text
                    key={i}
                    style={[
                        base,
                        styles.abs,
                        {color: stroke, left: dx, top: dy},
                    ]}
                >
                    {children}
                </Text>
            ))}
            <Text
                style={[
                    base,
                    {
                        color: fill,
                        textShadowColor: "rgba(255,210,60,0.7)",
                        textShadowRadius: 14,
                        textShadowOffset: {width: 0, height: 0},
                    },
                ]}
            >
                {children}
            </Text>
        </View>
    );
}

const PLAY_TRIANGLE = (
    <View
        style={{
            width: 0,
            height: 0,
            borderTopWidth: 15,
            borderBottomWidth: 15,
            borderLeftWidth: 25,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: L.cream,
        }}
    />
);

// A chunky candy button: coloured face, darker lip underneath, shine on top.
// "stacked" puts the icon above the text, for half-width buttons.
function GameButton({
    title,
    subtitle,
    icon,
    face,
    lip,
    border,
    onPress,
    compact,
    stacked,
}) {
    const radius = compact ? 18 : 24;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
        >
            {({pressed}) => (
                <View
                    style={[
                        styles.lip,
                        {
                            backgroundColor: lip,
                            borderColor: border,
                            borderRadius: radius,
                            paddingBottom: pressed ? 2 : 6,
                            marginTop: pressed ? 4 : 0,
                        },
                    ]}
                >
                    <View
                        style={{
                            backgroundColor: face,
                            borderRadius: radius - 3,
                            overflow: "hidden",
                            minHeight: compact ? 52 : stacked ? 112 : 74,
                            justifyContent: "center",
                        }}
                    >
                        <View style={styles.shine} />
                        <View
                            style={[
                                styles.btnRow,
                                stacked && styles.btnRowStacked,
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconSlot,
                                    compact && {width: 36},
                                    stacked && styles.iconSlotStacked,
                                ]}
                            >
                                {icon}
                            </View>
                            <View
                                style={
                                    compact
                                        ? undefined
                                        : stacked
                                          ? styles.btnTextStacked
                                          : styles.btnTextBlock
                                }
                            >
                                <Text
                                    style={[
                                        styles.btnTitle,
                                        compact && {fontSize: 18},
                                        stacked && {fontSize: 22},
                                    ]}
                                >
                                    {title}
                                </Text>
                                {subtitle ? (
                                    <Text
                                        style={[
                                            styles.btnSub,
                                            stacked && styles.btnSubStacked,
                                        ]}
                                    >
                                        {subtitle}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    );
}

// Play Solo and the opponent count in a single candy button.
// Tapping the left side starts the game; the - and + change the bots.
function SoloButton({count, onPlay, onMinus, onPlus}) {
    const [down, setDown] = useState(false);
    const radius = 24;

    return (
        <View
            style={[
                styles.lip,
                {
                    backgroundColor: "#A82A22",
                    borderColor: "#6B1410",
                    borderRadius: radius,
                    paddingBottom: down ? 2 : 6,
                    marginTop: down ? 4 : 0,
                },
            ]}
        >
            <View
                style={{
                    backgroundColor: "#E8453C",
                    borderRadius: radius - 3,
                    overflow: "hidden",
                    minHeight: 74,
                    justifyContent: "center",
                }}
            >
                <View style={styles.shine} pointerEvents="none" />

                <View style={styles.soloRow}>
                    <Pressable
                        style={styles.soloMain}
                        onPress={onPlay}
                        onPressIn={() => setDown(true)}
                        onPressOut={() => setDown(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Play solo"
                    >
                        <View style={[styles.iconSlot, {width: 52}]}>
                            <Text style={styles.emoji}>👽</Text>
                        </View>
                        <View style={[styles.btnTextBlock, styles.flex]}>
                            <Text
                                style={[styles.btnTitle, {fontSize: 24}]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                Play Solo
                            </Text>
                            <Text style={styles.btnSub} numberOfLines={1}>
                                Against bots
                            </Text>
                        </View>
                    </Pressable>

                    <View style={styles.soloStepper}>
                        <Text style={styles.stepLabel}>Opponents</Text>
                        <View style={styles.stepRow}>
                            <Pressable
                                style={styles.botBtn}
                                hitSlop={6}
                                onPress={onMinus}
                                accessibilityRole="button"
                                accessibilityLabel="Fewer opponents"
                            >
                                <Text style={styles.botBtnText}>−</Text>
                            </Pressable>
                            <Text style={styles.botCount}>{count}</Text>
                            <Pressable
                                style={styles.botBtn}
                                hitSlop={6}
                                onPress={onPlus}
                                accessibilityRole="button"
                                accessibilityLabel="More opponents"
                            >
                                <Text style={styles.botBtnText}>+</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const HERO_CARDS = [
    {card: {id: "a", rank: "A", suit: "hearts"}, dx: -92, rot: "-12deg", y: 14},
    {card: {id: "b", rank: "K", suit: "spades"}, dx: -10, rot: "-3deg", y: 0},
    {card: {id: "c", rank: "Q", suit: "diamonds"}, dx: 72, rot: "9deg", y: 12},
];

const FAN_CARDS = [
    {
        card: {id: "f1", rank: "A", suit: "spades"},
        dx: -92,
        rot: "-18deg",
        y: 10,
    },
    {card: {id: "f2", rank: "A", suit: "hearts"}, dx: -42, rot: "-6deg", y: 0},
    {card: {id: "f3", rank: "A", suit: "clubs"}, dx: 8, rot: "6deg", y: 0},
    {
        card: {id: "f4", rank: "A", suit: "diamonds"},
        dx: 58,
        rot: "18deg",
        y: 10,
    },
];

export default function LobbyScreen({
    connected,
    message,
    name,
    setName,
    codeInput,
    setCodeInput,
    onCreate,
    onCreateSolo, // (botCount) => void
    onJoin,
    onOpenHistory,
    onOpenSettings,
}) {
    const {width, height} = useWindowDimensions();
    const [roomMode, setRoomMode] = useState(null); // "create" | "join" | "solo" | null
    const [botCount, setBotCount] = useState(1);
    const [showRules, setShowRules] = useState(false);

    useScreenMusic("home");

    const notice = !connected
        ? message || "Connecting to the server..."
        : message;

    const submitHandler =
        roomMode === "join"
            ? onJoin
            : roomMode === "solo"
              ? () => onCreateSolo?.(botCount)
              : onCreate;

    return (
        <ScreenBackground>
            <StatusBar
                barStyle="light-content"
                backgroundColor={colors.baizeDeep}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    {minHeight: height - 60},
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View>
                    <View style={styles.gearRow}>
                        <Pressable
                            onPress={onOpenSettings}
                            style={styles.gear}
                            accessibilityRole="button"
                            accessibilityLabel="Settings"
                        >
                            <Text style={styles.gearText}>⚙</Text>
                        </Pressable>
                    </View>

                    {/* Logo */}
                    <View style={styles.hero}>
                        {HERO_CARDS.map(({card, dx, rot, y}) => (
                            <View
                                key={card.id}
                                style={[
                                    styles.heroCard,
                                    {
                                        marginLeft: dx - 49,
                                        top: y,
                                        transform: [{rotate: rot}],
                                    },
                                ]}
                            >
                                <PlayingCard card={card} size="lg" />
                            </View>
                        ))}

                        <View style={styles.plate} />
                        <View style={{alignItems: "center", marginTop: 95}}>
                            <OutlinedText
                                size={135}
                                fill="#FFC928"
                                stroke="#B3151B"
                                shadow="#5A0A10"
                            >
                                1 2 1
                            </OutlinedText>
                        </View>

                        <Text style={styles.crown}>👑</Text>

                        <View style={styles.ribbonWrap}>
                            <View
                                style={[
                                    styles.tail,
                                    {left: "3%", transform: [{skewY: "-6deg"}]},
                                ]}
                            />
                            <View
                                style={[
                                    styles.tail,
                                    {right: "3%", transform: [{skewY: "6deg"}]},
                                ]}
                            />
                            <View style={styles.ribbon}>
                                <Text style={styles.ribbonSuit}>♠</Text>
                                <Text style={styles.ribbonText}>Card Game</Text>
                                <Text style={styles.ribbonSuit}>♣</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.tagline}>Play · Strategize · Win</Text>

                    {notice ? (
                        <Text style={styles.notice} numberOfLines={2}>
                            {notice}
                        </Text>
                    ) : null}

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        {/* Create and Join side by side */}
                        <View style={styles.pairRow}>
                            <View style={styles.flex}>
                                <GameButton
                                    stacked
                                    title="Create Room"
                                    subtitle="Start a new game"
                                    icon={PLAY_TRIANGLE}
                                    face="#2DB52D"
                                    lip="#167A1B"
                                    border="#0B4A10"
                                    onPress={() => setRoomMode("create")}
                                />
                            </View>
                            <View style={{width: 12}} />
                            <View style={styles.flex}>
                                <GameButton
                                    stacked
                                    title="Join Room"
                                    subtitle="Enter invite code"
                                    icon={
                                        <Ionicons
                                            name="people"
                                            size={40}
                                            color="#FFFFFF"
                                        />
                                    }
                                    face="#2A6DF0"
                                    lip="#1347B8"
                                    border="#0A2A78"
                                    onPress={() => setRoomMode("join")}
                                />
                            </View>
                        </View>

                        <View style={{height: 14}} />

                        {/* Play Solo + opponents in one button */}
                        <SoloButton
                            count={botCount}
                            onPlay={() => setRoomMode("solo")}
                            onMinus={() =>
                                setBotCount((n) => Math.max(MIN_BOTS, n - 1))
                            }
                            onPlus={() =>
                                setBotCount((n) => Math.min(MAX_BOTS, n + 1))
                            }
                        />

                        {/* History and Rules */}
                        <View style={styles.smallRow}>
                            <View style={styles.flex}>
                                <GameButton
                                    compact
                                    title="History"
                                    icon={
                                        <Text style={styles.emojiSmall}>
                                            🏆
                                        </Text>
                                    }
                                    face="#8A2BE2"
                                    lip="#5C16A8"
                                    border="#3A0C70"
                                    onPress={onOpenHistory}
                                />
                            </View>
                            <View style={{width: 12}} />
                            <View style={styles.flex}>
                                <GameButton
                                    compact
                                    title="Rules"
                                    icon={
                                        <Text style={styles.emojiSmall}>
                                            📖
                                        </Text>
                                    }
                                    face="#F59A1B"
                                    lip="#C9700A"
                                    border="#8A4A05"
                                    onPress={() => setShowRules(true)}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer: fanned cards over a gold arc */}
                <View style={styles.footer}>
                    <View
                        style={[
                            styles.arc,
                            {
                                width: width * 2.1,
                                height: width * 2.1,
                                left: -width * 0.55,
                                borderRadius: width * 1.05,
                            },
                        ]}
                    />
                    <View style={styles.fan}>
                        {FAN_CARDS.map(({card, dx, rot, y}) => (
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
                    <View style={styles.luckRow}>
                        <View style={styles.luckLine} />
                        <Text style={styles.luck}>Good Luck!</Text>
                        <View style={styles.luckLine} />
                    </View>
                </View>
            </ScrollView>

            <RoomModal
                mode={roomMode}
                onClose={() => setRoomMode(null)}
                name={name}
                setName={setName}
                codeInput={codeInput}
                setCodeInput={setCodeInput}
                connected={connected}
                message={message}
                onSubmit={submitHandler}
            />
            <RulesModal
                visible={showRules}
                onClose={() => setShowRules(false)}
            />
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    flex: {flex: 1},
    abs: {position: "absolute"},
    scroll: {flexGrow: 1, justifyContent: "space-between"},
    gearRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 6,
        gap: 10,
    },
    gear: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(40,8,20,0.9)",
        borderWidth: 2.5,
        borderColor: L.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    gearText: {color: L.gold, fontSize: 28, lineHeight: 34},

    hero: {height: 300, alignItems: "center", marginTop: 0},
    heroCard: {position: "absolute", left: "50%"},
    plate: {
        position: "absolute",
        top: 132,
        left: "5%",
        right: "5%",
        height: 112,
        backgroundColor: L.navy,
        borderWidth: 3,
        borderColor: L.gold,
        borderRadius: 38,
    },
    crown: {
        position: "absolute",
        top: 62,
        right: "12%",
        fontSize: 58,
        transform: [{rotate: "16deg"}],
    },
    ribbonWrap: {
        position: "absolute",
        top: 222,
        left: 0,
        right: 0,
        height: 70,
        justifyContent: "center",
    },
    tail: {
        position: "absolute",
        top: 14,
        width: 54,
        height: 46,
        backgroundColor: L.navy,
        borderWidth: 3,
        borderColor: L.gold,
        borderRadius: 6,
    },
    ribbon: {
        alignSelf: "center",
        width: "84%",
        height: 60,
        backgroundColor: L.navy,
        borderWidth: 3,
        borderColor: L.gold,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
    },
    ribbonSuit: {color: L.gold, fontSize: 26},
    ribbonText: {
        color: "#FFFFFF",
        fontStyle: "italic",
        fontWeight: "bold",
        fontSize: 32,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 3,
    },

    tagline: {
        color: L.cream,
        fontStyle: "italic",
        fontWeight: "bold",
        fontSize: 24,
        textAlign: "center",
        marginTop: 4,
        textShadowColor: "rgba(0,0,0,0.45)",
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 3,
    },
    notice: {
        color: "#FFD9A0",
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 30,
        fontSize: 14,
    },

    buttons: {
        marginTop: 20,
        paddingHorizontal: 30,
        width: "100%",
        maxWidth: 460,
        alignSelf: "center",
    },
    pairRow: {flexDirection: "row"},
    smallRow: {flexDirection: "row", marginTop: 14},
    lip: {borderWidth: 2.5, paddingHorizontal: 0, paddingTop: 0},
    shine: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "48%",
        backgroundColor: "rgba(255,255,255,0.17)",
    },
    btnRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 8,
    },
    btnRowStacked: {
        flexDirection: "column",
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    iconSlot: {width: 64, alignItems: "center", justifyContent: "center"},
    iconSlotStacked: {width: "auto", height: 42, marginBottom: 4},
    btnTextBlock: {marginLeft: 6},
    btnTextStacked: {alignItems: "center"},
    btnTitle: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800",
        textShadowColor: "rgba(0,0,0,0.35)",
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 2,
    },
    btnSub: {color: "rgba(255,255,255,0.92)", fontSize: 17, marginTop: -2},
    btnSubStacked: {fontSize: 13, textAlign: "center"},
    emoji: {fontSize: 38},
    emojiSmall: {fontSize: 26},

    // Play Solo button with the opponent count inside
    soloRow: {flexDirection: "row", alignItems: "center"},
    soloMain: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 14,
        paddingVertical: 8,
    },
    soloStepper: {
        alignItems: "center",
        paddingRight: 14,
        paddingLeft: 6,
    },
    stepLabel: {
        color: "rgba(255,255,255,0.92)",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 3,
    },
    stepRow: {flexDirection: "row", alignItems: "center", gap: 6},
    botBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: L.navy,
        borderWidth: 2.5,
        borderColor: L.gold,
        alignItems: "center",
        justifyContent: "center",
    },
    botBtnText: {
        color: L.gold,
        fontSize: 22,
        fontWeight: "900",
        lineHeight: 26,
    },
    botCount: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "900",
        minWidth: 20,
        textAlign: "center",
    },

    footer: {
        height: 176,
        marginTop: 18,
        overflow: "hidden",
        alignItems: "center",
    },
    arc: {
        position: "absolute",
        top: 70,
        backgroundColor: "rgba(0,0,0,0.22)",
        borderWidth: 3,
        borderColor: L.gold,
    },
    fan: {position: "absolute", top: 4, left: "50%"},
    fanCard: {position: "absolute"},
    luckRow: {
        position: "absolute",
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    luckLine: {
        width: 64,
        height: 2,
        backgroundColor: L.gold,
        marginHorizontal: 12,
    },
    luck: {
        color: L.cream,
        fontStyle: "italic",
        fontWeight: "bold",
        fontSize: 30,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 3,
    },
});
