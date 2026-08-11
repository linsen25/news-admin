<template>
  <div ref="root" class="app-select" :class="{ open }">
    <button class="app-select-trigger" type="button" :disabled="disabled" :aria-expanded="open" @click="open = !open">
      <span :class="{ placeholder: !selectedOption }">{{ selectedOption?.label || placeholder }}</span><span class="app-select-chevron">⌄</span>
    </button>
    <div v-if="open" class="app-select-menu" role="listbox">
      <button v-if="allowEmpty" type="button" :class="{ selected: modelValue === '' }" @click="choose('')">{{ placeholder }}</button>
      <button v-for="option in options" :key="option.value" type="button" :class="{ selected: option.value === modelValue }" @click="choose(option.value)">{{ option.label }}</button>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue:string; options:Array<{value:string;label:string}>; placeholder?:string; allowEmpty?:boolean; disabled?:boolean }>(), { placeholder:'请选择', allowEmpty:false, disabled:false });
const emit = defineEmits<{ 'update:modelValue':[value:string] }>();
const open = ref(false); const root = ref<HTMLElement|null>(null);
const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue));
const choose = (value:string) => { emit('update:modelValue', value); open.value = false; };
const closeOutside = (event:MouseEvent) => { if (!root.value?.contains(event.target as Node)) open.value = false; };
onMounted(() => document.addEventListener('click', closeOutside));
onBeforeUnmount(() => document.removeEventListener('click', closeOutside));
</script>
