<template>
  <div class="profile-container">
    <h1>{{ playerData.nickname }}'s Profile</h1>

    <!-- Basic Info -->
    <div class="player-info">
      <p><strong>Games Played:</strong> {{ playerData.games }}</p>
      <p><strong>Wins:</strong> {{ playerData.wins }}</p>
      <p><strong>Losses:</strong> {{ playerData.loses }}</p>
      <p><strong>Win Rate:</strong> {{ playerData.winRate }}</p>

      <!-- <p><strong>Form (Last 5 Games):</strong> {{ playerData.form }}</p> -->
    </div>

    <!-- Last Score Distribution -->

    <!-- Charts -->
    <PlayerCharts v-if="playerData" :player-data="playerData" />

    <!-- Match History -->
    <h2>Match History</h2>
    <div v-for="(matches, tournament) in groupedMatches" :key="tournament">
      <h3>{{ tournament }}</h3>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Opponent</th>
            <th>Result</th>
            <th>Avg Score</th>
            <th>Checkout</th>
            <th>Last Score</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="match in matches" :key="match.id">
            <td>{{ formatDate(match.created_at) }}</td>
            <td>{{ getOpponent(match) }}</td>
            <td
              :class="{
                win: match.winner_id === playerId,
                loss: match.winner_id !== playerId,
              }"
            >
              {{ match.winner_id === playerId ? 'Win' : 'Loss' }}
            </td>
            <td>{{ getAvgScore(match) }}</td>
            <td>{{ getHighestCheckout(match) }}</td>
            <td>{{ getBestLastScore(match) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { calculatePlayerStats } from '@/calculatePlayerStats';
const props = defineProps<{
  playerId: string;
  allMatches: Match[];
}>();
const groupedMatches = computed(() => {
  return props.allMatches.reduce((acc, match) => {
    const tournamentName = match.tournament?.name || 'Unknown Tournament';
    if (!acc[tournamentName]) {
      acc[tournamentName] = [];
    }
    acc[tournamentName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);
});

const playerData = computed(() =>
  calculatePlayerStats(props.playerId, props.allMatches)
);

const getOpponent = (match: Match) => {
  return match.player1.id === props.playerId
    ? match.player2.nickname
    : match.player1.nickname;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString();
};

const getAvgScore = (match: Match) => {
  const statsKey = match.stats[props.playerId];
  return statsKey ? statsKey.avg.toFixed(2) : 'N/A';
};

const getHighestCheckout = (match: Match) => {
  const statsKey = match.stats[props.playerId];
  return (
    statsKey?.history
      .filter((h) => h.actualScore === 0)
      .map((h) => h.lastScore)
      .sort((a, b) => b - a)[0] || 'N/A'
  );
};

const getBestLastScore = (match: Match) => {
  const statsKey = match.stats[props.playerId];
  return (
    statsKey?.history.map((h) => h.lastScore).sort((a, b) => b - a)[0] || 'N/A'
  );
};
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th,
td {
  padding: 10px;
  border: 1px solid var(--p-content-border-color);
  text-align: center;
}
.win {
  color: green;
  font-weight: bold;
}
.loss {
  color: red;
  font-weight: bold;
}
</style>
