<template>
  <div ref="root" class="date-picker" :class="{ open }">
    <button class="date-picker-trigger" type="button" :aria-expanded="open" @click="open = !open">
      <span>{{ displayValue }}</span><span aria-hidden="true">▣</span>
    </button>
    <div v-if="open" class="date-picker-panel">
      <div class="date-picker-heading">
        <button type="button" aria-label="上个月" @click="changeMonth(-1)">←</button>
        <strong>{{ viewYear }} 年 {{ viewMonth + 1 }} 月</strong>
        <button type="button" aria-label="下个月" @click="changeMonth(1)">→</button>
      </div>
      <div class="date-picker-weekdays"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
      <div class="date-picker-days">
        <span v-for="blank in leadingBlankCount" :key="`blank-${blank}`" />
        <button v-for="day in daysInMonth" :key="day" type="button" :class="{ selected: isSelected(day), today: isToday(day) }" @click="choose(day)">{{ day }}</button>
      </div>
      <button class="date-picker-today" type="button" @click="chooseToday">选择今天</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const initial = props.modelValue ? new Date(`${props.modelValue}T00:00:00`) : new Date();
const viewYear = ref(initial.getFullYear());
const viewMonth = ref(initial.getMonth());
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const pad = (value: number) => String(value).padStart(2, '0');
const toValue = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const displayValue = computed(() => props.modelValue ? props.modelValue.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日') : '请选择日期');
const leadingBlankCount = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay());
const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate());
const isSelected = (day: number) => props.modelValue === toValue(viewYear.value, viewMonth.value, day);
const isToday = (day: number) => {
  const today = new Date();
  return today.getFullYear() === viewYear.value && today.getMonth() === viewMonth.value && today.getDate() === day;
};
const choose = (day: number) => { emit('update:modelValue', toValue(viewYear.value, viewMonth.value, day)); open.value = false; };
const chooseToday = () => { const today = new Date(); viewYear.value = today.getFullYear(); viewMonth.value = today.getMonth(); choose(today.getDate()); };
const changeMonth = (offset: number) => { const next = new Date(viewYear.value, viewMonth.value + offset, 1); viewYear.value = next.getFullYear(); viewMonth.value = next.getMonth(); };
const closeOutside = (event: MouseEvent) => { if (!root.value?.contains(event.target as Node)) open.value = false; };
watch(() => props.modelValue, (value) => { if (!value) return; const next = new Date(`${value}T00:00:00`); viewYear.value = next.getFullYear(); viewMonth.value = next.getMonth(); });
onMounted(() => document.addEventListener('click', closeOutside));
onBeforeUnmount(() => document.removeEventListener('click', closeOutside));
</script>
