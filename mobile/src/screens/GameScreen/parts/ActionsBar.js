import React, {memo} from "react";
import {StyleSheet, View} from "react-native";
import ActionButton from "./ActionButton";

function ActionsBar({drawLabel, canDraw, onDraw, showPass, onPass, onLobby}) {
    return (
        <View style={styles.actions}>
            <ActionButton title={drawLabel} onPress={onDraw} disabled={!canDraw} />
            {showPass ? (
                <ActionButton title="Pass" variant="ghost" onPress={onPass} />
            ) : null}
            <ActionButton title="Lobby" variant="ghost" onPress={onLobby} />
        </View>
    );
}

export default memo(ActionsBar);

const styles = StyleSheet.create({
    actions: {width: 92, alignSelf: "stretch", justifyContent: "flex-end"},
});
