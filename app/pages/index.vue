<script lang="ts" setup>
definePageMeta({
  layout: 'normal',
});
const routings = ref([
  {
    name: 'Turnieje',
    key: 'turnieje',
    path: '/turnieje',
  },
  {
    name: 'Ranking',
    key: 'ranking',
    path: '/ranking',
  },
  {
    name: 'Players',
    key: 'players',
    path: '/players',
  },
]);
const goTo = (path) => {
  useRouter().push(path.path);
};
</script>
<template>
  <div
    class="grid grid-cols-1 md:grid-cols-3 items-center justify-center mt-10 gap-5 flex-wrap"
  >
    <Card
      class="w-full lg:aspect-square flex justify-center items-center border-2 border-green"
      :key="route.key"
      v-for="route in routings"
      @click="goTo(route)"
    >
      <template #content>
        <div class="text-center text-3xl">
          {{ route.name }}
        </div>
      </template>
    </Card>
  </div>
</template>
