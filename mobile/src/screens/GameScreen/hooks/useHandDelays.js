import {useEffect, useMemo, useRef} from "react";

// Cards that were not in my hand before slide in after a short delay.
// Returns {cardId: delayMs} for new cards only.
export default function useHandDelays(hand) {
    const seen = useRef(new Set());

    // A new hand starts empty, so forget which cards were already dealt.
    useEffect(() => {
        if (hand.length === 0) seen.current = new Set();
    }, [hand.length]);

    const delays = useMemo(() => {
        const result = {};
        const firstDeal = seen.current.size === 0;
        let index = 0;

        for (const card of hand) {
            if (seen.current.has(card.id)) continue;
            result[card.id] = firstDeal ? index * 45 : 420 + index * 110;
            index += 1;
        }
        return result;
    }, [hand]);

    useEffect(() => {
        hand.forEach((card) => seen.current.add(card.id));
    }, [hand]);

    return delays;
}
