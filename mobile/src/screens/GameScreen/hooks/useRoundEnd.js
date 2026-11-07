import {useEffect, useRef, useState} from "react";

// When a round ends, keep the table visible for `delay` ms before the
// result screen is allowed to show.
export default function useRoundEnd(roundResult, delay = 3000) {
    const active = Boolean(roundResult);
    const [revealed, setRevealed] = useState(active);
    const mounted = useRef(false);

    useEffect(() => {
        const first = !mounted.current;
        mounted.current = true;

        if (!active) {
            setRevealed(false);
            return;
        }
        // Joined while a result was already showing: don't make them wait.
        if (first) return;

        const timer = setTimeout(() => setRevealed(true), delay);
        return () => clearTimeout(timer);
    }, [active, delay]);

    return {roundOver: active, showResult: active && revealed};
}
