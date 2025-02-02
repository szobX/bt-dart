<script setup lang="ts">
definePageMeta({
  layout: 'normal',
});
const client = useSupabaseClient<Database>();

const players = ref([]);
const tournamentPlayers = ref([]);

onMounted(async () => {
  const { data: playersData } = await client.from('players').select('*');
  players.value = playersData;

  const { data: tournamentPlayersData } = await client
    .from('tournament_players')
    .select(
      '*, tournament:tournament_id(id, name, status),player:player_id(id, nickname)'
    )
    .order('end_ranking');
  tournamentPlayers.value = tournamentPlayersData;
});

const globalRanking = computed(() => {
  const playerStats = {};

  tournamentPlayers.value.forEach((tp) => {
    const playerId = tp.player_id;
    if (!playerStats[playerId]) {
      playerStats[playerId] = {
        id: playerId,
        nickname: tp.player.nickname,
        tournaments: 0,
        first: 0,
        second: 0,
        third: 0,
        wins: 0,
        loses: 0,
        matches: 0,
      };
    }

    playerStats[playerId].tournaments++;
    if (tp.end_ranking === 1) playerStats[playerId].first++;
    if (tp.end_ranking === 2) playerStats[playerId].second++;
    if (tp.end_ranking === 3) playerStats[playerId].third++;

    playerStats[playerId].wins += tp.wins || 0;
    playerStats[playerId].loses += tp.loses || 0;
    playerStats[playerId].matches += tp.games || 0;
  });

  return Object.values(playerStats).sort((a, b) => {
    if (b.first !== a.first) return b.first - a.first;
    if (b.second !== a.second) return b.second - a.second;
    if (b.third !== a.third) return b.third - a.third;
    return 0;
  });
});
</script>

<template>
  <div class="card">
    <h2>Global Ranking</h2>
    <DataTable :value="globalRanking">
      <Column field="nickname" header="Nickname">
        <template #body="{ data }">
          <NuxtLink
            class="text-underline text-white"
            :to="`/players/${data.id}`"
          >
            {{ data.nickname }}
          </NuxtLink>
        </template>
      </Column>
      <Column field="tournaments" header="Tournaments"></Column>
      <Column field="first" header="1st Place"></Column>
      <Column field="second" header="2nd Place"></Column>
      <Column field="third" header="3rd Place"></Column>
      <Column field="wins" header="Wins"></Column>
      <Column field="loses" header="Loses"></Column>
      <Column field="matches" header="Matches"></Column>
    </DataTable>
  </div>
</template>
