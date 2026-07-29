<template>
  <div class="toast-host" aria-live="polite">
    <button
      v-for="message in messages"
      :key="message.id"
      class="toast"
      :class="`toast-${message.tone}`"
      type="button"
      @click="remove(message.id)"
    >
      <span>{{ message.tone === 'success' ? '✓' : message.tone === 'error' ? '!' : 'i' }}</span>
      {{ message.text }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { messages, remove } = useToast();
</script>
