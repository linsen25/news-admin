<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">CONTENT</p><h1>{{ status === 'draft' ? '草稿箱' : '文章管理' }}</h1></div>
      <NuxtLink v-if="hasPermission('articles.create')" class="button primary" to="/articles/create">＋ 创建文章</NuxtLink>
    </div>
    <section class="panel">
      <div class="filter-row">
        <input v-model="query" placeholder="搜索标题或摘要">
        <AppSelect v-model="status" :options="statusOptions" placeholder="全部状态" allow-empty />
      </div>
      <div class="article-table">
        <div class="table-head"><span>标题</span><span>状态</span><span>更新时间</span><span>操作</span></div>
        <div v-for="article in filtered" :key="article.id" class="table-row">
          <div><strong>{{ article.title }}</strong><small>{{ article.summary }}</small></div>
          <StatusBadge :status="article.status" />
          <span>{{ new Date(article.updatedAt).toLocaleDateString('zh-CN') }}</span>
          <NuxtLink :to="`/articles/edit/${article.id}`">{{ ['draft', 'rejected'].includes(article.status) ? '编辑' : '查看' }}</NuxtLink>
        </div>
        <p v-if="!filtered.length" class="empty-state">当前没有符合条件的文章。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'edit-access'] });
const route = useRoute();
const router = useRouter();
const { hasPermission } = useAuth();
const query = ref('');
const status = ref(String(route.query.status || ''));
const statusOptions = [{ value:'draft', label:'草稿' }, { value:'review', label:'审核中' }, { value:'approved', label:'已通过' }, { value:'rejected', label:'已退回' }, { value:'published', label:'已发布' }];
const { list } = useArticlesApi();
const { data: articles } = await useAsyncData('articles', list, { default: () => [] });
watch(() => route.query.status, (value) => { status.value = String(value || ''); });
watch(status, (value) => router.replace({ query: { ...route.query, status: value || undefined } }));
const filtered = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase();
  return articles.value.filter((item) => (!keyword || `${item.title} ${item.summary}`.toLocaleLowerCase().includes(keyword)) && (!status.value || item.status === status.value));
});
</script>
