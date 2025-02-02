export function calculatePlayerStats(playerId, matches) {
  let stats = {
    id: playerId,
    nickname: '',
    games: 0,
    wins: 0,
    loses: 0,
    points: 0,
    avgScore: 0,
    bestLastScore: 0,
    highestCheckout: 0,
    avgDartsToEnd: 0,
    winRate: '0%',
    form: [],
    bestOpponent: { name: '', wins: 0 },
    worstOpponent: { name: '', losses: 0 },
    lastScoreBuckets: { '100+': 0, '60+': 0, '50+': 0, '40+': 0 }, // New feature
  };

  let totalScore = 0,
    totalGamesWithScore = 0,
    dartsToEnd = [],
    opponents = {};

  matches.forEach((match) => {
    const isPlayer1 = match.player1.id === playerId;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    const winnerId = match.winner_id;
    const statsKey = isPlayer1
      ? match.stats[match.player1.id]
      : match.stats[match.player2.id];

    stats.nickname = isPlayer1
      ? match.player1.nickname
      : match.player2.nickname;
    stats.games++;

    if (winnerId === playerId) {
      stats.wins++;
      stats.points += 3;
      dartsToEnd.push(statsKey?.darts || 0);
      stats.form.push('W');
      opponents[opponent.id] = opponents[opponent.id] || {
        name: opponent.nickname,
        wins: 0,
        losses: 0,
      };
      opponents[opponent.id].wins++;
    } else {
      stats.loses++;
      stats.form.push('L');
      opponents[opponent.id] = opponents[opponent.id] || {
        name: opponent.nickname,
        wins: 0,
        losses: 0,
      };
      opponents[opponent.id].losses++;
    }

    totalScore += statsKey?.avg || 0;
    totalGamesWithScore++;
    stats.bestLastScore = Math.max(
      stats.bestLastScore,
      ...(statsKey?.history.map((h) => h.lastScore) || [0])
    );
    stats.highestCheckout = Math.max(
      stats.highestCheckout,
      ...(statsKey?.history
        .filter((h) => h.actualScore === 0)
        .map((h) => h.lastScore) || [0])
    );

    // Categorize lastScore into buckets
    statsKey?.history.forEach((entry) => {
      const lastScore = entry.lastScore;

      if (lastScore >= 100) {
        stats.lastScoreBuckets['100+']++;
      } else if (lastScore >= 60) {
        stats.lastScoreBuckets['60+']++;
      } else if (lastScore >= 50) {
        stats.lastScoreBuckets['50+']++;
      } else if (lastScore >= 40) {
        stats.lastScoreBuckets['40+']++;
      }
    });
  });

  stats.avgScore = totalGamesWithScore
    ? (totalScore / totalGamesWithScore).toFixed(2)
    : 0;
  stats.winRate = stats.games
    ? ((stats.wins / stats.games) * 100).toFixed(2) + '%'
    : '0%';

  Object.values(opponents).forEach((opponent) => {
    if (opponent.wins > stats.bestOpponent.wins) {
      stats.bestOpponent = opponent;
    }
    if (opponent.losses > stats.worstOpponent.losses) {
      stats.worstOpponent = opponent;
    }
  });

  return stats;
}
