<script setup lang="ts">
import NumberFlow from '@number-flow/vue';

definePageMeta({
  layout: 'normal',
});
const client = useSupabaseClient<Database>();
const route = useRoute();
const isOnMobile = useState<boolean>('isOnMobile');

const subscribeToMatchUpdates = () => {
  return client
    .channel('public:matches')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches' },
      (payload) => {
        console.log('Match updated:', payload.new);
        // Find and update the match in the array
        const index = matches.value.findIndex(
          (match) => match.id === payload.new.id
        );
        if (index !== -1) {
          if (payload.new.status === 'in_progress') {
            matches.value[index].in_game = payload.new.in_game;
            matches.value[index].stats = payload.new.stats;
            matches.value[index].status = payload.new.status;
          } else if (payload.new.status === 'finished') {
            matches.value[index].player1_result = payload.new.player1_result;
            matches.value[index].player2_result = payload.new.player2_result;
            matches.value[index].winner_id = payload.new.winner_id;
            matches.value[index].stats = payload.new.stats;
            matches.value[index].status = payload.new.status;
            // matches.value[index].in_game = payload.new.in_game;
            updateRanking();
          }
        }
      }
    )
    .subscribe();
};

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
    .select('*, player:player_id(id, nickname,image_url)')
    .eq('tournament_id', route.params.id);

  return data;
});
const getMatches = async () => {
  try {
    const { data } = await client
      .from('matches')
      .select(
        '*, player1:player1_id(id, nickname,image_url),player2:player2_id(id,nickname,image_url)'
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
    subscribeToMatchUpdates();
  });
});
onUnmounted(() => {
  client.channel('public:matches').unsubscribe();
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

    <div class="w-full">
      <TournamentRanking v-if="matches" :matches="matches" />

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
          <div
            class="bg-dark text-white w-full max-w-md mx-auto p-4 rounded-lg text-center mt-4"
            :class="{ in_progress: slotProps.item.status === 'in_progress' }"
          >
            <div class="text-gray-400 text-sm uppercase">
              Mecz {{ slotProps.index + 1 }}
            </div>
            <div
              class="flex items-center justify-center space-x-4 mt-2 relative"
            >
              <div
                @click="
                  useRouter().push(`/players/${slotProps.item.player2.id}`)
                "
                class="flex flex-col items-center relative"
              >
                <div
                  class="h-20 w-20 border-[5px] relative rounded-lg bg-white"
                  :class="
                    slotProps.item.winner_id && {
                      '!bg-green':
                        slotProps.item.winner_id == slotProps.item.player1_id,
                      '!bg-red':
                        slotProps.item.player1_id !== slotProps.item.winner_id,
                    }
                  "
                >
                  <img
                    class="absolute left-0 top-0 w-full h-full rounded-lg p-[2px]"
                    :src="slotProps.item.player1.image_url"
                    :alt="slotProps.item.player1.nickname"
                  />
                </div>

                <span class="mt-1">{{ slotProps.item.player1.nickname }}</span>

                <div
                  v-if="
                    slotProps.item.status === 'in_progress' &&
                    slotProps.item.in_game &&
                    Object.values(slotProps.item.in_game).length &&
                    slotProps.item.in_game.current_player === 1
                  "
                >
                  <Dart
                    class="left-1/2 w-10 h-7 absolute -translate-x-1/2 top-[110%] animate-pulse"
                  />
                </div>
              </div>
              <template v-if="slotProps.item.status !== 'in_progress'">
                <div class="text-2xl font-bold">
                  {{ slotProps.item.player1_result || 0 }} -
                  {{ slotProps.item.player2_result || 0 }}
                </div>
              </template>
              <template v-else>
                <div>
                  <div
                    class="text-2xl font-bold min-[120px] flex gap-4 justify-center"
                  >
                    <NumberFlow
                      :value="slotProps.item?.in_game?.player1_score || 301"
                    />

                    <NumberFlow
                      :value="slotProps.item?.in_game?.player2_score || 301"
                    />
                  </div>
                  <div class="flex justify-center gap-4">
                    <div class="text-xs flex flex-col text-gray-400 text-left">
                      <div>
                        darts: {{ slotProps.item?.in_game?.player1_darts }}
                      </div>
                      <div
                        v-if="
                          slotProps.item?.in_game?.player1_history &&
                          slotProps.item?.in_game?.player1_history.length
                        "
                      >
                        last:
                        {{
                          slotProps.item?.in_game?.player1_history.at(-1)
                            .lastScore
                        }}
                      </div>
                      <div
                        v-if="
                          slotProps.item?.in_game?.player1_history &&
                          slotProps.item?.in_game?.player1_history.length
                        "
                      >
                        {{
                          slotProps.item?.in_game?.player1_history
                            .at(-1)
                            .actualAvg.toFixed(2)
                        }}
                      </div>
                    </div>
                    <div class="text-xs flex flex-col text-gray-400 text-right">
                      <div>
                        darts: {{ slotProps.item?.in_game?.player2_darts }}
                      </div>
                      <div
                        v-if="
                          slotProps.item?.in_game?.player2_history &&
                          slotProps.item?.in_game?.player2_history.length
                        "
                      >
                        last :
                        {{
                          slotProps.item?.in_game?.player2_history.at(-1)
                            .lastScore
                        }}
                      </div>
                      <div
                        v-if="
                          slotProps.item?.in_game?.player2_history &&
                          slotProps.item?.in_game?.player2_history.length
                        "
                      >
                        {{
                          slotProps.item?.in_game?.player2_history
                            .at(-1)
                            .actualAvg.toFixed(2)
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div
                @click="
                  useRouter().push(`/players/${slotProps.item.player2.id}`)
                "
                class="flex flex-col items-center relative"
              >
                <div
                  class="h-20 w-20 border-[5px] relative rounded-lg bg-white"
                  :class="
                    slotProps.item.winner_id && {
                      '!bg-green':
                        slotProps.item.winner_id == slotProps.item.player2_id,
                      '!bg-red':
                        slotProps.item.player2_id !== slotProps.item.winner_id,
                    }
                  "
                >
                  <img
                    class="absolute left-0 top-0 w-full h-full rounded-lg p-[2px]"
                    :src="slotProps.item.player2.image_url"
                    :alt="slotProps.item.player2.nickname"
                  />
                </div>
                <span class="mt-1">{{ slotProps.item.player2.nickname }}</span>
                <div
                  v-if="
                    slotProps.item.status === 'in_progress' &&
                    slotProps.item.in_game &&
                    Object.keys(slotProps.item.in_game).length &&
                    slotProps.item?.in_game?.current_player === 2
                  "
                >
                  <Dart
                    class="left-1/2 w-10 h-7 absolute -translate-x-1/2 top-[110%] animate-pulse"
                  />
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-400">H2H</div>
            <div class="text-gray-400 text-sm my-2">
              ({{ slotProps.item.h2h.p1Wins }}- {{ slotProps.item.h2h.p2Wins }})
            </div>
            <div>
              <MatchStats
                v-if="
                  slotProps.item.winner_id &&
                  Object.keys(slotProps.item.stats).length
                "
                :match="slotProps.item"
              />
            </div>
          </div>
        </template>
      </Timeline>
    </div>
  </div>
</template>

<style lang="scss">
.in_progress {
  border: 2px solid #cd7f32;
}
</style>
