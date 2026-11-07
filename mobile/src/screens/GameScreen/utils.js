import {useLayoutEffect, useRef} from "react";

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const CARD_RATIO = 1.45;
export const cardHeight = (width) => Math.round(width * CARD_RATIO);

// Centre and size of a view in window coordinates.
export function measure(ref) {
    return new Promise((resolve) => {
        const node = ref?.current;
        if (!node?.measureInWindow) {
            resolve(null);
            return;
        }
        node.measureInWindow((x, y, w, h) =>
            resolve({cx: x + w / 2, cy: y + h / 2, w, h}),
        );
    });
}

// Always holds the latest value, so callbacks can stay stable.
export function useLatest(value) {
    const ref = useRef(value);
    useLayoutEffect(() => {
        ref.current = value;
    });
    return ref;
}
