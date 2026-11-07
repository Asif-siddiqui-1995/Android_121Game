import {useEffect, useState} from "react";

// Keeps the last few things that happened, like a chat log.
export default function useActionLog(lastAction, max = 3) {
    const [log, setLog] = useState([]);

    useEffect(() => {
        if (!lastAction) return;
        setLog((lines) =>
            lines[lines.length - 1] === lastAction
                ? lines
                : [...lines, lastAction].slice(-max),
        );
    }, [lastAction, max]);

    return log;
}
