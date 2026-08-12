<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">OVERVIEW</p><h1>工作台概览</h1></div>
      <NuxtLink v-if="hasPermission('articles.create')" class="button primary" to="/articles/create">＋ 创建文章</NuxtLink>
    </div>
    <section class="stats-grid">
      <NuxtLink to="/articles"><span>全部文章</span><strong>{{ analytics?.statuses.total ?? '—' }}</strong></NuxtLink>
      <NuxtLink to="/articles?status=draft"><span>草稿箱</span><strong>{{ analytics?.statuses.draft ?? '—' }}</strong></NuxtLink>
      <NuxtLink to="/articles?status=review"><span>审核中</span><strong>{{ analytics?.statuses.review ?? '—' }}</strong></NuxtLink>
      <NuxtLink to="/articles?status=published"><span>已发布</span><strong>{{ analytics?.statuses.published ?? '—' }}</strong></NuxtLink>
    </section>
    <section class="stats-grid audience-summary">
      <NuxtLink to="/analytics"><span>累计阅读</span><strong>{{ number(analytics?.totalViews) }}</strong></NuxtLink>
      <NuxtLink to="/analytics"><span>近 7 天阅读</span><strong>{{ number(analytics?.viewsLast7Days) }}</strong></NuxtLink>
      <NuxtLink to="/analytics"><span>近 30 天发布</span><strong>{{ analytics?.publishedLast30Days ?? '—' }}</strong></NuxtLink>
      <NuxtLink to="/analytics"><span>数据分析</span><strong class="analytics-entry">查看趋势 →</strong></NuxtLink>
    </section>
    <section v-if="analyticsError" class="panel data-error"><strong>统计数据加载失败</strong><p>{{ getApiErrorMessage(analyticsError) }}</p></section>
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
definePageMeta({ middleware: 'auth' });
const { list } = useArticlesApi();
const { hasPermission } = useAuth();
const { overview } = useAnalyticsApi();
const { data: articles } = await useAsyncData('dashboard-articles', list, { default: () => [], server:false, getCachedData: () => undefined });
const { data: analytics, error:analyticsError } = await useAsyncData('dashboard-analytics', overview, { server:false, getCachedData:()=>undefined });
const number = (value?:number) => value === undefined ? '—' : value.toLocaleString('zh-CN');
</script>
