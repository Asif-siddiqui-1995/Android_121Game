import {createAudioPlayer, setAudioModeAsync} from "expo-audio";
import {useEffect, useSyncExternalStore} from "react";
import {AppState} from "react-native";

const TRACKS = {
    home: require("../../assets/music/home.mp3"),
    game: require("../../assets/music/game.mp3"),
};
const VOLUME = 0.4;

const players = {};
let current = null;
let muted = false;
let ready = false;
const listeners = new Set();

async function init() {
    if (ready) return;
    ready = true;
    try {
        await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
            interruptionMode: "mixWithOthers",
        });
    } catch {}
}

function getPlayer(key) {
    if (!players[key]) {
        const player = createAudioPlayer(TRACKS[key]);
        player.loop = true;
        player.volume = VOLUME;
        players[key] = player;
    }
    return players[key];
}

export async function playMusic(key) {
    await init();
    if (current && current !== key) players[current]?.pause();
    current = key;
    if (!muted) getPlayer(key).play();
}

export function pauseMusic() {
    if (current) players[current]?.pause();
}

export function resumeMusic() {
    if (current && !muted) players[current]?.play();
}

export function setMuted(value) {
    muted = value;
    if (muted) pauseMusic();
    else resumeMusic();
    listeners.forEach((fn) => fn());
}

// Hooks ---------------------------------------------------------------

// Call at the top of a screen to play that screen's track.
export function useScreenMusic(key) {
    useEffect(() => {
        playMusic(key);
    }, [key]);
}

// For a mute button: const [muted, toggleMuted] = useMuted();
export function useMuted() {
    const value = useSyncExternalStore(
        (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        () => muted,
    );
    return [value, () => setMuted(!muted)];
}

// Call once in App.js: pauses music when the app goes to the background.
export function useMusicLifecycle() {
    useEffect(() => {
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") resumeMusic();
            else pauseMusic();
        });
        return () => sub.remove();
    }, []);
}
