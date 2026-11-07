import {Platform} from "react-native";

export const SERVER_URL =
    Platform.OS === "android"
        ? "http://192.168.1.35:4000"
        : "http://localhost:4000";
