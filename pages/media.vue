<template>
  <div>
    <div class="page-heading">
      <div>
        <p class="eyebrow">MEDIA LIBRARY</p>
        <h1>媒体库</h1>
      </div>
      <label class="button primary media-upload">
        {{ uploading ? '上传中…' : '上传图片' }}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" :disabled="uploading" @change="upload" />
      </label>
    </div>

    <section v-if="pending" class="panel">正在加载媒体资源…</section>
    <section v-else-if="!assets?.length" class="panel">媒体库为空，请先上传一张图片。</section>
    <section v-else class="media-grid">
      <article v-for="asset in assets" :key="asset.id" class="panel media-card">
        <img :src="asset.url" :alt="asset.filename" />
        <div class="media-card-body">
          <strong :title="asset.filename">{{ asset.filename }}</strong>
          <small>上传者：{{ asset.uploadedBy.name }}</small>
          <small>上传时间：{{ formatTime(asset.createdAt) }}</small>
          <small>文章引用：{{ asset.referenceCount }}</small>
          <div class="media-actions">
            <button class="button secondary" type="button" @click="copyUrl(asset.url)">复制 URL</button>
            <button
              class="button danger"
              type="button"
              :disabled="asset.referenceCount > 0 || deleting === asset.id"
              :title="asset.referenceCount > 0 ? '图片仍被文章引用，不能删除' : ''"
              @click="removeAsset(asset.id, asset.filename)"
            >
              {{ deleting === asset.id ? '删除中…' : '删除' }}
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'edit-access'] });

const mediaApi = useMediaApi();
const toast = useToast();
const uploading = ref(false);
const deleting = ref('');
const { data: assets, pending, refresh } = await useAsyncData('media-library', () => mediaApi.list());

const upload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    await mediaApi.uploadImage(file);
    toast.success('图片上传成功');
    await refresh();
  } catch (exception) {
    toast.error(getApiErrorMessage(exception));
  } finally {
    uploading.value = false;
    input.value = '';
  }
};

const copyUrl = async (url: string) => {
  await navigator.clipboard.writeText(url);
  toast.success('图片 URL 已复制');
};

const removeAsset = async (id: string, filename: string) => {
  if (!window.confirm(`确定删除“${filename}”吗？此操作会同时删除 Cloudinary 资源。`)) return;
  deleting.value = id;
  try {
    await mediaApi.remove(id);
    toast.success('图片已删除');
    await refresh();
  } catch (exception) {
    toast.error(getApiErrorMessage(exception));
  } finally {
    deleting.value = '';
  }
};

const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN');
</script>
