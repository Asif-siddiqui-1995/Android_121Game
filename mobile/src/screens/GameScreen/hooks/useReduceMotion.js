import {useEffect, useState} from "react";
import {AccessibilityInfo} from "react-native";

export default function useReduceMotion() {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((value) => mounted && setReduceMotion(value))
            .catch(() => {});

        const sub = AccessibilityInfo.addEventListener?.(
            "reduceMotionChanged",
            setReduceMotion,
        );

        return () => {
            mounted = false;
            sub?.remove?.();
        };
    }, []);

    return reduceMotion;
}
