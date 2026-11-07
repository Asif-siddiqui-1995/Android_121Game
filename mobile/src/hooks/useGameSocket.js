import {useEffect, useState} from "react";
import {io} from "socket.io-client";
import {SERVER_URL} from "../config";

export function useGameSocket() {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [room, setRoom] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const client = io(SERVER_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
        });

        client.on("connect", () => setConnected(true));
        client.on("disconnect", () => setConnected(false));
        client.on("room:state", setRoom);
        client.on("game:error", (data) => {
            setError(data.message || "Game error");
        });

        setSocket(client);

        return () => {
            client.disconnect();
        };
    }, []);

    function emitAck(event, payload = {}) {
        return new Promise((resolve, reject) => {
            if (!socket?.connected) {
                reject(new Error("Not connected to game server"));
                return;
            }

            socket
                .timeout(5000)
                .emit(event, payload, (timeoutError, result) => {
                    if (timeoutError) {
                        reject(new Error("Server did not respond in time"));
                        return;
                    }

                    if (!result?.ok) {
                        reject(new Error(result?.message || "Request failed"));
                        return;
                    }

                    setError("");
                    if (result.playerId) setPlayerId(result.playerId);
                    resolve(result);
                });
        });
    }

    return {
        socket,
        connected,
        room,
        playerId,
        error,
        setError,
        emitAck,
    };
}
