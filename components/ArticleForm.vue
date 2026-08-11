<template>
  <form class="article-form" @submit.prevent="emitAction('save')">
    <section class="panel form-main">
      <label>文章标题<input v-model="form.title" required placeholder="输入新闻标题" /></label>
      <label>摘要<textarea v-model="form.summary" rows="3" placeholder="一句话介绍文章内容" /></label>
      <label>
        正文内容
        <details class="seo-fields">
          <summary>SEO 设置</summary>
          <label>Slug<input v-model="form.slug" placeholder="article-url-slug" /></label>
          <label>Meta Title<input v-model="form.metaTitle" maxlength="120" placeholder="默认使用文章标题" /></label>
          <label>Meta Description<textarea v-model="form.metaDescription" rows="3" maxlength="300" placeholder="默认使用文章摘要" /></label>
          <label>Keywords<input :value="form.keywords.join(', ')" placeholder="AI, 加拿大, 政策" @input="setKeywords" /></label>
        </details>
        <RichTextEditor v-model="form.content" />
      </label>
    </section>
    <aside class="panel form-side">
      <label>分类
        <select v-model="form.categoryId">
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </label>
      <fieldset>
        <legend>标签</legend>
        <label v-for="tag in tags" :key="tag.id" class="check">
          <input v-model="form.tagIds" type="checkbox" :value="tag.id" />{{ tag.name }}
        </label>
        <small v-if="!tags.length">暂无标签，请由管理员在标签管理中创建。</small>
      </fieldset>
      <label>封面图片 URL<input v-model="form.coverImage" placeholder="暂用图片 URL，上传接口后续接入" /></label>
      <div class="cover-placeholder">
        <img v-if="form.coverImage" :src="form.coverImage" alt="封面预览" />
        <template v-else>封面上传接口预留<br /><small>尚未连接 Cloudinary</small></template>
      </div>
      <p class="status-line">当前状态：<StatusBadge :status="form.status" /></p>
      <button v-if="hasPermission('articles.save.draft')" class="button primary" type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存草稿' }}</button>
      <button class="button secondary" type="button" :disabled="saving" @click="emitAction('preview')">预览</button>
      <button v-if="hasPermission('articles.submit')" class="button publish" type="button" :disabled="saving" @click="emitAction('submit')">提交审核</button>
      <NuxtLink class="button text" to="/articles">返回文章列表</NuxtLink>
    </aside>
  </form>
</template>

<script setup lang="ts">
import type { ArticleInput } from '~/types/article';
import { emptyDocument } from '~/types/article';

const props = withDefaults(
  defineProps<{ initial?: Partial<ArticleInput>; saving?: boolean }>(),
  { saving: false },
);
const emit = defineEmits<{
  save: [value: ArticleInput];
  preview: [value: ArticleInput];
  submitReview: [value: ArticleInput];
}>();
const { user, hasPermission } = useAuth();
const catalogApi = useCatalogApi();
const { data: categories } = await useAsyncData('admin-categories', catalogApi.categories, { default: () => [] });
const { data: tags } = await useAsyncData('admin-tags', catalogApi.tags, { default: () => [] });
const actorId = user.value?.id ?? 'user-author';
const form = reactive<ArticleInput>({
  title: props.initial?.title ?? '',
  slug: props.initial?.slug ?? '',
  summary: props.initial?.summary ?? '',
  metaTitle: props.initial?.metaTitle ?? '',
  metaDescription: props.initial?.metaDescription ?? '',
  keywords: props.initial?.keywords ?? [],
  content: props.initial?.content ?? emptyDocument(),
  coverImage: props.initial?.coverImage ?? '',
  categoryId: props.initial?.categoryId ?? 'cat-ai',
  tagIds: props.initial?.tagIds ?? [],
  status: props.initial?.status ?? 'draft',
  authorId: props.initial?.authorId ?? actorId,
  currentEditorId: actorId,
});

const setKeywords = (event: Event) => {
  form.keywords = (event.target as HTMLInputElement).value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
};

watch(
  () => props.initial,
  (value) => value && Object.assign(form, value),
  { deep: true },
);

const emitAction = (action: 'save' | 'preview' | 'submit') => {
  if (!form.title.trim()) return;
  const event = action === 'submit' ? 'submitReview' : action;
  emit(event, {
    ...form,
    content: structuredClone(toRaw(form.content)),
    keywords: [...form.keywords],
    tagIds: [...form.tagIds],
    status: 'draft',
  });
};
</script>
