<script setup lang="ts">
const collapsed = useState<boolean>('collapsed');
const isOnMobile = useState<boolean>('isOnMobile');
</script>

<template>
  <div class="">
    <!-- <ConfirmDialog /> -->
    <Toast />
    <div id="auth" :class="[{ collapsed }, { mobile: isOnMobile }]">
      <div>
        <slot />
      </div>
    </div>
  </div>
</template>
