<template>
  <div>
    <div class="page-heading"><div><p class="eyebrow">NEW ARTICLE</p><h1>创建文章</h1></div></div>
    <ArticleForm :saving="saving" @save="saveDraft" @preview="preview" @submit-review="submitReview" />
  </div>
</template>

<script setup lang="ts">
import type { ArticleInput } from '~/types/article';
definePageMeta({ middleware: ['auth', 'edit-access'] });
const saving = ref(false);
const { create, submit, createPreviewToken } = useArticlesApi();
const { success, error } = useToast();
const config = useRuntimeConfig();
const persist = async (input: ArticleInput) => {
  saving.value = true;
  try {
    return await create(input);
  } catch (exception) {
    error(getApiErrorMessage(exception));
    throw exception;
  } finally {
    saving.value = false;
  }
};
const saveDraft = async (input: ArticleInput) => {
  const article = await persist({ ...input, status: 'draft' });
  const { token } = await createPreviewToken(article.id);
  await refreshNuxtData(['articles', 'dashboard-articles']);
  success('草稿创建成功');
  await navigateTo(`/articles/edit/${article.id}`);
};
const preview = async (input: ArticleInput) => {
  const previewWindow = window.open('', '_blank');
  const article = await persist({ ...input, status: 'draft' });
  await refreshNuxtData(['articles', 'dashboard-articles']);
  success('预览版本已保存');
  const url = `${config.public.webBase}/preview/${article.id}?token=${encodeURIComponent(token)}`;
  if (previewWindow) previewWindow.location.href = url;
  await navigateTo(`/articles/edit/${article.id}`);
};
const submitReview = async (input: ArticleInput) => {
  const article = await persist({ ...input, status: 'draft' });
  await submit(article.id);
  await refreshNuxtData(['articles', 'dashboard-articles']);
  success('文章已提交审核');
  await navigateTo(`/articles/edit/${article.id}`);
};
</script>
