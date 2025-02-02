<script setup lang="ts">
definePageMeta({
  layout: 'normal',
});
const client = useSupabaseClient<Database>();
const route = useRoute();

const playerId = ref(route.params.id);
const { data: playerData } = await useAsyncData('player', async () => {
  const { data } = await client
    .from('players')
    .select('*')
    .eq('id', playerId.value);

  return data;
});
const player = computed(() => playerData.value[0]);

const { data: matches } = await useAsyncData('playerMatches', async () => {
  const { data } = await client
    .from('matches')
    .select(
      '*, player1:player1_id(id, nickname),player2:player2_id(id,nickname),tournament:tournament_id(id,name)'
    )
    .or(`player1_id.eq.${playerId.value},player2_id.eq.${playerId.value}`)
    .order('created_at', { ascending: false });
  console.log(data);
  return data?.filter((e) => e.winner_id !== null);
});
const back = () => {
  useRouter().back();
};
</script>

<template>
  <div class="card flex flex-col gap-5">
    <div @click="back" class="flex items-center gap-2 cursor-pointer">
      <Chip label="Back" />
    </div>

    <h2>{{ player.nickname }}</h2>
    <div v-if="player">
      <img
        class="w-[100px] h-auto aspect-square rounded-full object-cover mt-2"
        src="https://cdn1.iconfinder.com/data/icons/sport-avatar-6/64/09-darts-dart-sport-avatar-man-512.png"
      />
      <PlayerStats :player-id="playerId" :all-matches="matches" />
    </div>
    <div>
      <h3>Matches</h3>
      <div class="flex flex-col gap-5">
        <div
          class="w-full"
          v-for="match in matches"
          :key="match.id"
          :match="match"
        >
          <MatchStats v-if="Object.keys(match.stats).length" :match="match">
            <template #header>
              <div class="flex flex-col-reverse">
                <div
                  class="grid grid-cols-2 gap-4 !border !border-red-500 relative"
                >
                  <div>
                    <InputGroup class="relative">
                      <InputGroupAddon
                        @click="
                          useRouter().push(`/players/${match.player2.id}`)
                        "
                        class="w-3/4 cursor-pointer"
                        :class="{
                          '!bg-primary !text-white':
                            match.player1_id === match.winner_id,
                        }"
                        >{{ match.player1.nickname }}</InputGroupAddon
                      >
                      <InputNumber
                        class="min-w-[40px]"
                        placeholder="0"
                        disabled
                        v-model="match.player1_result"
                      />
                    </InputGroup>
                  </div>
                  <div>
                    <InputGroup class="relative">
                      <InputNumber
                        class="min-w-[40px]"
                        placeholder="0"
                        disabled
                        v-model="match.player2_result"
                      />
                      <InputGroupAddon
                        @click="
                          useRouter().push(`/players/${match.player2.id}`)
                        "
                        class="w-3/4 cursor-pointer"
                        :class="{
                          '!bg-primary !text-white':
                            match.player2_id === match.winner_id,
                        }"
                        >{{ match.player2.nickname }}</InputGroupAddon
                      >
                    </InputGroup>
                  </div>
                </div>
                <div class="text-xs" v-if="match.tournament">
                  {{ match.tournament.name }}
                </div>
              </div>
            </template>
          </MatchStats>
          <div v-else>
            <div class="p-accordioncontent">
              <div
                class="grid grid-cols-2 gap-4 !border !border-red-500 relative"
              >
                <div>
                  <InputGroup class="relative">
                    <InputGroupAddon
                      @click="useRouter().push(`/players/${match.player2.id}`)"
                      class="w-3/4 cursor-pointer"
                      :class="{
                        '!bg-primary !text-white':
                          match.player1_id === match.winner_id,
                      }"
                      >{{ match.player1.nickname }}</InputGroupAddon
                    >
                    <InputNumber
                      class="min-w-[40px]"
                      placeholder="0"
                      disabled
                      v-model="match.player1_result"
                    />
                  </InputGroup>
                </div>
                <div>
                  <InputGroup class="relative">
                    <InputNumber
                      class="min-w-[40px]"
                      placeholder="0"
                      disabled
                      v-model="match.player2_result"
                    />
                    <InputGroupAddon
                      @click="useRouter().push(`/players/${match.player2.id}`)"
                      class="w-3/4 cursor-pointer"
                      :class="{
                        '!bg-primary !text-white':
                          match.player2_id === match.winner_id,
                      }"
                      >{{ match.player2.nickname }}</InputGroupAddon
                    >
                  </InputGroup>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <div v-if="playerTournaments">
      <h3>Tournaments</h3>
      <DataTable :value="playerTournaments">
        <Column field="tournament.name" header="Tournament Name"></Column>
        <Column field="tournament.status" header="Status"></Column>
        <Column field="end_ranking" header="Ranking">
          <template #body="slotProps">
            <span
              :class="{
                'gold-medal': slotProps.data.end_ranking === 1,
                'silver-medal': slotProps.data.end_ranking === 2,
                'bronze-medal': slotProps.data.end_ranking === 3,
              }"
            >
              {{ slotProps.data.end_ranking }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
.gold-medal {
  border: 2px solid gold;
  padding: 2px 5px;
  border-radius: 5px;
  background-color: #ffd700;
}
.silver-medal {
  border: 2px solid silver;
  padding: 2px 5px;
  border-radius: 5px;
  background-color: #c0c0c0;
}
.bronze-medal {
  border: 2px solid #cd7f32;
  padding: 2px 5px;
  border-radius: 5px;
  background-color: #cd7f32;
}
</style>
