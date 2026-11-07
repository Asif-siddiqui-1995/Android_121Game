function determineWinners(players) {
    if (!players.length) return [];

    const highest = Math.max(...players.map((player) => player.card.value));

    return players
        .filter((player) => player.card.value === highest)
        .map((player) => player.id);
}

function awardRound(players) {
    const winners = determineWinners(players);

    for (const player of players) {
        if (winners.includes(player.id)) {
            player.score += 1;
        }
    }

    return winners;
}

function getGameWinner(players, targetScore = 5) {
    const eligible = players.filter((player) => player.score >= targetScore);

    if (!eligible.length) return null;

    const highestScore = Math.max(...eligible.map((player) => player.score));

    const leaders = eligible.filter((player) => player.score === highestScore);

    return leaders.length === 1 ? leaders[0].id : null;
}

module.exports = {
    determineWinners,
    awardRound,
    getGameWinner,
};
