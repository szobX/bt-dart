<script setup lang="ts">
definePageMeta({
  layout: 'normal',
});
const client = useSupabaseClient<Database>();
const router = useRouter();

const { data: playersData } = await useAsyncData('players', async () => {
  const { data } = await client.from('players').select('*');
  return data;
});
const players = ref(playersData.value);

const viewPlayerProfile = (playerId) => {
  router.push(`/players/${playerId}`);
};
</script>

<template>
  <div class="card">
    <h2>Players</h2>
    <div class="flex flex-wrap gap-4 w-full">
      <Card
        v-for="player in players"
        :key="player.id"
        class="player-card w-full md:max-w-[200px]"
        @click="viewPlayerProfile(player.id)"
      >
        <template #header>
          <img
            src="https://cdn1.iconfinder.com/data/icons/sport-avatar-6/64/09-darts-dart-sport-avatar-man-512.png"
            alt="Player Avatar"
            class="w-1/2 max-w-[100px] h-auto aspect-square rounded-full object-cover mt-2"
          />
        </template>
        <template #content>
          <h3>{{ player.nickname }}</h3>
        </template>
      </Card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-avatar {
  width: 100%;
  height: auto;
  border-radius: 50%;
}
</style>
