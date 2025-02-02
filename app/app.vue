<script setup lang="ts">
useHead({
  title: 'Liga Darta elo',
  meta: [
    {
      name: 'robots',
      content: 'noindex',
    },
  ],
});

const collapsed = useState<boolean>('collapsed');
const isOnMobile = useState<boolean>('isOnMobile');

function onResize() {
  if (window.innerWidth <= 768) {
    collapsed.value = true;
    isOnMobile.value = true;
  } else {
    collapsed.value = false;
    isOnMobile.value = false;
  }
}

onMounted(() => {
  onResize();
  window.addEventListener('resize', onResize);
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style lang="scss">
@use 'App.scss';
</style>
