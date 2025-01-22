<script setup lang="ts">
const items = ref([
  {
    label: 'Turnieje',
    key: 'turnieje',
    route: '/turnieje',
    icon: 'pi pi-home',
  },
  {
    label: 'Ranking',
    key: 'ranking',
    route: '/ranking',
    icon: 'pi pi-home',
  },
]);
</script>

<template>
  <nav>
    <Menubar :model="items">
      <template #item="{ item }">
        <div class="p-menubar-item-content" data-pc-section="itemcontent">
          <NuxtLink v-ripple class="p-menubar-item-link" :to="item.route">
            <span
              class="p-menubar-icon p-menubar-icon-left"
              :class="item.icon"
              data-pc-section="itemicon"
            /><span
              id="pv_id_307_1_label"
              class="p-menubar-item-label"
              data-pc-section="itemlabel"
              >{{ item.label }}</span
            >
          </NuxtLink>
        </div>
      </template>
      <template #end>
        <div class="flex">
          <AppColorMode class="ml-6 mr-2" />
          <NuxtLink to="/login" class="mr-2">
            <Button icon="pi pi-sign-in" severity="info" />
          </NuxtLink>
        </div>
      </template>
    </Menubar>
  </nav>
</template>
