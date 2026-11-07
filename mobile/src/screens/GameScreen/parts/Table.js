import React, {memo, useMemo} from "react";
import {StyleSheet, View} from "react-native";
import DiscardTrail from "./DiscardTrail";
import DrawPile from "./DrawPile";
import StatusChips from "./StatusChips";
import TopCard from "./TopCard";
import TurnBanner from "./TurnBanner";
import WinnerBanner from "./WinnerBanner";
import {cardHeight} from "../utils";

function Table({
    tableW,
    pileRef,
    slotRef,
    canDraw,
    onDraw,
    drawPileCount,
    olderCards,
    topCard,
    topHidden,
    chosenSuit,
    pendingDraw,
    turnText,
    isMyTurn,
    message,
    winner,
}) {
    const slotStyle = useMemo(
        () => ({width: tableW, height: cardHeight(tableW)}),
        [tableW],
    );

    return (
        <View style={styles.middle}>
            <View style={styles.row}>
                <DrawPile
                    pileRef={pileRef}
                    width={tableW}
                    count={drawPileCount}
                    canDraw={canDraw}
                    onDraw={onDraw}
                />
                <DiscardTrail cards={olderCards} tableW={tableW} />
                <View ref={slotRef} collapsable={false} style={slotStyle}>
                    {topCard ? (
                        <TopCard
                            card={topCard}
                            width={tableW}
                            hidden={topHidden}
                        />
                    ) : null}
                </View>
                <StatusChips
                    chosenSuit={chosenSuit}
                    pendingDraw={pendingDraw}
                />
            </View>

            {winner ? (
                <WinnerBanner name={winner.name} isMe={winner.isMe} />
            ) : (
                <TurnBanner
                    text={turnText}
                    isMyTurn={isMyTurn}
                    message={message}
                />
            )}
        </View>
    );
}

export default memo(Table);

const styles = StyleSheet.create({
    middle: {flex: 1, alignItems: "center", justifyContent: "center"},
    row: {flexDirection: "row", alignItems: "center"},
});
