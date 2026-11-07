import AsyncStorage from "@react-native-async-storage/async-storage";

const IDENTITY_KEY = "@card_arena/player_identity";

export async function loadPlayerIdentity() {
    const saved = await AsyncStorage.getItem(IDENTITY_KEY);
    return saved ? JSON.parse(saved) : null;
}

export async function savePlayerIdentity(identity) {
    await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export async function clearPlayerIdentity() {
    await AsyncStorage.removeItem(IDENTITY_KEY);
}
