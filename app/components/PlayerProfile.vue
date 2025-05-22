<template>
  <div class="profile-container gap-5">
    <h1>{{ playerStats.nickname }}'s Profile</h1>

    <!-- Basic Stats -->
    <Card>
      <template #content>
        <div class="p-grid p-ai-center">
          <div class="p-col">
            <strong>Games:</strong> {{ playerStats.games }}
          </div>
          <div class="p-col"><strong>Wins:</strong> {{ playerStats.wins }}</div>
          <div class="p-col">
            <strong>Losses:</strong> {{ playerStats.loses }}
          </div>
          <div class="p-col">
            <strong>Win Rate:</strong> {{ playerStats.winRate }}
          </div>
          <div class="p-col">
            <strong>Global Avg Score:</strong> {{ playerStats.avgScoreGlobal }}
          </div>

          <!-- <div class="p-col"><strong>Form:</strong> {{ playerStats.form }}</div> -->
        </div>
      </template>
    </Card>

    <Card>
      <template #title>Detailed Stats</template>
      <template #content>
        <p>
          <strong>Highest Checkout:</strong>
          {{ playerStats.bestCheckout.score }} (vs
          {{ getOponent(playerStats.bestCheckout.match).nickname }}
          in {{ playerStats.bestCheckout.match.tournament.name }})
        </p>
        <p>
          <strong>Best Avg Score:</strong>
          {{ playerStats.bestAvg.avg.toFixed(2) }} ( vs
          {{ getOponent(playerStats.bestAvg.match).nickname }} in
          {{ playerStats.bestCheckout.match.tournament.name }})
        </p>
        <p>
          <strong>Best Wins Against:</strong>
          {{ playerStats.bestWinsAgainst.name }} ({{
            playerStats.bestWinsAgainst.count
          }}
          times)
        </p>
        <p>
          <strong>Worst Losses Against:</strong>
          {{ playerStats.bestLossesAgainst.name }} ({{
            playerStats.bestLossesAgainst.count
          }}
          times)
        </p>
      </template>
    </Card>

    <!-- Charts -->
    <div class="chart-grid">
      <Card
        ><template #title>Performance Over Time</template
        ><template #content
          ><LineChart
            v-if="lineChartData"
            :chart-data="lineChartData" /></template
      ></Card>
      <Card
        ><template #title>Last Score Distribution</template
        ><template #content
          ><BarChart v-if="barChartData" :chart-data="barChartData" /></template
      ></Card>
      <Card
        ><template #title>Win/Loss Ratio</template
        ><template #content
          ><PieChart v-if="pieChartData" :chart-data="pieChartData" /></template
      ></Card>
      <Card>
        <template #title>3 Darts Avg Over Matches</template>
        <template #content
          ><LineChart
            v-if="threeDartsChartData"
            :chart-data="threeDartsChartData"
        /></template>
      </Card>
    </div>

    <!-- Match History -->
    <h2>Match History</h2>
    <DataTable :value="formattedMatches" responsiveLayout="scroll" stripedRows>
      <Column field="tournament" header="Tournament"></Column>
      <Column field="opponent" header="Opponent"></Column>
      <Column header="Result">
        <template #body="slotProps">
          <span :class="getResultClass(slotProps.data.result)">
            {{ slotProps.data.result }}
          </span>
        </template>
      </Column>
      <Column field="avgScore" header="Avg Score"></Column>
      <Column field="bestLastScore" header="Best Last Score"></Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { Chart, registerables } from 'chart.js';
import { LineChart, BarChart, PieChart, RadarChart } from 'vue-chart-3';
import { DataTable, Column, Card } from 'primevue';
import {
  PlayerStats,
  Match,
  calculatePlayerStats,
} from '@/calculatePlayerStats';

Chart.register(...registerables);

const props = defineProps<{ playerId: string; playerMatches: Match[] }>();

const playerStats = computed(() =>
  calculatePlayerStats(props.playerId, props.playerMatches)
);
const getOponent = (match: Match) =>
  match.player1.id === props.playerId ? match.player2 : match.player1;
const lineChartData = computed(() => ({
  labels: playerStats.value.avgScoreHistory.map((_, i) => `Match ${i + 1}`),
  datasets: [
    {
      label: 'Avg Score',
      data: playerStats.value.avgScoreHistory,
      borderColor: '#36A2EB',
      backgroundColor: '#9BD0F5',
      tension: 0.4,
    },
  ],
}));

const barChartData = computed(() => ({
  labels: Object.keys(playerStats.value.lastScoreBuckets),
  datasets: [
    {
      label: 'Last Score Count',
      data: Object.values(playerStats.value.lastScoreBuckets),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
    },
  ],
}));

const pieChartData = computed(() => ({
  labels: ['Wins', 'Losses'],
  datasets: [
    {
      data: [playerStats.value.wins, playerStats.value.loses],
      backgroundColor: ['#2ECC71', '#E74C3C'],
    },
  ],
}));

const radarChartData = computed(() => ({
  labels: ['Avg Score', 'Highest Checkout', 'Best Last Score', 'Win Rate'],
  datasets: [
    {
      label: 'Player Stats',
      data: [
        playerStats.value.avgScore,
        playerStats.value.highestCheckout,
        playerStats.value.bestLastScore,
        parseFloat(playerStats.value.winRate),
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
    },
  ],
}));

const formatDate = (row: Match) =>
  new Date(row.created_at).toLocaleDateString();
const formatResult = (row: Match) =>
  row.winner_id === props.playerId ? 'Win' : 'Loss';

const threeDartsChartData = computed(() => ({
  labels: playerStats.value.threeDartsAvgHistory.map(
    (_, i) => `Match ${i + 1}`
  ),
  datasets: [
    {
      label: '3 Darts Avg',
      data: playerStats.value.threeDartsAvgHistory,
      borderColor: '#36A2EB',
    },
  ],
}));
const formattedMatches = computed(() => {
  return props.playerMatches.map((match) => {
    const isPlayer1 = match.player1.id === props.playerId;
    const opponent = isPlayer1
      ? match.player2.nickname
      : match.player1.nickname;
    const statsKey = match.stats[props.playerId];

    return {
      tournament: match.tournament?.name || 'Unknown Tournament',
      opponent,
      result: match.winner_id === props.playerId ? 'WIN' : 'LOSE',
      avgScore: statsKey?.avg.toFixed(2) || 'N/A',
      bestLastScore: Math.max(
        ...(statsKey?.history.map((h) => h.lastScore) || [0])
      ),
    };
  });
});

const getResultClass = (result: string) => (result === 'WIN' ? 'win' : 'lose');
</script>

<style scoped>
.profile-container {
  width: 100%;
  margin-top: 16px;
  margin: auto;
  padding: 20px;
}
.chart-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
.win {
  color: green;
  font-weight: bold;
}
.lose {
  color: red;
  font-weight: bold;
}
</style>
