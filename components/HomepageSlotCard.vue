<template>
  <article v-if="article" class="homepage-slot-card">
    <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" :style="{ objectPosition: `${article.coverFocalX ?? 50}% ${article.coverFocalY ?? 50}%` }">
    <div><small>{{ article.category.name }}</small><strong>{{ article.title }}</strong></div>
    <div v-if="!readonly" class="slot-actions"><button type="button" title="向前" @click="$emit('move',-1)">←</button><button type="button" title="向后" @click="$emit('move',1)">→</button><button type="button" title="移除" @click="$emit('remove')">×</button></div>
  </article>
</template>
<script setup lang="ts">
import type { ArticleDTO } from '~/types/article';
defineProps<{article?:ArticleDTO;readonly?:boolean}>();
defineEmits<{remove:[];move:[direction:number]}>();
</script>
