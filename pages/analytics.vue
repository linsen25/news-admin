<template>
  <div>
    <div class="page-heading"><div><p class="eyebrow">AUDIENCE ANALYTICS</p><h1>文章分析</h1><p class="muted">基于有效文章阅读记录，观察近期趋势和内容表现。</p></div></div>
    <section v-if="error" class="panel data-error"><strong>分析数据加载失败</strong><p>{{ getApiErrorMessage(error) }}</p><button class="button secondary" @click="refresh">重新加载</button></section>
    <template v-else-if="analytics">
      <section class="stats-grid analytics-kpis">
        <article><span>累计阅读</span><strong>{{ number(analytics.totalViews) }}</strong></article>
        <article><span>近 7 天阅读</span><strong>{{ number(analytics.viewsLast7Days) }}</strong></article>
        <article><span>已发布文章</span><strong>{{ analytics.statuses.published }}</strong></article>
        <article><span>近 30 天发布</span><strong>{{ analytics.publishedLast30Days }}</strong></article>
      </section>
      <section class="panel analytics-chart-panel">
        <div class="section-title"><div><h2>近 14 天阅读趋势</h2><small>按有效独立阅读记录统计</small></div><strong>{{ number(trendTotal) }} 次</strong></div>
        <div class="trend-chart" role="img" aria-label="近14天文章阅读趋势柱状图">
          <div v-for="point in analytics.trend" :key="point.date" class="trend-column">
            <div class="trend-value">{{ point.views || '' }}</div>
            <div class="trend-bar-track"><div class="trend-bar" :style="{height:`${Math.max(point.views ? 5 : 0, point.views / maxViews * 100)}%`}"></div></div>
            <time>{{ formatDay(point.date) }}</time>
          </div>
        </div>
      </section>
      <section class="panel analytics-ranking">
        <div class="section-title"><div><h2>文章阅读排行</h2><small>累计有效阅读量</small></div><NuxtLink to="/articles">打开文章管理</NuxtLink></div>
        <div class="ranking-head"><span>排名</span><span>文章</span><span>分类</span><span>阅读量</span></div>
        <article v-for="(article,index) in analytics.topArticles" :key="article.id">
          <strong class="rank-number">{{ index+1 }}</strong>
          <div><NuxtLink :to="`/articles/edit/${article.id}`">{{ article.title }}</NuxtLink><small>{{ article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : '线上版本' }}</small></div>
          <span>{{ article.category }}</span><strong>{{ number(article.viewCount) }}</strong>
        </article>
        <p v-if="!analytics.topArticles.length" class="empty-state">发布文章产生阅读后，排行会显示在这里。</p>
      </section>
    </template>
    <p v-else class="empty-state">正在加载分析数据…</p>
  </div>
</template>
<script setup lang="ts">
definePageMeta({middleware:'auth'});
const {overview}=useAnalyticsApi();
const {data:analytics,error,refresh}=await useAsyncData('article-analytics',overview,{server:false,getCachedData:()=>undefined});
const number=(value:number)=>value.toLocaleString('zh-CN');
const trendTotal=computed(()=>analytics.value?.trend.reduce((sum,item)=>sum+item.views,0)??0);
const maxViews=computed(()=>Math.max(1,...(analytics.value?.trend.map(item=>item.views)??[1])));
const formatDay=(date:string)=>new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric'}).format(new Date(`${date}T00:00:00Z`));
</script>
