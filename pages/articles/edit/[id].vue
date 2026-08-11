<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">EDIT ARTICLE</p><h1>编辑文章</h1></div>
    </div>
    <ArticleForm
      v-if="article && canEdit"
      :initial="initial"
      :saving="saving"
      @save="saveDraft"
      @preview="preview"
      @submit-review="submitReview"
    />
    <section v-if="article?.status === 'published'" class="panel published-edit-warning">
      <strong>正在修改已发布文章</strong>
      <p>保存或预览修改后，文章将转为草稿并暂时从前台撤下；修改完成后需要重新提交审核和发布。</p>
    </section>
    <section v-else-if="article" class="panel">
      当前状态为“{{ article.status }}”，审核中或已通过的文章需要先完成当前审核流程。
    </section>
    <section v-else class="panel">文章不存在。</section>

    <section v-if="reviewHistory?.reviewComments.length" class="panel author-history">
      <div class="section-title"><h2>审核意见</h2><span>请修改后重新提交</span></div>
      <article v-for="comment in reviewHistory.reviewComments" :key="comment.id" class="comment-card">
        <div><strong>{{ comment.reviewer.name }}</strong><time>{{ formatTime(comment.createdAt) }}</time></div>
        <p>{{ comment.content }}</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ArticleInput } from '~/types/article';
definePageMeta({ middleware: ['auth', 'edit-access'] });
const route = useRoute();
const { get, update, submit, history } = useArticlesApi();
const { success, error } = useToast();
const id = String(route.params.id);
const { data: article } = await useAsyncData(`article-${id}`, () => get(id));
const { data: reviewHistory, refresh: refreshHistory } = await useAsyncData(
  `article-history-${id}`,
  () => history(id),
);
const saving = ref(false);
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
  categoryId: article.value.category.id,
  tagIds: article.value.tags.map((tag) => tag.id),
  status: article.value.status,
  authorId: article.value.author.id,
  currentEditorId: useAuth().user.value?.id ?? 'user-author',
}) : undefined);
const canEdit = computed(() => article.value ? ['draft', 'rejected', 'published'].includes(article.value.status) : false);
const persist = async (input: ArticleInput) => {
  saving.value = true;
  try {
    article.value = await update(id, input);
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
  await refreshNuxtData(['articles', 'dashboard-articles']);
  success('预览版本已保存');
  const url = `${config.public.webBase}/preview/${saved.id}?token=mock-preview-token`;
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
