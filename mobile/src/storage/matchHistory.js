import AsyncStorage from "@react-native-async-storage/async-storage";

// Match history lives on this phone only (there is no server database).
// Stored as one JSON list, newest first.
const KEY = "matchHistory:v1";
const MAX_MATCHES = 50;

async function readAll() {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

// Saves a finished match. Safe to call many times with the same match:
// the server keeps sending it until everyone leaves the table.
let queue = Promise.resolve();
export function saveMatch(match) {
    if (!match?._id) return queue;

    // Serialise writes so two quick room updates can't overwrite each other.
    queue = queue.then(async () => {
        const list = await readAll();
        if (list.some((m) => m._id === match._id)) return;

        const next = [match, ...list].slice(0, MAX_MATCHES);
        try {
            await AsyncStorage.setItem(KEY, JSON.stringify(next));
        } catch (error) {
            console.warn("Could not save match history:", error?.message);
        }
    });
    return queue;
}

export async function getMatches() {
    await queue;
    const list = await readAll();
    return list.sort(
        (a, b) => new Date(b.finishedAt) - new Date(a.finishedAt),
    );
}

export async function getMatch(id) {
    const list = await getMatches();
    return list.find((m) => m._id === id) ?? null;
}

export async function clearMatches() {
    await queue;
    await AsyncStorage.removeItem(KEY);
}
