<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">EDIT ARTICLE</p><h1>编辑文章</h1></div>
      <button v-if="article && hasPermission('articles.withdraw') && (article.status === 'published' || article.hasPublishedVersion)" class="button danger" type="button" @click="openWithdraw">撤稿</button>
    </div>
    <ArticleForm
      v-if="article && canEdit"
      :initial="initial"
      :saving="saving"
      @save="saveDraft"
      @preview="preview"
      @submit-review="submitReview"
    />
    <section v-if="article && (article.status === 'published' || article.hasPublishedVersion)" class="panel published-edit-warning">
      <strong>正在修改已发布文章</strong>
      <p>保存或预览后会建立新的草稿版本，前台继续展示当前已发布版本；新版本需要重新审核和发布后才会替换线上内容。</p>
    </section>
    <section v-else-if="article && article.status !== 'withdrawn'" class="panel">
      当前状态为“{{ article.status }}”，审核中或已通过的文章需要先完成当前审核流程。
    </section>
    <section v-else-if="article" class="panel published-edit-warning"><strong>文章已撤稿</strong><p>前台已停止展示。你可以继续编辑，保存后重新提交审核；只有再次发布成功后才会重新上线。</p></section>
    <section v-else class="panel">文章不存在。</section>

    <section v-if="reviewHistory?.reviewComments.length" class="panel author-history">
      <div class="section-title"><h2>审核意见</h2><span>请修改后重新提交</span></div>
      <article v-for="comment in reviewHistory.reviewComments" :key="comment.id" class="comment-card">
        <div><strong>{{ comment.reviewer.name }}</strong><time>{{ formatTime(comment.createdAt) }}</time></div>
        <p>{{ comment.content }}</p>
      </article>
    </section>

    <div v-if="withdrawOpen" class="modal-backdrop" @click.self="withdrawOpen=false">
      <form class="modal-card" @submit.prevent="confirmWithdraw"><p class="eyebrow">WITHDRAW ARTICLE</p><h2>确认撤下《{{ article?.title }}》？</h2><p class="muted">撤稿后原网址会保留公开撤稿声明，但不会继续展示正文。稿件、历史和媒体引用都会保留。</p><label>撤稿原因<textarea v-model="withdrawReason" required minlength="2" rows="4" placeholder="例如：部分事实需要进一步核实。" /></label><div class="modal-actions"><button class="button secondary" type="button" @click="withdrawOpen=false">取消</button><button class="button danger" type="submit" :disabled="withdrawing || withdrawReason.trim().length < 2">{{ withdrawing ? '撤稿中…' : '确认撤稿' }}</button></div></form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleInput } from '~/types/article';
definePageMeta({ middleware: ['auth', 'edit-access'] });
const route = useRoute();
const { get, update, submit, withdraw, history, createPreviewToken } = useArticlesApi();
const { hasPermission } = useAuth();
const { success, error } = useToast();
const id = String(route.params.id);
const { data: article } = await useAsyncData(`article-${id}`, () => get(id));
const { data: reviewHistory, refresh: refreshHistory } = await useAsyncData(
  `article-history-${id}`,
  () => history(id),
);
const saving = ref(false);
const withdrawOpen = ref(false);
const withdrawing = ref(false);
const withdrawReason = ref('');
const openWithdraw = () => { withdrawReason.value = ''; withdrawOpen.value = true; };
const config = useRuntimeConfig();
const initial = computed<Partial<ArticleInput> | undefined>(() => article.value ? ({
  title: article.value.title,
  slug: article.value.slug,
  summary: article.value.summary,
  byline: article.value.byline,
  articleDate: article.value.articleDate.slice(0, 10),
  metaTitle: article.value.metaTitle,
  metaDescription: article.value.metaDescription,
  keywords: article.value.keywords,
  content: article.value.content,
  coverImage: article.value.coverImage,
  coverFocalX: article.value.coverFocalX,
  coverFocalY: article.value.coverFocalY,
  isHeadline: article.value.isHeadline,
  homepagePriority: article.value.homepagePriority,
  categoryId: article.value.category.id,
  tagIds: article.value.tags.map((tag) => tag.id),
  status: article.value.status,
  authorId: article.value.author.id,
  currentEditorId: useAuth().user.value?.id ?? 'user-author',
}) : undefined);
const canEdit = computed(() => article.value ? ['draft', 'rejected', 'published', 'withdrawn'].includes(article.value.status) : false);
const confirmWithdraw = async () => {
  if (!article.value) return;
  withdrawing.value = true;
  try { article.value = await withdraw(article.value.id, withdrawReason.value.trim()); withdrawOpen.value = false; success('文章已撤稿，原网址已显示撤稿声明'); await refreshHistory(); await refreshNuxtData(['articles','dashboard-articles']); }
  catch (exception) { error(getApiErrorMessage(exception)); }
  finally { withdrawing.value = false; }
};
const persist = async (input: ArticleInput) => {
  saving.value = true;
  try {
    article.value = await update(id, {
      ...input,
      expectedUpdatedAt: article.value?.updatedAt,
    });
    await refreshHistory();
    return article.value;
  } catch (exception) {
    error(getApiErrorMessage(exception));
    throw exception;
  } finally {
    saving.value = false;
  }
};
const saveDraft = async (input: ArticleInput) => {
  await persist({ ...input, status: 'draft' });
  await refreshNuxtData(['articles', 'dashboard-articles']);
  success('草稿保存成功');
};
const preview = async (input: ArticleInput) => {
  const previewWindow = window.open('', '_blank');
  const saved = await persist(input);
  const { token } = await createPreviewToken(saved.id);
  await refreshNuxtData(['articles', 'dashboard-articles']);
  success('预览版本已保存');
  const url = `${config.public.webBase}/preview/${saved.id}?token=${encodeURIComponent(token)}`;
  if (previewWindow) previewWindow.location.href = url;
};
const submitReview = async (input: ArticleInput) => {
  try {
    const saved = await persist({ ...input, status: 'draft' });
    article.value = await submit(saved.id);
    await refreshNuxtData(['articles', 'dashboard-articles']);
    success('文章已提交审核');
  } catch {}
};
const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN');
</script>
