<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">CONTENT</p><h1>文章管理</h1></div>
      <NuxtLink v-if="hasPermission('articles.create')" class="button primary" to="/articles/create">＋ 创建文章</NuxtLink>
    </div>
    <section class="panel">
      <div class="filter-row">
        <input v-model="query" placeholder="搜索标题…" />
        <select v-model="status"><option value="">全部状态</option><option value="draft">草稿</option><option value="review">审核中</option><option value="approved">已通过</option><option value="rejected">已退回</option><option value="published">已发布</option></select>
      </div>
      <div class="article-table">
        <div class="table-head"><span>标题</span><span>状态</span><span>更新时间</span><span>操作</span></div>
        <div v-for="article in filtered" :key="article.id" class="table-row">
          <div><strong>{{ article.title }}</strong><small>{{ article.summary }}</small></div>
          <StatusBadge :status="article.status" />
          <span>{{ new Date(article.updatedAt).toLocaleDateString('zh-CN') }}</span>
          <NuxtLink :to="`/articles/edit/${article.id}`">编辑</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'edit-access'] });
const { hasPermission } = useAuth();
const query = ref('');
const status = ref('');
const { list } = useArticlesApi();
const { data: articles } = await useAsyncData('articles', list, { default: () => [] });
const filtered = computed(() => articles.value.filter((item) =>
  item.title.includes(query.value) && (!status.value || item.status === status.value),
));
</script>
