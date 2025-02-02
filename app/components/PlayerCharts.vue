<template>
  <div class="chart-container">
    <Chart
      v-if="barChartData"
      type="bar"
      :data="barChartData"
      height="h-[200px]"
      :options="barChartOptions"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({ playerData: Object });
// const lineChartData = computed(() => ({
//   labels: props.playerData.lastScoreBuckets.map((_, index) => `Score ${_}`),
//   datasets: [
//     {
//       label: 'Avg Score',
//       data: props.playerData.lastScoreBuckets.map((_, index) => _),
//       borderColor: 'rgba(75, 192, 192, 1)',
//       backgroundColor: 'rgba(75, 192, 192, 0.2)',
//       tension: 0.4,
//     },
//   ],
// }));
// const chartOptions = {
//   responsive: true,
//   maintainAspectRatio: false,
//   scales: {
//     y: { beginAtZero: true, title: { display: true, text: 'Avg Score' } },
//     x: { title: { display: true, text: 'Matches' } },
//   },
// };

// Bar Chart: Last Score Distribution
const barChartData = computed(() => ({
  labels: Object.keys(props.playerData.lastScoreBuckets),
  datasets: [
    {
      label: 'Highest Scores',
      data: Object.values(props.playerData.lastScoreBuckets),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      borderWidth: 2,
    },
  ],
}));

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'Count' } },
    x: { title: { display: true, text: 'Last Score Ranges' } },
  },
};
</script>

<style scoped>
.chart-container {
  max-width: 100%;
  height: 400px;
}
</style>
