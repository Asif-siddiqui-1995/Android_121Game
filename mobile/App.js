import React, {useEffect, useRef, useState} from "react";
import {View} from "react-native";
import {io} from "socket.io-client";
import * as ScreenOrientation from "expo-screen-orientation";
import {
    useFonts,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
    Poppins_900Black,
} from "@expo-google-fonts/poppins";

import {SERVER_URL} from "./src/config";
import MatchHistoryScreen from "./src/screens/MatchHistoryScreen";
import MatchDetailsScreen from "./src/screens/MatchDetailsScreen";
import LobbyScreen from "./src/screens/LobbyScreen";
import SettingsScreen from "./src/screens/SettingScreen";
import WaitingScreen from "./src/screens/WaitingScreen";
import GameScreen from "./src/screens/GameScreen";
import {useMusicLifecycle} from "./src/audio/music";

export default function App() {
    useMusicLifecycle();

    const socketRef = useRef(null);

    // Poppins is bundled with the app, so text looks the same on every phone.
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_400Regular_Italic,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
        Poppins_700Bold_Italic,
        Poppins_800ExtraBold,
        Poppins_900Black,
    });

    const [connected, setConnected] = useState(false);
    const [myId, setMyId] = useState(null);
    const [name, setName] = useState("");
    const [codeInput, setCodeInput] = useState("");
    const [room, setRoom] = useState(null);
    const [myHand, setMyHand] = useState([]);
    const [playableIds, setPlayableIds] = useState([]);
    const [message, setMessage] = useState("");

    const [showMatchHistory, setShowMatchHistory] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const socket = io(SERVER_URL, {
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            setMyId(socket.id);
            setMessage("");
        });

        socket.on("disconnect", () => {
            setConnected(false);
            setMyHand([]);
            setPlayableIds([]);
            setMessage("Disconnected from the server.");
        });

        socket.on("room:updated", (updatedRoom) => {
            setRoom(updatedRoom);
        });

        // Private hand and which cards can be played right now.
        socket.on("hand:updated", ({cards, playableIds: ids}) => {
            setMyHand(Array.isArray(cards) ? cards : []);
            setPlayableIds(Array.isArray(ids) ? ids : []);
        });

        socket.on("room:closed", () => {
            setRoom(null);
            setMyHand([]);
            setPlayableIds([]);
            setMessage("The table has closed.");
        });

        socket.on("connect_error", (error) => {
            setMessage(`Connection error: ${error.message}`);
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("room:updated");
            socket.off("hand:updated");
            socket.off("room:closed");
            socket.off("connect_error");
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Messages are short notices, so clear them after a few seconds.
    useEffect(() => {
        if (!message) return undefined;
        const timer = setTimeout(() => setMessage(""), 4000);
        return () => clearTimeout(timer);
    }, [message]);

    // The table plays in landscape; every other screen stays in portrait.
    const inGame =
        Boolean(room) &&
        room.status !== "waiting" &&
        !showMatchHistory &&
        !selectedMatchId &&
        !showSettings;

    useEffect(() => {
        const lock = inGame
            ? ScreenOrientation.OrientationLock.LANDSCAPE
            : ScreenOrientation.OrientationLock.PORTRAIT_UP;

        ScreenOrientation.lockAsync(lock).catch(() => {});
    }, [inGame]);

    function requestRoom(event, payload, onSuccess) {
        const socket = socketRef.current;

        if (!socket?.connected) {
            setMessage("Server is not connected. Check the server URL.");
            return;
        }

        socket.timeout(5000).emit(event, payload, (error, response) => {
            if (error) {
                setMessage("Request timed out. Check your connection.");
                return;
            }

            if (!response?.ok) {
                setMessage(response?.error || "Something went wrong.");
                return;
            }

            if (response.room) setRoom(response.room);
            if (onSuccess) onSuccess(response);
        });
    }

    const createRoom = () => requestRoom("room:create", {name: name.trim()});

    const joinRoom = () =>
        requestRoom("room:join", {
            name: name.trim(),
            code: codeInput.trim().toUpperCase(),
        });

    function startGame() {
        if (!room) return;
        setMyHand([]);
        setPlayableIds([]);
        requestRoom("game:start", {code: room.code});
    }

    function playCard(card, suit) {
        if (!room) return;
        requestRoom("game:play", {code: room.code, cardId: card.id, suit});
    }

    const drawCard = () => room && requestRoom("game:draw", {code: room.code});
    const passTurn = () => room && requestRoom("game:pass", {code: room.code});

    // Leaves the table: tells the server so the other players are not kept
    // waiting for someone who is gone.
    function leaveTable() {
        const socket = socketRef.current;

        if (room && socket?.connected) {
            socket.emit("room:leave", {code: room.code}, () => {});
        }

        setRoom(null);
        setMyHand([]);
        setPlayableIds([]);
        setShowMatchHistory(false);
    }

    // Used by the Settings screen when the server connection dropped.
    function reconnect() {
        const socket = socketRef.current;
        if (!socket || socket.connected) return;
        setMessage("Reconnecting...");
        socket.connect();
    }

    // Wait for the fonts so text never flashes in a different typeface.
    if (!fontsLoaded) {
        return <View style={{flex: 1, backgroundColor: "#4A1628"}} />;
    }

    if (selectedMatchId) {
        return (
            <MatchDetailsScreen
                matchId={selectedMatchId}
                onBack={() => setSelectedMatchId(null)}
            />
        );
    }

    if (showMatchHistory) {
        return (
            <MatchHistoryScreen
                backLabel={room ? "Back to game" : "Back"}
                onSelectMatch={(matchId) => setSelectedMatchId(matchId)}
                onBack={() => setShowMatchHistory(false)}
            />
        );
    }

    if (showSettings) {
        return (
            <SettingsScreen
                name={name}
                setName={setName}
                connected={connected}
                onBack={() => setShowSettings(false)}
                onReconnect={reconnect}
            />
        );
    }

    if (!room) {
        return (
            <LobbyScreen
                connected={connected}
                message={message}
                name={name}
                setName={setName}
                codeInput={codeInput}
                setCodeInput={setCodeInput}
                onCreate={createRoom}
                onJoin={joinRoom}
                onOpenHistory={() => setShowMatchHistory(true)}
                onOpenSettings={() => setShowSettings(true)}
            />
        );
    }

    if (room.status === "waiting") {
        return (
            <WaitingScreen
                room={room}
                myId={myId}
                message={message}
                onStart={startGame}
                onLeave={leaveTable}
            />
        );
    }

    return (
        <GameScreen
            room={room}
            myId={myId}
            myHand={myHand}
            playableIds={playableIds}
            message={message}
            onPlay={playCard}
            onDraw={drawCard}
            onPass={passTurn}
            onNextRound={startGame}
            onLeave={leaveTable}
            onOpenHistory={() => setShowMatchHistory(true)}
        />
    );
}
