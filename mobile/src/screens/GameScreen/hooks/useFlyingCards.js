import {useCallback, useLayoutEffect, useRef, useState} from "react";
import {measure, useLatest} from "../utils";

// Base flight times (ms). Reduce motion makes them shorter and calmer
// instead of removing them, because many Android phones report "reduce
// motion" whenever battery saver is on and the game then looks frozen.
const SPEED = {play: 300, opponent: 340, draw: 320, drawGap: 80};
const CALM_FACTOR = 0.6;

// Owns every "card flies from A to B" animation plus the refs used to
// find A and B on screen.
export default function useFlyingCards({
    room,
    myId,
    reduceMotion,
    handW,
    tableW,
    onPlay,
}) {
    const [flights, setFlights] = useState([]);
    const [hiddenHandId, setHiddenHandId] = useState(null);
    const [hiddenTopId, setHiddenTopId] = useState(null);

    const overlayRef = useRef(null);
    const pileRef = useRef(null);
    const slotRef = useRef(null);
    const handRef = useRef(null);
    const seatRefs = useRef({});
    const flightCounter = useRef(0);
    const doneCallbacks = useRef({});
    const lastSeq = useRef(room.lastEvent?.seq ?? null);
    const onPlayRef = useLatest(onPlay);

    const getSeatRef = useCallback((id) => {
        if (!seatRefs.current[id]) seatRefs.current[id] = {current: null};
        return seatRefs.current[id];
    }, []);

    const speed = reduceMotion ? CALM_FACTOR : 1;

    const launch = useCallback(async (flight) => {
        const origin = await measure(overlayRef);
        const ox = origin ? origin.cx - origin.w / 2 : 0;
        const oy = origin ? origin.cy - origin.h / 2 : 0;
        const id = ++flightCounter.current;

        doneCallbacks.current[id] = flight.onDone;

        setFlights((list) => [
            ...list,
            {
                id,
                card: flight.card,
                from: {
                    cx: flight.from.cx - ox,
                    cy: flight.from.cy - oy,
                    w: flight.from.w,
                },
                to: {
                    cx: flight.to.cx - ox,
                    cy: flight.to.cy - oy,
                    w: flight.to.w,
                },
                delay: Math.round((flight.delay ?? 0) * speed),
                duration: Math.round((flight.duration ?? SPEED.draw) * speed),
                calm: reduceMotion,
                rotFrom: flight.rotFrom ?? 0,
                rotTo: flight.rotTo ?? 0,
            },
        ]);
    }, [reduceMotion, speed]);

    const finishFlight = useCallback((id) => {
        const callback = doneCallbacks.current[id];
        delete doneCallbacks.current[id];
        callback?.();
        setFlights((list) => list.filter((flight) => flight.id !== id));
    }, []);

    const playWithFlight = useCallback(
        async (card, from, suit) => {
            onPlayRef.current(card, suit);

            if (!from) return;

            setHiddenHandId(card.id);
            setHiddenTopId(card.id);

            const to = await measure(slotRef);
            const clear = () => {
                setHiddenHandId(null);
                setHiddenTopId(null);
            };

            if (!to) {
                clear();
                return;
            }

            launch({
                card,
                from: {cx: from.cx, cy: from.cy, w: handW},
                to: {cx: to.cx, cy: to.cy, w: tableW},
                duration: SPEED.play,
                rotFrom: -6,
                rotTo: 0,
                onDone: clear,
            });
        },
        [handW, tableW, launch, onPlayRef],
    );

    const opponentPlay = useCallback(
        async (event) => {
            setHiddenTopId(event.card.id);

            const [from, to] = await Promise.all([
                measure(getSeatRef(event.playerId)),
                measure(slotRef),
            ]);

            if (!from || !to) {
                setHiddenTopId(null);
                return;
            }

            launch({
                card: event.card,
                from: {cx: from.cx, cy: from.cy, w: 30},
                to: {cx: to.cx, cy: to.cy, w: tableW},
                duration: SPEED.opponent,
                rotFrom: -28,
                rotTo: 0,
                onDone: () => setHiddenTopId(null),
            });
        },
        [getSeatRef, launch, tableW],
    );

    const drawFlights = useCallback(
        async (event) => {
            const mine = event.playerId === myId;
            const [pile, target] = await Promise.all([
                measure(pileRef),
                measure(mine ? handRef : getSeatRef(event.playerId)),
            ]);

            if (!pile || !target) return;

            const count = Math.min(event.count || 1, 5);

            for (let i = 0; i < count; i++) {
                launch({
                    card: null,
                    from: {cx: pile.cx, cy: pile.cy, w: tableW},
                    to: {cx: target.cx, cy: target.cy, w: mine ? handW : 28},
                    delay: i * SPEED.drawGap,
                    duration: SPEED.draw,
                    rotFrom: 0,
                    rotTo: (i % 2 ? 1 : -1) * (6 + i * 3),
                });
            }
        },
        [myId, getSeatRef, launch, tableW, handW],
    );

    // Runs before the screen paints, so the new top card can be hidden
    // until the flying card reaches it. The seq guard makes re-runs
    // caused by changing deps harmless.
    useLayoutEffect(() => {
        const event = room.lastEvent;

        if (!event || event.seq === lastSeq.current) return;
        lastSeq.current = event.seq;

        if (event.type === "play" && event.playerId !== myId)
            opponentPlay(event);
        else if (event.type === "draw") drawFlights(event);
    }, [room.lastEvent, myId, opponentPlay, drawFlights]);

    return {
        flights,
        finishFlight,
        playWithFlight,
        hiddenHandId,
        hiddenTopId,
        overlayRef,
        pileRef,
        slotRef,
        handRef,
        getSeatRef,
    };
}
