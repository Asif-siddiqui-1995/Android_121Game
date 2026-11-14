import {useEffect, useState} from "react";
import {AccessibilityInfo} from "react-native";

// One shared value for the whole app instead of every component asking the
// OS on its own. Note: on many Android phones this is also true when battery
// saver turns system animations off, so callers should make motion shorter
// and calmer, not remove it, or the game feels broken on those phones.
let current = false;
const listeners = new Set();
let started = false;

function start() {
    if (started) return;
    started = true;

    const set = (value) => {
        current = Boolean(value);
        listeners.forEach((fn) => fn(current));
    };

    AccessibilityInfo.isReduceMotionEnabled().then(set).catch(() => {});
    AccessibilityInfo.addEventListener?.("reduceMotionChanged", set);
}

export default function useReduceMotion() {
    const [reduceMotion, setReduceMotion] = useState(current);

    useEffect(() => {
        start();
        listeners.add(setReduceMotion);
        setReduceMotion(current);
        return () => {
            listeners.delete(setReduceMotion);
        };
    }, []);

    return reduceMotion;
}
