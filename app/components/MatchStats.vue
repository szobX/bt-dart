<script lang="ts" setup>
const props = defineProps<{
  match: any;
}>();
const statsPlayer1 = props.match.stats[props.match.player1_id];
const statsPlayer2 = props.match.stats[props.match.player2_id];
const heigstScorePlayer1 = statsPlayer1.history.reduce(
  (acc, cur) => (cur.lastScore > acc ? cur.lastScore : acc),
  0
);
const heigstScorePlayer2 = statsPlayer2.history.reduce(
  (acc, cur) => (cur.lastScore > acc ? cur.lastScore : acc),
  0
);

const chartData = () => {
  let player1Data = [{ x: 0, y: 301 }];
  let player2Data = [{ x: 0, y: 301 }];
  statsPlayer1.history.forEach((his, idx) => {
    player1Data.push({ x: his.dartsThrown, y: his.actualScore });
  });
  statsPlayer2.history.forEach((his, idx) => {
    player2Data.push({ x: his.dartsThrown, y: his.actualScore });
  });

  return {
    datasets: [
      {
        label: props.match.player1.nickname,
        borderColor: 'blue',
        fill: false,
        data: player1Data,
      },
      {
        label: props.match.player2.nickname,
        borderColor: 'red',
        fill: false,
        data: player2Data,
      },
    ],
  };
};
const chartOptions = {
  responsive: true,
  scales: {
    x: { type: 'linear', title: { display: true, text: 'Liczba rzutów' } },
    y: { title: { display: true, text: 'Pozostałe punkty' }, reverse: true },
  },
};
</script>

<template>
  <div>
    <Accordion class="!p-0" value="0">
      <AccordionPanel class="!p-0" value="1">
        <AccordionHeader><slot name="header">Stats</slot></AccordionHeader>
        <AccordionContent
          class="!p-0"
          style="--p-accordion-content-padding: 16px 0"
        >
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col">
              <div
                class="border-b border-primary pb-2 mb-2 flex justify-between"
              >
                higgest score:
                <div>{{ heigstScorePlayer1 }}</div>
              </div>
              <div class="text- pb-2 mb-2 flex justify-between">
                avg:
                <div>{{ statsPlayer1.avg.toFixed(2) }}</div>
              </div>

              <div
                class="grid grid-cols-1"
                :key="`${idx}-p1`"
                v-for="(his, idx) in statsPlayer1.history"
              >
                <div class="flex items-center justify-between">
                  <div class="flex flex-1 items-center">
                    <div>{{ his.lastScore }}</div>

                    <!-- <div>{{ his.actualScore }}</div> -->
                    <div class="ml-1 text-xs text-gray-400">
                      avg {{ his.actualAvg.toFixed(2) }}
                    </div>
                  </div>
                  <div class="text-xs">
                    {{ his.dartsThrown }}
                    <span class="text-xs text-grey-500">darts</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div class="flex flex-col">
                <div
                  class="border-b border-primary pb-2 mb-2 flex justify-between"
                >
                  higgest score:
                  <div>{{ heigstScorePlayer2 }}</div>
                </div>
                <div class="text- pb-2 mb-2 flex justify-between">
                  avg:
                  <div>{{ statsPlayer2.avg.toFixed(2) }}</div>
                </div>

                <div
                  class="grid grid-cols-1"
                  :key="`${idx}-p2`"
                  v-for="(his, idx) in statsPlayer2.history"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex flex-1 items-center">
                      <div>{{ his.lastScore }}</div>

                      <!-- <div>{{ his.actualScore }}</div> -->
                      <div class="ml-1 text-xs text-gray-400">
                        avg {{ his.actualAvg.toFixed(2) }}
                      </div>
                    </div>
                    <div class="text-xs">
                      {{ his.dartsThrown }}
                      <span class="text-xs text-grey-500">darts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Chart
              type="line"
              :data="chartData()"
              class="h-[30rem]"
              :options="chartOptions"
            />
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>
