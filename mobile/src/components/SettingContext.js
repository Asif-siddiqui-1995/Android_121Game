import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const KEY = "121:settings:v1";

export const DEFAULT_SETTINGS = {
    playerName: "",
    animations: true,
    haptics: true,
    sortHand: true,
    cardSize: "medium", // "small" | "medium" | "large"
};

export const CARD_SCALE = {small: 0.88, medium: 1, large: 1.14};

const SettingsContext = createContext({
    settings: DEFAULT_SETTINGS,
    update: () => {},
    reset: () => {},
});

// Loads the saved settings before showing the app, then saves every change.
export function SettingsProvider({children, fallback = null}) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let alive = true;

        AsyncStorage.getItem(KEY)
            .then((raw) => {
                if (!alive || !raw) return;
                try {
                    setSettings({...DEFAULT_SETTINGS, ...JSON.parse(raw)});
                } catch {
                    // A damaged save is ignored and the defaults are used.
                }
            })
            .catch(() => {})
            .finally(() => alive && setLoaded(true));

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (!loaded) return;
        AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
    }, [settings, loaded]);

    const update = useCallback(
        (patch) => setSettings((prev) => ({...prev, ...patch})),
        [],
    );

    // Resets the options but keeps the player's name.
    const reset = useCallback(
        () =>
            setSettings((prev) => ({
                ...DEFAULT_SETTINGS,
                playerName: prev.playerName,
            })),
        [],
    );

    const value = useMemo(
        () => ({settings, update, reset}),
        [settings, update, reset],
    );

    if (!loaded) return fallback;

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}

// Small vibrations, only when the player has them switched on.
export function useHaptics() {
    const {settings} = useSettings();

    return useMemo(() => {
        const run = (fn) => {
            if (!settings.haptics) return;
            try {
                Promise.resolve(fn()).catch(() => {});
            } catch {
                // Phones without a vibration motor simply do nothing.
            }
        };

        return {
            tap: () =>
                run(() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
                ),
            turn: () =>
                run(() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
                ),
            warn: () =>
                run(() =>
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Warning,
                    ),
                ),
            success: () =>
                run(() =>
                    Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                    ),
                ),
        };
    }, [settings.haptics]);
}
