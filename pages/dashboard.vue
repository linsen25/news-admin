<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">OVERVIEW</p><h1>工作台概览</h1></div>
      <NuxtLink v-if="hasPermission('articles.create')" class="button primary" to="/articles/create">＋ 创建文章</NuxtLink>
    </div>
    <section class="stats-grid">
      <NuxtLink to="/articles"><span>全部文章</span><strong>{{ articles.length }}</strong></NuxtLink>
      <NuxtLink to="/articles?status=draft"><span>草稿箱</span><strong>{{ count('draft') }}</strong></NuxtLink>
      <NuxtLink to="/articles?status=review"><span>审核中</span><strong>{{ count('review') }}</strong></NuxtLink>
      <NuxtLink to="/articles?status=published"><span>已发布</span><strong>{{ count('published') }}</strong></NuxtLink>
    </section>
    <section class="panel">
      <div class="section-title"><h2>最近更新</h2><NuxtLink to="/articles">查看全部</NuxtLink></div>
      <div v-for="article in articles.slice(0, 4)" :key="article.id" class="activity-row">
        <div><strong>{{ article.title }}</strong><small>{{ new Date(article.updatedAt).toLocaleString('zh-CN') }}</small></div>
        <StatusBadge :status="article.status" />
      </div>
      <p v-if="!articles.length" class="empty-state">还没有文章，点击右上角开始创建。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ArticleStatus } from '~/types/article';
definePageMeta({ middleware: 'auth' });
const { list } = useArticlesApi();
const { hasPermission } = useAuth();
const { data: articles } = await useAsyncData('dashboard-articles', list, { default: () => [], getCachedData: () => undefined });
const count = (status: ArticleStatus) => articles.value.filter((item) => item.status === status).length;
</script>
