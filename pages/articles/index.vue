<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">CONTENT REGISTER</p><h1>{{ status === 'draft' ? '草稿箱' : '文章管理' }}</h1><small class="heading-meta">共 {{ pageData.total }} 篇文章</small></div>
      <NuxtLink v-if="hasPermission('articles.create')" class="button primary" to="/articles/create">＋ 创建文章</NuxtLink>
    </div>

    <section v-if="loadError" class="panel data-error">
      <strong>文章列表加载失败</strong><p>{{ getApiErrorMessage(loadError) }}</p><button class="button secondary" type="button" @click="refresh">重新加载</button>
    </section>
    <section v-else class="panel">
      <div class="article-register-filters">
        <input v-model="query" placeholder="搜索标题、摘要、作者或编辑人">
        <AppSelect v-model="categoryId" :options="categoryOptions" placeholder="全部分类" allow-empty />
        <AppSelect v-model="status" :options="statusOptions" placeholder="全部状态" allow-empty />
      </div>

      <p v-if="pending" class="empty-state">正在加载文章台账…</p>
      <div v-else class="article-register">
        <div class="article-register-head"><span>文章</span><span>分类 / 状态</span><span>人员</span><span>时间</span><span>操作</span></div>
        <article v-for="article in filtered" :key="article.id" class="article-register-row">
          <div class="register-title"><strong>{{ article.title }}</strong><p>{{ article.summary || '暂无摘要' }}</p><div><span v-for="tag in article.tags" :key="tag.id"># {{ tag.name }}</span></div></div>
          <div class="register-taxonomy"><strong>{{ article.category.name }}</strong><StatusBadge :status="article.status" /></div>
          <div class="register-people"><span><small>文章署名</small>{{ article.byline }}</span><span><small>录入负责人</small>{{ article.author.name }}</span><span><small>最近编辑</small>{{ article.currentEditor.name }}</span></div>
          <div class="register-times"><span><small>创建</small>{{ formatTime(article.createdAt) }}</span><span><small>修改</small>{{ formatTime(article.updatedAt) }}</span></div>
          <NuxtLink class="register-action" :to="`/articles/edit/${article.id}`">{{ ['draft','rejected'].includes(article.status) ? '编辑' : '查看' }} →</NuxtLink>
        </article>
        <p v-if="!filtered.length" class="empty-state">{{ pageData.total ? '当前筛选条件下没有文章。' : emptyMessage }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware:['auth','edit-access'] });
const route=useRoute(); const router=useRouter(); const { user, hasPermission }=useAuth();
const query=ref(''); const categoryId=ref(''); const status=ref(String(route.query.status||''));
const statusOptions=[{value:'draft',label:'草稿'},{value:'review',label:'审核中'},{value:'approved',label:'已通过'},{value:'rejected',label:'已退回'},{value:'published',label:'已发布'}];
const catalog=useCatalogApi(); const { listPage }=useArticlesApi();
const [{ data:pageData, pending, error:loadError, refresh }, { data:categories }] = await Promise.all([
  useAsyncData(`article-register-${user.value?.id || 'anonymous'}`, () => listPage(undefined,1,100), { default:() => ({ items:[], total:0, page:1, limit:100 }) }),
  useAsyncData('article-register-categories', catalog.categories, { default:() => [] }),
]);
const categoryOptions=computed(() => categories.value.map((category) => ({ value:category.id,label:category.name })));
watch(() => route.query.status,(value) => { status.value=String(value||''); });
watch(status,(value) => router.replace({ query:{ ...route.query,status:value||undefined } }));
const filtered=computed(() => { const keyword=query.value.trim().toLocaleLowerCase(); return pageData.value.items.filter((article) => (!status.value||article.status===status.value)&&(!categoryId.value||article.category.id===categoryId.value)&&(!keyword||[article.title,article.summary,article.byline,article.author.name,article.currentEditor.name,article.category.name,...article.tags.map((tag)=>tag.name)].join(' ').toLocaleLowerCase().includes(keyword))); });
const emptyMessage=computed(() => hasPermission('users.permissions.manage') ? '当前数据库中还没有文章。' : '当前账号权限范围内还没有可见文章。');
const formatTime=(value:string) => new Date(value).toLocaleString('zh-CN',{ year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit' });
</script>
