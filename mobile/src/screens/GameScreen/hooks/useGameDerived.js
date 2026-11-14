import {useMemo} from "react";
import {sortHand} from "../../../components/Theme";

function getTurnText({
    me,
    current,
    room,
    playing,
    isMyTurn,
    facingPenalty,
    hasPlayable,
}) {
    if (me?.eliminated) return "You are out of this game";
    if (!playing) return "Round over";
    if (!isMyTurn) return `Waiting for ${current?.name || "..."}`;

    if (facingPenalty) {
        return hasPlayable
            ? `Answer with a 2 or J♣, or draw ${room.pendingDraw}`
            : `You must draw ${room.pendingDraw}`;
    }
    if (room.tenDraw) return "10: draw a card, play it if it matches";
    if (room.canPass) return "Play the card you drew, or pass";
    if (room.extraTurn) {
        return hasPlayable
            ? "Ace: play another card"
            : "Ace: no match, draw a card";
    }
    return hasPlayable
        ? "Your turn: play a card, or draw"
        : "Nothing to play. Draw a card";
}

export default function useGameDerived({room, myId, myHand, playableIds}) {
    const {players} = room;

    const me = useMemo(() => players.find((p) => p.id === myId), [players, myId]);
    const opponents = useMemo(
        () => players.filter((p) => p.id !== myId),
        [players, myId],
    );
    const current = useMemo(
        () => players.find((p) => p.id === room.currentPlayerId),
        [players, room.currentPlayerId],
    );

    const playing = room.status === "playing" && !room.roundResult;
    const isMyTurn = playing && room.currentPlayerId === myId;
    const facingPenalty = room.pendingDraw > 0;
    const hasPlayable = playableIds.length > 0;
    const canDraw =
        isMyTurn &&
        !room.canPass &&
        (facingPenalty || !(room.extraTurn && hasPlayable));

    const playableSet = useMemo(() => new Set(playableIds), [playableIds]);

    const {topCard, olderCards} = useMemo(() => {
        const recent = room.recentDiscards?.length
            ? room.recentDiscards
            : room.topCard
              ? [room.topCard]
              : [];
        return {
            topCard: recent[recent.length - 1],
            olderCards: recent.slice(0, -1),
        };
    }, [room.recentDiscards, room.topCard]);

    const sortedHand = useMemo(() => sortHand(myHand), [myHand]);

    const turnText = getTurnText({
        me,
        current,
        room,
        playing,
        isMyTurn,
        facingPenalty,
        hasPlayable,
    });

    return {
        me,
        opponents,
        playing,
        isMyTurn,
        facingPenalty,
        canDraw,
        playableSet,
        topCard,
        olderCards,
        sortedHand,
        turnText,
    };
}
