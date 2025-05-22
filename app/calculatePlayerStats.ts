export interface PlayerStats {
  id: string;
  nickname: string;
  avgScoreHistory: number[];
  avgScoreGlobal: number;
  lastScoreBuckets: Record<string, number>;
  threeDartsAvgHistory: number[];
  games: number;
  wins: number;
  loses: number;
  winRate: string;
  bestCheckout: { score: number; matchId: string };
  bestAvg: { avg: number; matchId: string };
  bestLastScore: number;
  bestWinsAgainst: { name: string; count: number };
  bestLossesAgainst: { name: string; count: number };
  form: string;
}

export interface Match {
  id: string;
  created_at: string;
  tournament: { name: string };
  player1: { id: string; nickname: string };
  player2: { id: string; nickname: string };
  winner_id: string;
  stats: Record<string, any>;
}

export function calculatePlayerStats(
  playerId: string,
  matches: Match[]
): PlayerStats {
  let stats: PlayerStats = {
    id: playerId,
    nickname: '',
    avgScoreHistory: [],
    lastScoreBuckets: { '100+': 0, '80+': 0, '60+': 0, '50+': 0, '40+': 0 },
    threeDartsAvgHistory: [],
    avgScoreGlobal: 0,
    games: 0,
    wins: 0,
    loses: 0,
    winRate: '0%',
    bestCheckout: { score: 0, matchId: '' },
    bestAvg: { avg: 0, matchId: '' },
    bestLastScore: 0,
    bestWinsAgainst: { name: '', count: 0 },
    bestLossesAgainst: { name: '', count: 0 },
    form: '',
  };
  let totalScore = 0;
  let totalGamesWithScore = 0;
  let opponents: Record<
    string,
    { name: string; wins: number; losses: number }
  > = {};

  matches.forEach((match) => {
    const isPlayer1 = match.player1.id === playerId;
    const player = isPlayer1 ? match.player1 : match.player2;
    const opponent = isPlayer1 ? match.player2 : match.player1;
    const statsKey = match.stats[playerId];

    stats.nickname = player.nickname;
    stats.games++;

    if (match.winner_id === playerId) {
      stats.wins++;
      stats.form += 'W ';
      opponents[opponent.id] = opponents[opponent.id] || {
        name: opponent.nickname,
        wins: 0,
        losses: 0,
      };
      opponents[opponent.id].wins++;
    } else {
      stats.loses++;
      stats.form += 'L ';
      opponents[opponent.id] = opponents[opponent.id] || {
        name: opponent.nickname,
        wins: 0,
        losses: 0,
      };
      opponents[opponent.id].losses++;
    }
    if (statsKey?.avg) {
      totalScore += statsKey.avg;
      totalGamesWithScore++;
    }
    stats.avgScoreHistory.push(statsKey?.avg || 0);
    stats.bestLastScore = Math.max(
      stats.bestLastScore,
      ...(statsKey?.history.map((h) => h.lastScore) || [0])
    );

    // Best Checkout
    const checkouts =
      statsKey?.history
        .filter((h) => h.actualScore === 0)
        .map((h) => ({ score: h.lastScore, match: match })) || [];
    checkouts.forEach((checkout) => {
      if (checkout.score > stats.bestCheckout.score) {
        stats.bestCheckout = checkout;
      }
    });

    // Best Avg Score
    if (statsKey?.avg > stats.bestAvg.avg) {
      stats.bestAvg = { avg: statsKey.avg, match: match };
    }

    // 3 Darts Avg History
    statsKey?.history.forEach((entry) => {
      stats.threeDartsAvgHistory.push(entry.actualAvg);
    });

    // Last Score Buckets
    statsKey?.history.forEach((entry) => {
      const lastScore = entry.lastScore;
      if (lastScore >= 100) stats.lastScoreBuckets['100+']++;
      else if (lastScore >= 80) stats.lastScoreBuckets['80+']++;
      else if (lastScore >= 60) stats.lastScoreBuckets['60+']++;
      else if (lastScore >= 50) stats.lastScoreBuckets['50+']++;
      else if (lastScore >= 40) stats.lastScoreBuckets['40+']++;
    });
  });
  stats.avgScoreGlobal =
    totalGamesWithScore > 0
      ? parseFloat((totalScore / totalGamesWithScore).toFixed(2))
      : 0;

  stats.winRate = stats.games
    ? ((stats.wins / stats.games) * 100).toFixed(2) + '%'
    : '0%';

  // Find best opponents
  Object.values(opponents).forEach((opponent) => {
    if (opponent.wins > stats.bestWinsAgainst.count) {
      stats.bestWinsAgainst = { name: opponent.name, count: opponent.wins };
    }
    if (opponent.losses > stats.bestLossesAgainst.count) {
      stats.bestLossesAgainst = { name: opponent.name, count: opponent.losses };
    }
  });

  return stats;
}
