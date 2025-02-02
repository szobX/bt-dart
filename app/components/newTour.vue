<script lang="ts" setup>
const model = defineModel();
const client = useSupabaseClient<Database>();

const tour = reactive({
  name: '',
  league_id: 'f9ca51f5-56fa-4da1-b437-0be7be763ac1',
  location: 'Test',
  date: '2025-01-30',
  status: 'excepted',
  selected: [],
  format: 'roundrobin',
});
const { data: players } = await useAsyncData('players', async () => {
  const { data } = await client.from('players').select('*');

  return data;
});
onMounted(() => {});
const onAddPlayers = async (tournamentId) => {
  const payloads = tour.selected.map((player) => ({
    tournament_id: tournamentId,
    player_id: player.id,
    points: 0,
    stats: {},
  }));
  await client.from('tournament_players').upsert(payloads);
};
const onSave = async () => {
  const payload = { ...tour };
  delete payload.selected;
  const { data } = await client.from('tournaments').insert(payload).select();
  onAddPlayers(data[0].id);
  model.value = false;
  useRouter().push('/admin/turek/' + data[0].id);
};
</script>

<template>
  <Dialog
    v-model:visible="model"
    modal
    header="Dodaj nowy"
    :style="{ width: '50rem' }"
  >
    <div class="flex items-center gap-4 mb-4">
      <label for="username" class="font-semibold w-24">Name</label>
      <InputText
        id="username"
        v-model="tour.name"
        class="flex-auto"
        autocomplete="off"
      />
    </div>
    <div class="flex items-center gap-4 mb-4">
      <label for="username" class="font-semibold w-24">location</label>
      <InputText
        id="location"
        v-model="tour.location"
        class="flex-auto"
        autocomplete="off"
      />
    </div>
    <div class="flex items-center gap-4 mb-4">
      <label for="username" class="font-semibold w-24">location</label>
      <DatePicker v-model="tour.date" />
    </div>
    <div v-if="players">
      <Listbox
        v-model="tour.selected"
        :options="players"
        multiple
        optionLabel="nickname"
        class="w-full md:w-56"
      />
    </div>

    <div class="flex justify-end gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        @click="model = false"
      />
      <Button type="button" label="Save" @click="onSave" />
    </div>
  </Dialog>
</template>
