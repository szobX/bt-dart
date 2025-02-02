<script setup lang="ts">
definePageMeta({
  layout: 'normal',
});
const client = useSupabaseClient<Database>();

const matches = ref([]);
const tournamentPlayers = ref([]);
const ranking = ref([]);
onMounted(async () => {
  const { data: tournamentPlayersData } = await client
    .from('matches')
    .select(
      '*, player1:player1_id(id, nickname),player2:player2_id(id,nickname)'
    );
  matches.value = tournamentPlayersData;
  calculateRanking();
});

function calculateRanking() {
  let playerStats = {};

  matches.value
    .filter((match) => match.winner_id) // Only process completed matches
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Sort by match date
    .forEach((match) => {
      const { player1, player2, winner_id, stats, created_at } = match;

      [player1, player2].forEach((player) => {
        if (!playerStats[player.id]) {
          playerStats[player.id] = {
            id: player.id,
            nickname: player.nickname,
            games: 0,
            wins: 0,
            loses: 0,
            points: 0,
            avgScore: 0,
            bestLastScore: 0,
            highestCheckout: 0,
            dartsToEnd: [],
            totalScore: 0,
            totalGamesWithScore: 0,
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
        p1Stats.points += 3; // Win gives 3 points
        p1Stats.dartsToEnd.push(stats[player1.id]?.darts || 0);
        p1Stats.last5Games.push('W');
        p2Stats.last5Games.push('L');
      } else {
        p2Stats.wins++;
        p1Stats.loses++;
        p2Stats.points += 3;
        p2Stats.dartsToEnd.push(stats[player2.id]?.darts || 0);
        p2Stats.last5Games.push('W');
        p1Stats.last5Games.push('L');
      }

      // Track highest checkout (if actualScore reaches 0, lastScore is the checkout)
      [player1.id, player2.id].forEach((id) => {
        let history = stats[id]?.history || [];
        history.forEach((entry) => {
          playerStats[id].totalScore += entry.actualAvg;
          playerStats[id].totalGamesWithScore++;
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

  // Final calculations
  Object.values(playerStats).forEach((player) => {
    player.avgScore = player.totalGamesWithScore
      ? (player.totalScore / player.totalGamesWithScore).toFixed(2)
      : 0;
    player.avgDartsToEnd = player.dartsToEnd.length
      ? (
          player.dartsToEnd.reduce((a, b) => a + b, 0) /
          player.dartsToEnd.length
        ).toFixed(2)
      : null;
    player.winRate = player.games
      ? ((player.wins / player.games) * 100).toFixed(2) + '%'
      : '0%';
    player.last5Games = player.last5Games.slice(-5).join('-'); // Keep only last 5 matches

    delete player.totalScore;
    delete player.totalGamesWithScore;
    delete player.dartsToEnd;
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

//   const players = {}; // Obiekt do przechowywania statystyk graczy
//   const directMatches = {}; // Śledzenie meczów między graczami
//   if (!matches.value || matches.value.length === 0) {
//     const playerList = tournamentPlayers.value.map((p) => ({
//       id: p.player_id,
//       nickname: p.player.nickname,
//       games: 0,
//       wins: 0,
//       loses: 0,
//       points: 0,
//     }));

//     ranking.value = playerList;
//     return;
//   }
//   // 1. Przetwarzanie meczów
//   matches.value.forEach((match) => {
//     const { player1, player2, player1_result, player2_result } = match;
//     if (!player1 || !player2) return;

//     const p1_id = player1.id;
//     const p2_id = player2.id;
//     const p1_nickname = player1.nickname;
//     const p2_nickname = player2.nickname;

//     // Inicjalizacja graczy, jeśli jeszcze nie istnieją
//     if (!players[p1_id]) {
//       players[p1_id] = {
//         id: p1_id,
//         nickname: p1_nickname,
//         games: 0,
//         wins: 0,
//         loses: 0,
//         points: 0,
//       };
//     }
//     if (!players[p2_id]) {
//       players[p2_id] = {
//         id: p2_id,
//         nickname: p2_nickname,
//         games: 0,
//         wins: 0,
//         loses: 0,
//         points: 0,
//       };
//     }

//     // Sprawdzamy, czy mecz się odbył
//     if (player1_result !== null && player2_result !== null) {
//       players[p1_id].games++;
//       players[p2_id].games++;

//       if (player1_result > player2_result) {
//         players[p1_id].wins++;
//         players[p1_id].points++;
//         players[p2_id].loses++;

//         directMatches[`${p1_id}-${p2_id}`] = p1_id; // p1 wygrał z p2
//       } else if (player1_result < player2_result) {
//         players[p2_id].wins++;
//         players[p2_id].points++;
//         players[p1_id].loses++;

//         directMatches[`${p1_id}-${p2_id}`] = p2_id; // p2 wygrał z p1
//       }
//     }
//   });

//   // 2. Tworzenie tablicy rankingowej
//   let rankingArray = Object.values(players);

//   // 3. Sortowanie rankingu według:
//   //    - Punktów malejąco
//   //    - Wyniku bezpośredniego meczu, jeśli punkty są równe
//   rankingArray.sort((a, b) => {
//     if (b.points !== a.points) return b.points - a.points;

//     const matchKey = `${a.id}-${b.id}`;
//     if (directMatches[matchKey]) {
//       return directMatches[matchKey] === a.id ? -1 : 1;
//     }

//     return 0; // Jeśli brak bezpośredniego meczu, pozostaje remis
//   });

//   // 4. Dodanie numeracji rankingu
//   ranking.value = rankingArray.map((player, index) => ({
//     ranking: index + 1,
//     ...player,
//   }));
// };
// const globalRanking = computed(() => {
//   const playerStats = {};

//   tournamentPlayers.value.forEach((tp) => {
//     const playerId = tp.player_id;
//     if (!playerStats[playerId]) {
//       playerStats[playerId] = {
//         id: playerId,
//         nickname: tp.player.nickname,
//         tournaments: 0,
//         first: 0,
//         second: 0,
//         third: 0,
//         wins: 0,
//         loses: 0,
//         matches: 0,
//       };
//     }

//     playerStats[playerId].tournaments++;
//     if (tp.end_ranking === 1) playerStats[playerId].first++;
//     if (tp.end_ranking === 2) playerStats[playerId].second++;
//     if (tp.end_ranking === 3) playerStats[playerId].third++;

//     playerStats[playerId].wins += tp.wins || 0;
//     playerStats[playerId].loses += tp.loses || 0;
//     playerStats[playerId].matches += tp.games || 0;
//   });

//   return Object.values(playerStats).sort((a, b) => {
//     if (b.first !== a.first) return b.first - a.first;
//     if (b.second !== a.second) return b.second - a.second;
//     if (b.third !== a.third) return b.third - a.third;
//     return 0;
//   });
// });
</script>

<template>
  <div class="card">
    <h2>Aktualny ranking z wszystkich turniejow(aktualizowany co mecz)</h2>
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
            >{{ data.nickname }}</NuxtLink
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
      <Column field="last5Games" header="Last 5">
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
      <Column field="avgScore" header="Avg."></Column>
      <Column field="avgDartsToEnd" header="Avg Darts to win"></Column>
    </DataTable>
  </div>
</template>
