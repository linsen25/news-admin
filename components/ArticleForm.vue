<template>
  <form class="article-form" @submit.prevent="emitAction('save')">
    <section class="panel form-main">
      <label>文章标题<input v-model="form.title" required placeholder="输入清晰、准确的新闻标题"></label>
      <label>摘要<textarea v-model="form.summary" rows="3" placeholder="用一至两句话概括文章重点，将显示在新闻列表中"></textarea></label>
      <div class="article-credit-fields">
        <label>文章作者（署名）<input v-model="form.byline" required placeholder="例如：李明、本报通讯员或中加网编辑部"><small>这是前台向读者展示的作者，不会使用你的后台账号名称。</small></label>
        <label>稿件日期<AppDatePicker v-model="form.articleDate" /><small>显示在文章页面；系统创建时间和实际发布时间仍会分别记录。</small></label>
      </div>
      <div class="form-field">
        <span class="field-label">正文内容</span>
        <RichTextEditor v-model="form.content" />
      </div>
      <details class="seo-fields">
        <summary>搜索引擎设置（SEO）<small>可选，留空时自动使用标题和摘要</small></summary>
        <p class="seo-help">这些内容主要提供给 Google、Bing 等搜索引擎，不会替代文章页面上的标题和摘要。</p>
        <label>文章网址 Slug<input v-model="form.slug" placeholder="例如：canada-ai-policy"></label>
        <label>搜索结果标题<input v-model="form.metaTitle" maxlength="120" placeholder="留空则使用文章标题"></label>
        <label>搜索结果描述<textarea v-model="form.metaDescription" rows="3" maxlength="300" placeholder="留空则使用文章摘要"></textarea></label>
        <label>搜索关键词<input :value="form.keywords.join(', ')" placeholder="例如：AI, 加拿大, 政策" @input="setKeywords"></label>
      </details>
    </section>

    <aside class="panel form-side">
      <fieldset class="article-taxonomy-field">
        <legend>文章分类 <small>单选</small></legend>
        <div class="article-category-options">
          <label v-for="category in categoryOptions" :key="category.id" class="taxonomy-option" :class="{ selected: form.categoryId === category.id }">
            <input v-model="form.categoryId" type="radio" :value="category.id" required>
            <span class="taxonomy-control"></span>
            <span><strong>{{ category.name }}</strong><small>{{ category.nameEn || '新闻分类' }}</small></span>
          </label>
        </div>
        <small v-if="!categories.length">暂无分类，请由管理员在“分类与标签”中创建。</small>
      </fieldset>
      <fieldset class="article-taxonomy-field">
        <legend>文章标签 <small>可多选</small></legend>
        <div class="article-tag-options">
          <label v-for="tag in availableTags" :key="tag.id" class="tag-option" :class="{ selected: form.tagIds.includes(tag.id) }"><input v-model="form.tagIds" type="checkbox" :value="tag.id"><span># {{ tag.name }}<small v-if="tag.nameEn">{{ tag.nameEn }}</small></span></label>
        </div>
        <small v-if="form.categoryId && !availableTags.length">当前分类暂无标签，请由管理员在“分类与标签”中创建。</small>
        <div v-if="form.categoryId" class="custom-tag-create">
          <span>没有合适的标签？可以在当前分类下新建自定义标签</span>
          <input v-model="customTagName" maxlength="50" placeholder="输入新标签名称" @keydown.enter.prevent="addCustomTag">
          <button class="button secondary" type="button" :disabled="creatingTag || !customTagName.trim()" @click="addCustomTag">{{ creatingTag ? '创建中…' : '创建并选中' }}</button>
        </div>
        <small class="field-help">至少选择一个标签；自定义标签会保存到当前分类，之后可以继续复用。</small>
      </fieldset>

      <div class="cover-upload-block">
        <strong>封面图片</strong>
        <p>选择图片后自动裁剪为 16:9，并上传到媒体库。</p>
        <button class="button secondary" type="button" :disabled="coverUploading" @click="coverInput?.click()">
          {{ coverUploading ? '处理并上传中…' : form.coverImage ? '更换封面' : '选择并上传封面' }}
        </button>
        <button class="button secondary" type="button" :disabled="coverUploading" @click="openCoverLibrary">从媒体库选择</button>
        <input ref="coverInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadCover">
      </div>
      <div class="cover-placeholder">
        <img v-if="form.coverImage" :src="form.coverImage" alt="封面预览">
        <template v-else>建议使用横向高清图片<br><small>自动裁剪比例：16:9</small></template>
      </div>
      <p class="status-line">当前状态：<StatusBadge :status="form.status" /></p>
      <button v-if="hasPermission('articles.save.draft')" class="button primary" type="submit" :disabled="saving || coverUploading">{{ saving ? '保存中…' : '保存到草稿箱' }}</button>
      <button class="button secondary" type="button" :disabled="saving || coverUploading" @click="emitAction('preview')">预览</button>
      <button v-if="hasPermission('articles.submit')" class="button publish" type="button" :disabled="saving || coverUploading" @click="emitAction('submit')">提交审核</button>
      <NuxtLink class="button text" to="/articles?status=draft">打开草稿箱</NuxtLink>
    </aside>

    <div v-if="coverLibraryOpen" class="modal-backdrop editor-modal-layer" @click.self="coverLibraryOpen=false">
      <section class="modal-card media-picker-dialog">
        <div class="section-title"><div><p class="eyebrow">MEDIA LIBRARY</p><h2>选择文章封面</h2></div><button class="modal-close" type="button" @click="coverLibraryOpen=false">×</button></div>
        <p class="muted">选择已有图片作为封面；前台会以 16:9 居中裁切展示，原图不会被修改。</p>
        <p v-if="coverLibraryPending" class="muted">正在加载媒体库…</p>
        <div v-else-if="coverAssets.length" class="media-picker-grid cover-library-grid">
          <button v-for="asset in coverAssets" :key="asset.id" type="button" :class="{ selected:form.coverImage===asset.url }" @click="selectCover(asset)"><img :src="asset.url" :alt="asset.filename"><span>{{ asset.filename }}</span></button>
        </div>
        <p v-else class="muted">媒体库暂无图片，请先上传封面。</p>
      </section>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { ArticleInput } from '~/types/article';
import { emptyDocument } from '~/types/article';
import type { MediaAssetDTO } from '~/composables/useMediaApi';

const props = withDefaults(defineProps<{ initial?: Partial<ArticleInput>; saving?: boolean }>(), { saving: false });
const emit = defineEmits<{ save: [value: ArticleInput]; preview: [value: ArticleInput]; submitReview: [value: ArticleInput] }>();
const { user, hasPermission } = useAuth();
const catalogApi = useCatalogApi();
const mediaApi = useMediaApi();
const toast = useToast();
const coverInput = ref<HTMLInputElement | null>(null);
const coverUploading = ref(false);
const coverLibraryOpen = ref(false);
const coverLibraryPending = ref(false);
const coverAssets = ref<MediaAssetDTO[]>([]);
const { data: categories } = await useAsyncData('admin-categories', catalogApi.categories, { default: () => [] });
const { data: tags, refresh: refreshTags } = await useAsyncData('admin-tags', catalogApi.tags, { default: () => [] });
const customTagName = ref('');
const creatingTag = ref(false);
const actorId = user.value?.id ?? 'user-author';
const categoryOptions = computed(() => [...categories.value].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')));
const availableTags = computed(() => tags.value.filter((tag) => tag.categoryId === form.categoryId));
const form = reactive<ArticleInput>({
  title: props.initial?.title ?? '', slug: props.initial?.slug ?? '', summary: props.initial?.summary ?? '',
  byline: props.initial?.byline ?? '', articleDate: props.initial?.articleDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  metaTitle: props.initial?.metaTitle ?? '', metaDescription: props.initial?.metaDescription ?? '', keywords: props.initial?.keywords ?? [],
  content: props.initial?.content ?? emptyDocument(), coverImage: props.initial?.coverImage ?? '',
  categoryId: props.initial?.categoryId ?? 'cat-ai', tagIds: props.initial?.tagIds ?? [], status: props.initial?.status ?? 'draft',
  authorId: props.initial?.authorId ?? actorId, currentEditorId: actorId,
});

const cropCover = async (file: File) => {
  const bitmap = await createImageBitmap(file);
  const ratio = 16 / 9;
  const sourceWidth = bitmap.width / bitmap.height > ratio ? bitmap.height * ratio : bitmap.width;
  const sourceHeight = sourceWidth / ratio;
  const canvas = document.createElement('canvas');
  canvas.width = 1600; canvas.height = 900;
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - sourceWidth) / 2, (bitmap.height - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, 1600, 900);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('图片裁剪失败')), 'image/jpeg', .88));
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-cover.jpg`, { type: 'image/jpeg' });
};
const uploadCover = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  coverUploading.value = true;
  try { const asset = await mediaApi.uploadImage(await cropCover(file)); form.coverImage = asset.url; toast.success('封面已按 16:9 裁剪并上传'); }
  catch (exception) { toast.error(getApiErrorMessage(exception)); }
  finally { coverUploading.value = false; input.value = ''; }
};
const openCoverLibrary = async () => {
  coverLibraryOpen.value = true;
  coverLibraryPending.value = true;
  try { coverAssets.value = await mediaApi.list(); }
  catch (exception) { toast.error(getApiErrorMessage(exception)); }
  finally { coverLibraryPending.value = false; }
};
const selectCover = (asset: MediaAssetDTO) => { form.coverImage = asset.url; coverLibraryOpen.value = false; toast.success('已从媒体库选择封面'); };
const setKeywords = (event: Event) => { form.keywords = (event.target as HTMLInputElement).value.split(',').map((value) => value.trim()).filter(Boolean); };
const addCustomTag = async () => {
  const name = customTagName.value.trim();
  if (!name || !form.categoryId) return;
  creatingTag.value = true;
  try {
    const created = await catalogApi.createCustomTag(name, form.categoryId);
    await refreshTags();
    if (!form.tagIds.includes(created.id)) form.tagIds.push(created.id);
    customTagName.value = '';
    toast.success('自定义标签已添加并选中');
  } catch (exception) { toast.error(getApiErrorMessage(exception)); }
  finally { creatingTag.value = false; }
};
watch(() => props.initial, (value) => value && Object.assign(form, value), { deep: true });
watchEffect(() => { if (!categories.value.some((item) => item.id === form.categoryId) && categories.value[0]) form.categoryId = categories.value[0].id; });
watch(() => form.categoryId, () => { form.tagIds = form.tagIds.filter((id) => availableTags.value.some((tag) => tag.id === id)); });
const emitAction = (action: 'save' | 'preview' | 'submit') => {
  if (!form.title.trim()) return toast.error('请填写文章标题');
  if (!form.byline.trim()) return toast.error('请填写文章作者（署名）');
  if (!form.articleDate) return toast.error('请选择稿件日期');
  if (!form.categoryId) return toast.error('请选择一个文章分类');
  if (!form.tagIds.length) return toast.error('请至少选择一个文章标签');
  emit(action === 'submit' ? 'submitReview' : action, { ...form, content: structuredClone(toRaw(form.content)), keywords: [...form.keywords], tagIds: [...form.tagIds], status: 'draft' });
};
</script>
