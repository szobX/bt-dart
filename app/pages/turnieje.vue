<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api';
definePageMeta({
  layout: 'normal',
});
const { tableData, filters, dataTableRef } = usePrimeDataTable();
const client = useSupabaseClient<Database>();

const { data: tournaments } = await useAsyncData(`tournaments`, async () => {
  const { data } = await client
    .from('tournaments')
    .select('*, league:league_id(id, name)');

  const statusOrder = { inprogress: 1, expected: 2, finished: 3 };
  return data.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
});
filters.value = {
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  code: { value: null, matchMode: FilterMatchMode.CONTAINS },
  inventoryStatus: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
};
const showNewModal = ref(false);
const showEditModal = ref(false);
onMounted(async () => {
  tableData.value = tournaments;
});

const pushTo = (data) => {
  useRouter().push('/turniej/' + data.id);
};
</script>

<template>
  <div class="card">
    <h2>Lista turniejów</h2>
    <DataTable
      ref="dataTableRef"
      v-model:filters="filters"
      :value="tournaments"
      data-key="name"
      :paginator="false"
      :rows="20"
      paginator-template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      current-page-report-template="Showing {first} to {last} of {totalRecords}"
      @row-click="pushTo($event.data)"
    >
      <template #empty> No Data Found. </template>
      <Column field="name" header="Name" :sortable="true" />
      <Column field="date" header="Data" :sortable="true" />
      <Column field="league.name" header="Liga" :sortable="true" />
      <Column field="status" header="Status" :sortable="true" />
      <Column class="w-24 !text-end">
        <template #body="{ data }">
          <Button
            icon="pi pi-search"
            @click="pushTo(data)"
            severity="secondary"
            rounded
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
