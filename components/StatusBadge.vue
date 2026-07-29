<template>
  <span class="status-badge" :class="`status-${status}`">{{ labels[status] }}</span>
</template>

<script setup lang="ts">
import type { ArticleStatus } from '~/types/article';

defineProps<{ status: ArticleStatus }>();
const labels: Record<ArticleStatus, string> = {
  draft: '草稿',
  review: '审核中',
  approved: '已通过',
  rejected: '已退回',
  published: '已发布',
};
</script>
