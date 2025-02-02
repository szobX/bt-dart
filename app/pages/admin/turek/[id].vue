<script setup lang="ts">
const client = useSupabaseClient<Database>();
const route = useRoute();
definePageMeta({
  middleware: 'auth',
});
const { showSuccessMessage, showErrorMessage } = useMessages();
const matches = ref([]);
const tournamentId = ref(route.params.id);
const { data: tournaments } = await useAsyncData('tournament', async () => {
  const { data } = await client
    .from('tournaments')
    .select('*')
    .eq('id', route.params.id);

  return data;
});
const tournament = computed(() => tournaments.value[0]);

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
    matches.value = data;
  } catch (e) {}
};
onMounted(async () => {
  await getMatches();
  // Initial ranking computation
  await updateRanking();
});
const generate = async () => {
  let playerIds = tournamentPlayers.value
    .map((p) => p.player_id)
    .sort((a, b) => 0.5 - Math.random());
  const numPlayers = playerIds.length;

  //   🛑 2️⃣ Usuwamy poprzednie mecze dla turnieju
  const { error: deleteError } = await client
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId.value);

  if (deleteError) {
    console.error('Błąd usuwania poprzednich meczów:', deleteError);
    return false;
  }

  console.log('✅ Poprzednie mecze usunięte!');

  // 3️⃣ Jeśli liczba graczy jest nieparzysta, dodajemy "bye" (wolny los)
  let bye = null;
  if (numPlayers % 2 !== 0) {
    bye = 'BYE';
    playerIds.push(bye);
  }

  const rounds = playerIds.length - 1; // Liczba kolejek
  const halfSize = playerIds.length / 2; // Połowa zawodników
  const matchesExpected = [];

  // 4️⃣ Tworzymy rundy (Round Robin)
  const roundPlayers = [...playerIds]; // Kopia listy graczy

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < halfSize; i++) {
      const player1 = roundPlayers[i];
      const player2 = roundPlayers[roundPlayers.length - 1 - i];
      // Pomijamy mecze z "bye"
      if (player1 !== bye && player2 !== bye) {
        matchesExpected.push({
          tournament_id: tournamentId.value,
          round: round + 1, // Numer kolejki
          player1_id: player1,
          player2_id: player2,
          winner_id: null,
          stats: {},
          order: matchesExpected.length + 1, // Correctly set the order
        });
      }
    }

    // Rotacja graczy (bez pierwszego)
    roundPlayers.splice(1, 0, roundPlayers.pop()!);
  }
  // 5️⃣ Zapisujemy mecze w bazie
  const { error: insertError, data } = await client
    .from('matches')
    .insert(matchesExpected)
    .select();
  if (insertError) {
    console.error('Błąd generowania meczów:', insertError);
    return false;
  }
  matches.value = data;
  const { data: tour } = await client
    .from('tournaments')
    .update({ status: 'inprogress' })
    .eq('id', tournamentId.value)
    .select();
  await getMatches();
  tournaments.value = tour;

  showSuccessMessage(' ✅ Mecze Round Robin wygenerowane!');
};
const endTournament = async () => {
  await client
    .from('tournaments')
    .update({ status: 'finished' })
    .eq('id', tournamentId.value);

  for (const [index, player] of ranking.value.entries()) {
    console.log(player, index);
    const { error: updateError } = await client
      .from('tournament_players')
      .update({ end_ranking: index + 1 })
      .match({ tournament_id: tournamentId.value, player_id: player.id });
    if (updateError) {
      console.error('Błąd aktualizacji rankingu:', updateError);
      return false;
    }
  }

  showSuccessMessage('✅ Turniej zakończony! Rankingi zaktualizowane');
};
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

const updateMatch = async (match, idx) => {
  const newMatches = matches.value;
  if (!match.player1_result) {
    match.player1_result = 0;
  }
  if (!match.player2_result) {
    match.player2_result = 0;
  }

  const { player1_result, player2_result } = match;
  const winner_id =
    player1_result > player2_result ? match.player1_id : match.player2_id;
  match.winner_id = winner_id;
  console.log(newMatches[idx]);
  match.winner_id = winner_id;
  newMatches[idx].winner_id = winner_id;

  const { error: insertError } = await client.from('matches').upsert({
    id: match.id,
    player1_result,
    player2_result,
    winner_id,
  });
  if (insertError) {
    console.error('Błąd aktualizacji meczu:', insertError);
    return false;
  }
  matches.value = [...newMatches];
  console.log('✅ Mecz zaktualizowany!');
  showSuccessMessage('✅ Mecz zaktualizowany!');
  updateRanking();
};
</script>

<template>
  <div class="card flex flex-col flex-wrap gap-10">
    <h2>{{ tournament.name }}</h2>
    <div v-if="tournament" class="w-full flex gap-5">
      <Button label="Generate Or Regenerate" @click="generate" />
      <Button label="End Tournament" severity="warn" @click="endTournament" />
      <Tag severity="info">{{ tournament.status }}</Tag>
    </div>
    <div class="flex flex-col gap-2 flex-wrap">
      <h3>Players</h3>
      <div v-if="ranking" class="flex gap-2 flex-wrap">
        <DataTable :value="ranking">
          <Column header="id">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>
          <Column field="nickname" header="nickname"></Column>
          <Column field="games" header="games"></Column>
          <Column field="wins" header="wins"></Column>
          <Column field="loses" header="loses"></Column>
          <Column field="points" header="points"></Column>
        </DataTable>
      </div>
    </div>
    <div v-if="tournament.status === 'inprogress'">
      <h3>Matches</h3>

      <Timeline
        v-if="matches.length"
        :value="matches"
        align="alternate"
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
          <Card class="mt-4 border !border-green-500">
            <template #title> Match {{ slotProps.index + 1 }} </template>
            <template #subtitle>
              {{ slotProps.item.date }}
            </template>
            <template #content>
              <div class="flex gap-4 !border !border-red-500">
                <InputGroup>
                  <InputGroupAddon
                    class="w-3/4"
                    :class="{
                      '!bg-primary':
                        slotProps.item.player1_id === slotProps.item.winner_id,
                    }"
                    >{{ slotProps.item.player1?.nickname }}</InputGroupAddon
                  >
                  <InputNumber
                    placeholder="0"
                    v-model="slotProps.item.player1_result"
                  />
                </InputGroup>
                <InputGroup>
                  <InputNumber
                    placeholder="0"
                    v-model="slotProps.item.player2_result"
                  />
                  <InputGroupAddon
                    class="w-3/4"
                    :class="{
                      '!bg-primary':
                        slotProps.item.player2_id === slotProps.item.winner_id,
                    }"
                    >{{ slotProps.item.player2?.nickname }}</InputGroupAddon
                  >
                </InputGroup>
              </div>
              <Button
                @click="updateMatch(slotProps.item, slotProps.index)"
                label="Save"
                severity="info"
                class="mt-5"
              />
            </template>
          </Card>
        </template>
      </Timeline>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
