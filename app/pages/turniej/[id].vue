<script setup lang="ts">
definePageMeta({
  layout: 'normal',
});
const client = useSupabaseClient<Database>();
const route = useRoute();
const isOnMobile = useState<boolean>('isOnMobile');

const matches = ref([]);
const allmatches = ref([]);
const tournamentId = ref(route.params.id);
const { data: tournaments } = await useAsyncData('tournament', async () => {
  const { data } = await client
    .from('tournaments')
    .select('*')
    .eq('id', route.params.id);

  return data;
});
const tournament = computed(() => tournaments.value[0]);
const getH2hStats = async () => {
  const { data: tournaments, error: tournamentsError } = await client
    .from('tournaments')
    .select('id')
    .eq('league_id', tournament.value.league_id);
  const tournamentIds = tournaments.map((t) => t.id);

  const { data: h2h, error } = await client
    .from('matches')
    .select('id, player1_id, player2_id, winner_id, tournament_id')
    .in('tournament_id', tournamentIds);
  if (h2h) {
    allmatches.value = h2h;
  }
};
const { data: tournamentPlayers } = await useAsyncData('players', async () => {
  const { data } = await client
    .from('tournament_players')
    .select('*, player:player_id(id, nickname)')
    .eq('tournament_id', route.params.id);

  return data;
});
const getMatches = async () => {
  try {
    const { data } = await client
      .from('matches')
      .select(
        '*, player1:player1_id(id, nickname),player2:player2_id(id,nickname)'
      )
      .eq('tournament_id', route.params.id)
      .order('order');
    const h2hStats = h2hmap();
    matches.value = data.map((match) => {
      const players = [match.player1_id, match.player2_id].sort((a, b) =>
        a.localeCompare(b)
      );
      const key = `${players[0]}-${players[1]}`;
      const h2h = h2hStats[key] || { total: 0, p1Wins: 0, p2Wins: 0 };

      // 🛠️ Odwracamy wyniki jeśli `match.player1_id` to nie pierwszy gracz w kluczu
      return {
        ...match,
        h2h:
          match.player1_id === players[0]
            ? h2h
            : { ...h2h, p1Wins: h2h.p2Wins, p2Wins: h2h.p1Wins },
      };
    });
  } catch (e) {}
};
const h2hmap = () => {
  const h2hStats: Record<
    string,
    { total: number; p1Wins: number; p2Wins: number }
  > = {};
  allmatches.value.forEach((match) => {
    const players = [match.player1_id, match.player2_id].sort((a, b) =>
      a.localeCompare(b)
    );

    const key = `${players[0]}-${players[1]}`;

    if (!h2hStats[key]) {
      h2hStats[key] = { key, total: 0, p1Wins: 0, p2Wins: 0 };
    }

    h2hStats[key].total += 1;

    if (match.winner_id === match.player1_id) {
      h2hStats[key].p1Wins += match.player1_id === players[0] ? 1 : 0;
      h2hStats[key].p2Wins += match.player2_id === players[0] ? 1 : 0;
    } else if (match.winner_id === match.player2_id) {
      h2hStats[key].p1Wins += match.player2_id === players[0] ? 1 : 0;
      h2hStats[key].p2Wins += match.player1_id === players[0] ? 1 : 0;
    }
  });
  return h2hStats;
};
onMounted(async () => {
  nextTick(async () => {
    await getH2hStats();
    await getMatches();
    // Initial ranking computation
    await updateRanking();
  });
});

const ranking = ref([]); // Change computed to ref

const updateRanking = () => {
  const players = {}; // Obiekt do przechowywania statystyk graczy
  const directMatches = {}; // Śledzenie meczów między graczami
  if (!matches.value || matches.value.length === 0) {
    const playerList = tournamentPlayers.value.map((p) => ({
      id: p.player_id,
      nickname: p.player.nickname,
      games: 0,
      wins: 0,
      loses: 0,
      points: 0,
    }));

    ranking.value = playerList;
    return;
  }
  // 1. Przetwarzanie meczów
  matches.value.forEach((match) => {
    const { player1, player2, player1_result, player2_result } = match;
    if (!player1 || !player2) return;

    const p1_id = player1.id;
    const p2_id = player2.id;
    const p1_nickname = player1.nickname;
    const p2_nickname = player2.nickname;

    // Inicjalizacja graczy, jeśli jeszcze nie istnieją
    if (!players[p1_id]) {
      players[p1_id] = {
        id: p1_id,
        nickname: p1_nickname,
        games: 0,
        wins: 0,
        loses: 0,
        points: 0,
      };
    }
    if (!players[p2_id]) {
      players[p2_id] = {
        id: p2_id,
        nickname: p2_nickname,
        games: 0,
        wins: 0,
        loses: 0,
        points: 0,
      };
    }

    // Sprawdzamy, czy mecz się odbył
    if (player1_result !== null && player2_result !== null) {
      players[p1_id].games++;
      players[p2_id].games++;

      if (player1_result > player2_result) {
        players[p1_id].wins++;
        players[p1_id].points++;
        players[p2_id].loses++;

        directMatches[`${p1_id}-${p2_id}`] = p1_id; // p1 wygrał z p2
      } else if (player1_result < player2_result) {
        players[p2_id].wins++;
        players[p2_id].points++;
        players[p1_id].loses++;

        directMatches[`${p1_id}-${p2_id}`] = p2_id; // p2 wygrał z p1
      }
    }
  });

  // 2. Tworzenie tablicy rankingowej
  let rankingArray = Object.values(players);

  // 3. Sortowanie rankingu według:
  //    - Punktów malejąco
  //    - Wyniku bezpośredniego meczu, jeśli punkty są równe
  rankingArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    const matchKey = `${a.id}-${b.id}`;
    if (directMatches[matchKey]) {
      return directMatches[matchKey] === a.id ? -1 : 1;
    }

    return 0; // Jeśli brak bezpośredniego meczu, pozostaje remis
  });

  // 4. Dodanie numeracji rankingu
  ranking.value = rankingArray.map((player, index) => ({
    ranking: index + 1,
    ...player,
  }));
};
</script>

<template>
  <div class="flex flex-col align-self flex-wrap gap-10">
    <div class="flex gap-2 items-center">
      <h2>{{ tournament.name }}</h2>
      <Tag severity="info">Status: {{ tournament.status }}</Tag>
    </div>

    <div class="flex flex-col gap-2 flex-wrap">
      <h3>Aktualna Tabela</h3>
      <div v-if="ranking">
        <DataTable
          scrollable
          :value="ranking"
          header="Flex Scroll"
          :style="{ width: '90vw', maxWidth: '800px' }"
          maximizable
          modal
          :contentStyle="{ height: '300px' }"
        >
          <Column header="id">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>
          <Column field="nickname" header="nickname"></Column>
          <Column field="points" header="points"></Column>
          <Column field="games" header="games"></Column>
          <Column field="wins" header="wins"></Column>
          <Column field="loses" header="loses"></Column>
        </DataTable>
      </div>
    </div>
    <div class="w-full">
      <h3>Mecze</h3>

      <Timeline
        :value="matches"
        :align="isOnMobile ? 'bottom' : 'alternate'"
        class="customized-timeline"
      >
        <template #marker="slotProps">
          <span
            class="flex w-8 h-8 bg-primary items-center justify-center text-white rounded-full z-10 shadow-sm"
          >
            {{ slotProps.item.round }}
          </span>
        </template>
        <template #connector="slotProps">
          <div
            class="p-timeline-event-connector"
            :class="{
              '!bg-primary': slotProps.item.winner_id,
            }"
          ></div>
        </template>
        <template #content="slotProps">
          <Card class="mt-4 border !border-green-500 !px-0">
            <template #title>
              <h5 class="my-0 text-base">Match {{ slotProps.index + 1 }}</h5>
            </template>

            <template #content>
              <div
                class="grid grid-cols-2 gap-4 !border !border-red-500 pb-5 relative"
              >
                <div>
                  <InputGroup class="relative">
                    <InputGroupAddon
                      @click="
                        useRouter().push(
                          `/players/${slotProps.item.player2.id}`
                        )
                      "
                      class="w-3/4 cursor-pointer"
                      :class="{
                        '!bg-primary !text-white':
                          slotProps.item.player1_id ===
                          slotProps.item.winner_id,
                      }"
                      >{{ slotProps.item.player1.nickname }}</InputGroupAddon
                    >
                    <InputNumber
                      class="min-w-[40px]"
                      placeholder="0"
                      disabled
                      v-model="slotProps.item.player1_result"
                    />
                  </InputGroup>
                  <div class="flex justify-center mt-1">
                    ({{ slotProps.item.h2h.p1Wins }})
                  </div>
                </div>
                <div>
                  <InputGroup class="relative">
                    <InputNumber
                      class="min-w-[40px]"
                      placeholder="0"
                      disabled
                      v-model="slotProps.item.player2_result"
                    />
                    <InputGroupAddon
                      @click="
                        useRouter().push(
                          `/players/${slotProps.item.player2.id}`
                        )
                      "
                      class="w-3/4 cursor-pointer"
                      :class="{
                        '!bg-primary !text-white':
                          slotProps.item.player2_id ===
                          slotProps.item.winner_id,
                      }"
                      >{{ slotProps.item.player2.nickname }}</InputGroupAddon
                    >
                  </InputGroup>
                  <div class="flex justify-center mt-1">
                    ({{ slotProps.item.h2h.p2Wins }})
                  </div>
                </div>
              </div>
              <div>
                <matchStats
                  v-if="
                    slotProps.item.winner_id &&
                    Object.keys(slotProps.item.stats).length
                  "
                  :match="slotProps.item"
                />
              </div>
            </template>
          </Card>
        </template>
      </Timeline>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
