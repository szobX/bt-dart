<script setup lang="ts">
// definePageMeta({
//   middleware: 'auth',
// });
const { addElement, addList, addListGroup } = useFormKitSchema();
const { addListGroupFunctions, addGroupButtons, addInsertButton } =
  useFormKitRepeater();
const { t } = useI18n();
const client = useSupabaseClient<Database>();
const { showSuccessMessage } = useMessages();

const { data: players } = await useAsyncData('players', async () => {
  const { data } = await client.from('players').select('*');

  return data;
});
const data = ref();
onMounted(() => {
  const defaultData = {
    email: 'tom@mydomain.com',
    players: players.value.map((player) => ({
      nickname: player.nickname,
      description: player.description,
      id: player.id,
    })),
  };
  addListGroupFunctions(defaultData, { nickname: '', description: '' });
  data.value = defaultData;
});

const schema = reactive([
  addElement('h5', ['Lista']),
  addList('players', [
    addInsertButton(),
    addListGroup([
      {
        $formkit: 'primeInputText',
        label: 'Nick',
        name: 'nickname',
        outerClass: 'col-3',
      },
      {
        $formkit: 'primeInputText',
        label: 'Description',
        name: 'description',
        outerClass: 'col-3',
      },
      addGroupButtons('', 'col-6'),
    ]),
  ]),
]);

async function submitHandler() {
  // Lets pretend this is an ajax request:

  await client.from('players').upsert(data.value.players);
  showSuccessMessage('Dane zapisane!');
  // await new Promise((resolve) => setTimeout(resolve, 1000));
}
</script>

<template>
  <div class="card flex flex-wrap gap-10">
    <div class="w-full">
      <h2>Players</h2>

      <div v-if="data" class="min-w-25rem">
        <FormKitDataEdit
          :schema="schema"
          :data="data"
          :debug-schema="false"
          :debug-data="false"
          :submit-label="t('save')"
          @data-saved="submitHandler"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
