<script setup lang="ts">
const user = useSupabaseUser();
</script>

<template>
  <nav>
    <Toolbar>
      <template #start>
        <div>Siema {{ user?.email }}</div>
      </template>
      <template #end>
        <AppColorMode class="ml-6 mr-2" />
        <Button icon="pi pi-sign-out" severity="danger" />
      </template>
    </Toolbar>
  </nav>
</template>

<style scoped lang="scss"></style>
