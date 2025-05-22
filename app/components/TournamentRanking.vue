<script setup lang="ts">
const props = defineProps<{
  matches: Match[];
}>();
const { matches } = toRefs(props);
const ranking = ref([]);

onMounted(() => {
  calculateRanking();
});

function calculateRanking() {
  let playerStats = {};
  console.log(matches.value);
  matches.value
    .filter((match) => match.winner_id) // Only process completed matches
    .forEach((match) => {
      const { player1, player2, winner_id, stats } = match;

      [player1, player2].forEach((player) => {
        if (!playerStats[player.id]) {
          playerStats[player.id] = {
            id: player.id,
            nickname: player.nickname,
            games: 0,
            wins: 0,
            loses: 0,
            points: 0,
            avgScoreGlobal: 0, // ✅ Global Avg Score
            bestLastScore: 0,
            highestCheckout: 0,
            totalScore: 0,
            matchesWithStats: 0, // ✅ Count of matches with avg score
            last5Games: [],
          };
        }
      });

      let p1Stats = playerStats[player1.id];
      let p2Stats = playerStats[player2.id];

      // Count matches only if there's a winner
      p1Stats.games++;
      p2Stats.games++;

      // Assign win/loss & points
      if (winner_id === player1.id) {
        p1Stats.wins++;
        p2Stats.loses++;
        p1Stats.points += 3;
        p1Stats.last5Games.push('W');
        p2Stats.last5Games.push('L');
      } else {
        p2Stats.wins++;
        p1Stats.loses++;
        p2Stats.points += 3;
        p2Stats.last5Games.push('W');
        p1Stats.last5Games.push('L');
      }

      // ✅ Corrected Global Avg Score Calculation
      [player1.id, player2.id].forEach((id) => {
        let playerMatchStats = stats[id];
        if (playerMatchStats?.avg) {
          playerStats[id].totalScore += playerMatchStats.avg; // ✅ Use match avg, not turn-by-turn avg
          playerStats[id].matchesWithStats++; // ✅ Track matches that have avg scores
        }

        // Track highest checkout (if actualScore reaches 0, lastScore is the checkout)
        playerMatchStats?.history.forEach((entry) => {
          playerStats[id].bestLastScore = Math.max(
            playerStats[id].bestLastScore,
            entry.lastScore
          );
          if (entry.actualScore === 0) {
            playerStats[id].highestCheckout = Math.max(
              playerStats[id].highestCheckout,
              entry.lastScore
            );
          }
        });
      });
    });

  // ✅ Compute final global average scores
  Object.values(playerStats).forEach((player) => {
    player.avgScoreGlobal = player.matchesWithStats
      ? (player.totalScore / player.matchesWithStats).toFixed(2)
      : '0.00'; // ✅ Now correctly divides by total matches, not turns

    player.winRate = player.games
      ? ((player.wins / player.games) * 100).toFixed(2) + '%'
      : '0%';

    player.last5Games = player.last5Games.join('-');
  });

  // Sort players by points and wins
  let rankedPlayers = Object.values(playerStats).sort(
    (a, b) => b.points - a.points || b.wins - a.wins
  );

  // Assign ranking (handle ties)
  let rank = 1;
  for (let i = 0; i < rankedPlayers.length; i++) {
    if (
      i > 0 &&
      rankedPlayers[i].points === rankedPlayers[i - 1].points &&
      rankedPlayers[i].wins === rankedPlayers[i - 1].wins
    ) {
      rankedPlayers[i].ranking = rankedPlayers[i - 1].ranking;
    } else {
      rankedPlayers[i].ranking = rank;
    }
    rank++;
  }

  ranking.value = rankedPlayers;
}
watch(matches, calculateRanking);
//
</script>

<template>
  <div class="card max-w-[90vw]">
    <h2>Aktualna Tabela</h2>
    <DataTable
      scrollable
      :value="ranking"
      header="Flex Scroll"
      :style="{ width: '90vw', maxWidth: '100%' }"
      maximizable
      modal
      :contentStyle="{ height: '300px', padding: '32px' }"
    >
      <Column header="ranking">
        <template #body="{ data }">
          <div class="text-center flex items-center justify-center">
            <div
              v-if="data.ranking === 1"
              class="i-twemoji-1st-place-medal text-2xl"
            />
            <div
              v-else-if="data.ranking === 2"
              class="i-twemoji-2nd-place-medal text-2xl"
            />
            <div
              v-else-if="data.ranking === 3"
              class="i-twemoji-3rd-place-medal text-2xl"
            />
            <div v-else>
              {{ data.ranking }}
            </div>
          </div>
        </template>
      </Column>
      <Column frozen field="nickname" header="nickname">
        <template #body="{ data }">
          <NuxtLink
            class="text-primary no-underline"
            :to="`/players/${data.id}`"
          >
            <img :src="data.image_url" />
            {{ data.nickname }}</NuxtLink
          >
        </template>
      </Column>
      <!-- <Column field="points" header="points"></Column> -->
      <Column field="games" header="games"></Column>
      <Column field="wins" header="wins"></Column>
      <Column field="loses" header="loses"></Column>
      <Column field="winRate" header="Win Rate"></Column>
      <Column field="bestLastScore" header="Best Round"></Column>
      <Column field="highestCheckout" header="Highest Checkout"></Column>
      <Column field="last5Games" header="games">
        <template #body="{ data }">
          <div class="text-center flex wrap gap-1">
            <div
              class="font-bold"
              :class="{
                'i-twemoji-green-circle': g === 'W',
                'i-twemoji-red-circle': g === 'L',
              }"
              :key="`${data.nickname}${g}${idx}`"
              v-for="(g, idx) in data.last5Games.split('-')"
            />
          </div>
        </template>
      </Column>
      <Column field="avgScoreGlobal" header="Avg."></Column>
      <!-- <Column field="avgDartsToEnd" header="Avg Darts to win"></Column> -->
    </DataTable>
  </div>
</template>
