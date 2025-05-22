<script setup lang="ts">
const collapsed = useState<boolean>('collapsed');
const isOnMobile = useState<boolean>('isOnMobile');
</script>

<template>
  <div class="">
    <!-- <ConfirmDialog /> -->
    <Toast />
    <div id="normal" :class="[{ collapsed }, { mobile: isOnMobile }]">
      <AppUserTopbar />
      <div class="h-screen max-w-[1080px] mx-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
