<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">HOMEPAGE DESK</p><h1>首页编排</h1><p class="muted">拖动已发布文章到对应位置。这里的调整不会改变文章状态，也不会触发重新审核。</p></div>
      <button class="button primary" type="button" :disabled="saving" @click="save">{{ saving ? '保存中…' : canManage ? '保存首页编排' : '🔒 只读查看' }}</button>
    </div>

    <section v-if="error" class="panel data-error"><strong>首页数据加载失败</strong><p>{{ getApiErrorMessage(error) }}</p></section>
    <div v-else class="homepage-desk">
      <aside class="panel homepage-library">
        <div class="section-title"><h2>已发布文章</h2><span>{{ filteredArticles.length }}</span></div>
        <input v-model="search" placeholder="搜索标题、分类或署名">
        <div class="homepage-library-list">
          <article v-for="article in filteredArticles" :key="article.id" :draggable="canManage" @dragstart="startDrag($event, article.id)">
            <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" :style="imagePosition(article)">
            <div><small>{{ article.category.name }}</small><strong>{{ article.title }}</strong><span>{{ article.byline || '未填写署名' }}</span></div>
          </article>
        </div>
      </aside>

      <main class="homepage-layout-editor">
        <section class="panel editorial-section">
          <div class="section-title"><div><p class="eyebrow">LEAD STORY</p><h2>主头条</h2></div><span>固定 1 篇</span></div>
          <div class="slot-zone main-slot" :class="{ empty: !mainSlot }" @dragover.prevent @drop="dropInto($event, 'headline_main', 'global', 1)">
            <HomepageSlotCard v-if="mainSlot" :article="articleFor(mainSlot.articleId)" :readonly="!canManage" @remove="removeSlot(mainSlot)" />
            <p v-else>将一篇文章拖到这里作为主头条</p>
          </div>
        </section>

        <section class="panel editorial-section">
          <div class="section-title"><div><p class="eyebrow">SECONDARY STORIES</p><h2>次头条</h2></div><span>{{ secondarySlots.length }} / 4</span></div>
          <div class="slot-zone slot-grid" @dragover.prevent @drop="dropInto($event, 'headline_secondary', 'global', 4)">
            <HomepageSlotCard v-for="(slot,index) in secondarySlots" :key="slot.articleId" :article="articleFor(slot.articleId)" :readonly="!canManage" @remove="removeSlot(slot)" @move="moveSlot(secondarySlots,index,$event)" />
            <p v-if="!secondarySlots.length">拖入最多四篇次头条，可调整顺序</p>
          </div>
        </section>

        <section v-for="category in categories" :key="category.id" class="panel editorial-section">
          <div class="section-title"><div><p class="eyebrow">CATEGORY FEATURED</p><h2>{{ category.name }}</h2></div><span>{{ categorySlots(category.id).length }} / 5</span></div>
          <div class="slot-zone slot-grid" @dragover.prevent @drop="dropInto($event, 'category_featured', category.id, 5)">
            <HomepageSlotCard v-for="(slot,index) in categorySlots(category.id)" :key="slot.articleId" :article="articleFor(slot.articleId)" :readonly="!canManage" @remove="removeSlot(slot)" @move="moveCategorySlot(category.id,index,$event)" />
            <p v-if="!categorySlots(category.id).length">拖入该分类文章；未设置时前台自动按热度补位</p>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleDTO } from '~/types/article';
import type { CatalogItem } from '~/composables/useCatalogApi';
import type { components } from '~/types/generated/api';
definePageMeta({ middleware: ['auth'] });
type LayoutDTO = components['schemas']['HomepageLayoutDto'];
type Section = components['schemas']['HomepageSlotInputDto']['section'];
type EditableSlot = { section: Section; scope: string; articleId: string; startsAt?: string | null; endsAt?: string | null };
const config = useRuntimeConfig();
const { authHeaders, hasPermission } = useAuth();
const toast = useToast();
const canManage = computed(() => hasPermission('homepage.manage'));
const endpoint = `${config.public.apiBase}/homepage`;
const [{ data: layout, error }, { data: articles }, { data: categories }] = await Promise.all([
  useAsyncData('homepage-layout-admin', () => $fetch<LayoutDTO>(endpoint, { headers: authHeaders() })),
  useAsyncData('homepage-published-articles', () => $fetch<ArticleDTO[]>(`${config.public.apiBase}/articles/public`), { default: () => [] }),
  useAsyncData('homepage-categories', () => $fetch<CatalogItem[]>(`${config.public.apiBase}/categories`), { default: () => [] }),
]);
const slots = ref<EditableSlot[]>((layout.value?.slots || []).map((slot) => ({ section: slot.section, scope: slot.scope, articleId: slot.article.id, startsAt: slot.startsAt, endsAt: slot.endsAt })));
const search = ref(''); const saving = ref(false);
const mainSlot = computed(() => slots.value.find((slot) => slot.section === 'headline_main'));
const secondarySlots = computed(() => slots.value.filter((slot) => slot.section === 'headline_secondary'));
const categorySlots = (categoryId: string) => slots.value.filter((slot) => slot.section === 'category_featured' && slot.scope === categoryId);
const articleFor = (id: string) => articles.value.find((article) => article.id === id);
const filteredArticles = computed(() => { const q=search.value.trim().toLocaleLowerCase(); return articles.value.filter((article) => !q || [article.title,article.summary,article.byline,article.category.name].join(' ').toLocaleLowerCase().includes(q)); });
const imagePosition = (article: ArticleDTO) => ({ objectPosition: `${article.coverFocalX ?? 50}% ${article.coverFocalY ?? 50}%` });
const startDrag = (event: DragEvent,id:string) => event.dataTransfer?.setData('text/article-id',id);
const dropInto = (event:DragEvent,section:Section,scope:string,limit:number) => {
  if (!canManage.value) return;
  const articleId=event.dataTransfer?.getData('text/article-id'); if (!articleId) return;
  const article=articleFor(articleId); if (!article) return;
  if (section==='category_featured' && article.category.id!==scope) return toast.error('只能把该分类的文章放入这个模块');
  const group=slots.value.filter((slot)=>slot.section===section&&slot.scope===scope);
  if (group.some((slot)=>slot.articleId===articleId)) return;
  if (section==='headline_main') slots.value=slots.value.filter((slot)=>slot.section!=='headline_main');
  else if (group.length>=limit) return toast.error(`该区域最多放置 ${limit} 篇文章`);
  slots.value.push({section,scope,articleId});
};
const removeSlot=(target:EditableSlot)=>{ if(canManage.value) slots.value=slots.value.filter((slot)=>slot!==target); };
const moveSlot=(group:EditableSlot[],index:number,direction:number)=>{ const other=group[index+direction]; if(!canManage.value||!other)return; const a=slots.value.indexOf(group[index]); const b=slots.value.indexOf(other); [slots.value[a],slots.value[b]]=[slots.value[b],slots.value[a]]; };
const moveCategorySlot=(categoryId:string,index:number,direction:number)=>moveSlot(categorySlots(categoryId),index,direction);
const save=async()=>{
  if(!canManage.value)return usePermissionNotice().open('保存首页编排','首页编排管理权限（管理员）');
  saving.value=true;
  try {
    const counters=new Map<string,number>();
    const payload=slots.value.map((slot)=>{const key=`${slot.section}:${slot.scope}`;const position=counters.get(key)||0;counters.set(key,position+1);return {...slot,position};});
    const saved=await $fetch<LayoutDTO>(endpoint,{method:'PUT',headers:authHeaders(),body:{slots:payload}});
    slots.value=saved.slots.map((slot)=>({section:slot.section,scope:slot.scope,articleId:slot.article.id,startsAt:slot.startsAt,endsAt:slot.endsAt}));
    toast.success('首页编排已保存，前台将立即使用新布局');
  } catch(exception){toast.error(getApiErrorMessage(exception));} finally{saving.value=false;}
};
</script>
