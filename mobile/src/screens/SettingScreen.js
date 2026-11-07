import React, {useState} from "react";
import {Pressable, ScrollView, StyleSheet, Switch, View} from "react-native";

import {SERVER_URL} from "../config";
import Text, {TextInput} from "../components/AppText";
import {RulesModal} from "../components/LobbyModals";
import ScreenBackground from "../components/ScreenBackground";
import {useSettings} from "../components/SettingContext";
import {setMuted, useMuted} from "../audio/music";

const C = {
    gold: "#E7B34A",
    wine: "#7C1030",
    wineDark: "#5A0B22",
    cream: "#FCEBDD",
    cream2: "#FFF6DD",
    pink: "#F4C9CC",
    pinkLine: "#EBC4C4",
    ink: "#4A1020",
    muted: "#6A2A3A",
};

const CARD_SIZES = [
    {value: "small", label: "Small"},
    {value: "medium", label: "Medium"},
    {value: "large", label: "Large"},
];

// A gold-framed section, like the match cards.
function Section({title, children}) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHead}>
                <View style={styles.headShine} />
                <Text style={styles.headTitle}>{title}</Text>
            </View>
            <View style={styles.cardBody}>{children}</View>
        </View>
    );
}

function Row({label, hint, children, first}) {
    return (
        <View style={[styles.row, !first && styles.rowLine]}>
            <View style={styles.rowText}>
                <Text style={styles.label}>{label}</Text>
                {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            </View>
            {children}
        </View>
    );
}

function Toggle({value, onChange, label}) {
    return (
        <Switch
            value={value}
            onValueChange={onChange}
            accessibilityLabel={label}
            trackColor={{false: "#D9BFC4", true: C.wine}}
            thumbColor={value ? C.gold : "#F4F3F4"}
            ios_backgroundColor="#D9BFC4"
        />
    );
}

function Segmented({options, value, onChange}) {
    return (
        <View style={styles.segment}>
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{selected: active}}
                        style={[
                            styles.segmentItem,
                            active && styles.segmentActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                active && {color: "#FFFFFF"},
                            ]}
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

export default function SettingsScreen({
    name,
    setName,
    connected,
    onBack,
    onReconnect,
}) {
    const {settings, update, reset} = useSettings();
    const [showRules, setShowRules] = useState(false);
    const [muted] = useMuted();

    return (
        <ScreenBackground>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.page}>
                    <View style={styles.topRow}>
                        <Pressable
                            onPress={onBack}
                            hitSlop={10}
                            style={styles.back}
                        >
                            <Text style={styles.chevron}>‹</Text>
                            <Text style={styles.backText}>Back</Text>
                        </Pressable>
                    </View>

                    <View style={styles.titleBlock}>
                        <Text style={styles.gear}>⚙</Text>
                        <Text style={styles.title}>Settings</Text>
                        <View style={styles.underline} />
                    </View>

                    {/* <Section title="Player">
                        <Text style={styles.label}>Your name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="#A98089"
                            maxLength={20}
                            autoCapitalize="words"
                        />
                        <Text style={styles.hint}>
                            Used when you create or join a table. It is saved on
                            this phone.
                        </Text>
                    </Section> */}

                    <Section title="Sound">
                        <Row
                            first
                            label="Music"
                            hint="Background music on the home and game screens."
                        >
                            <Toggle
                                label="Music"
                                value={!muted}
                                onChange={(on) => setMuted(!on)}
                            />
                        </Row>
                    </Section>

                    {/* <Section title="Gameplay">
                        <Row
                            first
                            label="Card animations"
                            hint="Cards fly across the table and slide into your hand."
                        >
                            <Toggle
                                label="Card animations"
                                value={settings.animations}
                                onChange={(animations) => update({animations})}
                            />
                        </Row>

                        <Row
                            label="Vibration"
                            hint="Feel your turn, penalties and wins."
                        >
                            <Toggle
                                label="Vibration"
                                value={settings.haptics}
                                onChange={(haptics) => update({haptics})}
                            />
                        </Row>

                        <Row
                            label="Sort my hand"
                            hint="Group cards by suit and rank."
                        >
                            <Toggle
                                label="Sort my hand"
                                value={settings.sortHand}
                                onChange={(sortHand) => update({sortHand})}
                            />
                        </Row>

                        <View style={[styles.rowStack, styles.rowLine]}>
                            <Text style={styles.label}>Card size</Text>
                            <Text style={styles.hint}>
                                The cards in your hand.
                            </Text>
                            <Segmented
                                options={CARD_SIZES}
                                value={settings.cardSize}
                                onChange={(cardSize) => update({cardSize})}
                            />
                        </View>
                    </Section> */}

                    {/* <Section title="Connection">
                        <Row first label="Status">
                            <View
                                style={
                                    connected ? styles.pillOn : styles.pillOff
                                }
                            >
                                <Text
                                    style={
                                        connected
                                            ? styles.pillOnText
                                            : styles.pillOffText
                                    }
                                >
                                    {connected ? "Connected" : "Not connected"}
                                </Text>
                            </View>
                        </Row>

                        <View style={[styles.rowStack, styles.rowLine]}>
                            <Text style={styles.label}>Server address</Text>
                            <Text style={styles.value} selectable>
                                {String(SERVER_URL)}
                            </Text>
                        </View>

                        {!connected ? (
                            <Pressable
                                onPress={onReconnect}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>Reconnect</Text>
                            </Pressable>
                        ) : null}
                    </Section> */}

                    {/* <Section title="Help">
                        <Pressable
                            onPress={() => setShowRules(true)}
                            style={styles.button}
                        >
                            <Text style={styles.buttonText}>
                                View game rules
                            </Text>
                        </Pressable>
                        <Pressable onPress={reset} style={styles.buttonGhost}>
                            <Text style={styles.buttonGhostText}>
                                Reset settings
                            </Text>
                        </Pressable>
                    </Section> */}
                </View>
            </ScrollView>

            <RulesModal
                visible={showRules}
                onClose={() => setShowRules(false)}
            />
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    scroll: {paddingHorizontal: 16, paddingBottom: 28},
    page: {width: "100%", maxWidth: 560, alignSelf: "center"},

    topRow: {flexDirection: "row", alignItems: "center", paddingTop: 8},
    back: {flexDirection: "row", alignItems: "center", paddingVertical: 4},
    chevron: {
        color: C.gold,
        fontSize: 28,
        lineHeight: 32,
        marginRight: 5,
        fontWeight: "600",
    },
    backText: {color: C.gold, fontSize: 15, fontWeight: "600"},

    titleBlock: {alignItems: "center", marginTop: -2, marginBottom: 14},
    gear: {color: C.gold, fontSize: 34, lineHeight: 40},
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
    cardBody: {padding: 12, paddingVertical: 8},

    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    rowStack: {paddingVertical: 8},
    rowLine: {borderTopWidth: 1, borderTopColor: C.pinkLine},
    rowText: {flex: 1, marginRight: 12},
    label: {color: C.ink, fontSize: 14.5, fontWeight: "600"},
    hint: {color: C.muted, fontSize: 12, marginTop: 1},
    value: {color: C.wine, fontSize: 13.5, fontWeight: "600", marginTop: 3},

    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: C.pinkLine,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        color: C.ink,
        fontSize: 15,
        marginTop: 6,
        marginBottom: 6,
    },

    segment: {
        flexDirection: "row",
        borderWidth: 1.5,
        borderColor: C.wine,
        borderRadius: 8,
        overflow: "hidden",
        marginTop: 8,
    },
    segmentItem: {flex: 1, alignItems: "center", paddingVertical: 8},
    segmentActive: {backgroundColor: C.wine},
    segmentText: {color: C.wine, fontSize: 13.5, fontWeight: "600"},

    pillOn: {
        backgroundColor: "#CFE8CF",
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    pillOnText: {color: "#1E5B26", fontSize: 13, fontWeight: "700"},
    pillOff: {
        backgroundColor: C.pink,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    pillOffText: {color: C.wine, fontSize: 13, fontWeight: "700"},

    button: {
        alignSelf: "center",
        backgroundColor: C.wine,
        borderRadius: 8,
        paddingHorizontal: 22,
        paddingVertical: 9,
        marginVertical: 6,
        borderBottomWidth: 3,
        borderBottomColor: C.wineDark,
    },
    buttonText: {color: "#FFFFFF", fontSize: 14.5, fontWeight: "600"},
    buttonGhost: {
        alignSelf: "center",
        borderWidth: 1.5,
        borderColor: C.wine,
        borderRadius: 8,
        paddingHorizontal: 22,
        paddingVertical: 8,
        marginVertical: 6,
    },
    buttonGhostText: {color: C.wine, fontSize: 14.5, fontWeight: "600"},
});
