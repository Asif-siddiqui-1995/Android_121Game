import React, {useCallback, useMemo, useState} from "react";
import {StatusBar, StyleSheet, useWindowDimensions, View} from "react-native";
import FlyingCard from "../../components/FlyingCards";
import RoundResultModal from "../../components/RoundResultModal";
import ScreenBackground from "../../components/ScreenBackground";
import SuitPicker from "../../components/SuitPicker";
import useActionLog from "./hooks/useActionLog";
import useFlyingCards from "./hooks/useFlyingCards";
import useGameDerived from "./hooks/useGameDerived";
import useHandDelays from "./hooks/useHandDelays";
import useReduceMotion from "./hooks/useReduceMotion";
import ActionsBar from "./parts/ActionsBar";
import HandFan from "./parts/HandFan";
import LeaveModal from "./parts/LeaveModal";
import OpponentsBar from "./parts/OpponentsBar";
import PlayerPanel from "./parts/PlayerPanel";
import Table from "./parts/Table";
import {cardHeight, clamp} from "./utils";
import useRoundEnd from "./hooks/useRoundEnd";
import {useScreenMusic} from "../../audio/music";

export default function GameScreen({
    room,
    myId,
    myHand,
    playableIds,
    message,
    onPlay,
    onDraw,
    onPass,
    onNextRound,
    onLeave,
    onOpenHistory,
}) {
    useScreenMusic("game");
    const {height} = useWindowDimensions();

    // Card sizes follow the height, because a landscape phone is short.
    const handW = clamp(Math.round(height * 0.155), 44, 66);
    const handH = cardHeight(handW);
    const tableW = handW;

    const [eightCard, setEightCard] = useState(null); // {card, from}
    const [confirmLeave, setConfirmLeave] = useState(false);

    const {roundOver, showResult} = useRoundEnd(room.roundResult, 3000);

    const reduceMotion = useReduceMotion();
    const log = useActionLog(room.lastAction);
    const game = useGameDerived({room, myId, myHand, playableIds});
    const delays = useHandDelays(game.sortedHand);
    const fly = useFlyingCards({
        room,
        myId,
        reduceMotion,
        handW,
        tableW,
        onPlay,
    });

    const {playWithFlight} = fly;

    const winner = useMemo(() => {
        const result = room.roundResult;
        if (!result) return null;
        const id = result.winnerId ?? result.winner?.id;
        const player = room.players.find((p) => p.id === id);
        return {
            name: player?.name ?? result.winnerName ?? result.winner?.name,
            isMe: id === myId,
        };
    }, [room.roundResult, room.players, myId]);

    const handleCardPress = useCallback(
        (card, from) => {
            if (card.rank === "8") setEightCard({card, from});
            else playWithFlight(card, from);
        },
        [playWithFlight],
    );

    const handlePickSuit = useCallback(
        (suit) => {
            const picked = eightCard;
            setEightCard(null);
            if (picked) playWithFlight(picked.card, picked.from, suit);
        },
        [eightCard, playWithFlight],
    );

    const cancelSuit = useCallback(() => setEightCard(null), []);
    const openLeave = useCallback(() => setConfirmLeave(true), []);
    const closeLeave = useCallback(() => setConfirmLeave(false), []);
    const confirmLeaveNow = useCallback(() => {
        setConfirmLeave(false);
        onLeave();
    }, [onLeave]);

    const bottomStyle = useMemo(
        () => [styles.bottom, {height: handH + 38}],
        [handH],
    );

    const drawLabel = game.facingPenalty ? `Draw ${room.pendingDraw}` : "Draw";

    return (
        <ScreenBackground>
            <StatusBar hidden />

            <View style={styles.root} ref={fly.overlayRef} collapsable={false}>
                <OpponentsBar
                    opponents={game.opponents}
                    getSeatRef={fly.getSeatRef}
                    playing={game.playing}
                    currentPlayerId={room.currentPlayerId}
                    targetScore={room.targetScore}
                    code={room.code}
                    roundNumber={room.roundNumber}
                />

                <Table
                    tableW={tableW}
                    pileRef={fly.pileRef}
                    slotRef={fly.slotRef}
                    canDraw={game.canDraw}
                    onDraw={onDraw}
                    drawPileCount={room.drawPileCount}
                    olderCards={game.olderCards}
                    topCard={game.topCard}
                    topHidden={fly.hiddenTopId === game.topCard?.id}
                    chosenSuit={room.chosenSuit}
                    pendingDraw={room.pendingDraw}
                    turnText={game.turnText}
                    isMyTurn={game.isMyTurn}
                    message={message}
                    winner={roundOver ? winner : null}
                />

                <View style={bottomStyle}>
                    <PlayerPanel
                        name={game.me?.name}
                        score={game.me?.score}
                        limit={room.targetScore}
                        log={log}
                    />
                    <HandFan
                        handRef={fly.handRef}
                        hand={game.sortedHand}
                        handW={handW}
                        isMyTurn={game.isMyTurn}
                        playableSet={game.playableSet}
                        hiddenId={fly.hiddenHandId}
                        delays={delays}
                        onCardPress={handleCardPress}
                        myName={game.me?.name}
                    />
                    <ActionsBar
                        drawLabel={drawLabel}
                        canDraw={game.canDraw}
                        onDraw={onDraw}
                        showPass={game.isMyTurn && Boolean(room.canPass)}
                        onPass={onPass}
                        onLobby={openLeave}
                    />
                </View>

                {fly.flights.map((flight) => (
                    <FlyingCard
                        key={flight.id}
                        flight={flight}
                        onDone={fly.finishFlight}
                    />
                ))}
            </View>

            <SuitPicker
                visible={Boolean(eightCard)}
                onPick={handlePickSuit}
                onCancel={cancelSuit}
            />

            {showResult ? (
                <RoundResultModal
                    room={room}
                    isHost={Boolean(game.me?.isHost)}
                    onNextRound={onNextRound}
                    onLeave={onLeave}
                    onOpenHistory={onOpenHistory}
                />
            ) : null}

            <LeaveModal
                visible={confirmLeave}
                onStay={closeLeave}
                onLeave={confirmLeaveNow}
            />
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    root: {flex: 1},
    bottom: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 10,
        paddingBottom: 6,
    },
});
