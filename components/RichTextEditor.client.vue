<template>
  <div class="rich-editor">
    <div v-if="editor" class="editor-toolbar">
      <button type="button" title="光标所在段落设为二级标题" :class="{ active: editor.isFocused && editor.isActive('heading', { level:2 }) }" @mousedown.prevent="command('heading', 2)">H2</button>
      <button type="button" title="光标所在段落设为三级标题" :class="{ active: editor.isFocused && editor.isActive('heading', { level:3 }) }" @mousedown.prevent="command('heading', 3)">H3</button>
      <button class="bold-tool" type="button" title="加粗选中文字（Ctrl+B）" :class="{ active: editor.isFocused && editor.isActive('bold') }" @mousedown.prevent="command('bold')"><b>B</b></button>
      <button type="button" title="斜体选中文字（Ctrl+I）" :class="{ active: editor.isFocused && editor.isActive('italic') }" @mousedown.prevent="command('italic')"><i>I</i></button>
      <button type="button" title="引用段落" :class="{ active: editor.isFocused && editor.isActive('blockquote') }" @mousedown.prevent="command('quote')">引用</button>
      <button type="button" title="项目列表" :class="{ active: editor.isFocused && editor.isActive('bulletList') }" @mousedown.prevent="command('bullet')">项目列表</button>
      <button type="button" title="编号列表" :class="{ active: editor.isFocused && editor.isActive('orderedList') }" @mousedown.prevent="command('ordered')">编号列表</button>
      <button type="button" title="给选中文字添加可点击的网页地址" :class="{ active: editor.isFocused && editor.isActive('link') }" @mousedown.prevent="openLink">🔗 插入链接</button>
      <button type="button" title="上传图片或从媒体库选择" @mousedown.prevent="openMedia">▧ 图片</button>
      <span class="toolbar-spacer"></span>
      <button class="history-tool" type="button" title="撤销（Ctrl+Z）" :disabled="!editor.can().undo()" @mousedown.prevent="editor.chain().focus().undo().run()">↶</button>
      <button class="history-tool" type="button" title="重做（Ctrl+Y）" :disabled="!editor.can().redo()" @mousedown.prevent="editor.chain().focus().redo().run()">↷</button>
    </div>
    <EditorContent :editor="editor" />

    <div v-if="linkOpen" class="modal-backdrop editor-modal-layer" @click.self="closeLink">
      <form class="modal-card editor-dialog" @submit.prevent="applyLink">
        <p class="eyebrow">INSERT LINK</p><h2>插入网页链接</h2>
        <p class="muted">链接会让选中的文字变成可点击入口，例如新闻来源、政府公告或站内相关文章。</p>
        <label>网页地址<input v-model="linkHref" type="url" required placeholder="https://example.com/article"></label>
        <div class="modal-actions"><button class="button secondary" type="button" @click="closeLink">取消</button><button class="button primary" type="submit">插入链接</button></div>
      </form>
    </div>

    <div v-if="mediaOpen" class="modal-backdrop editor-modal-layer" @click.self="mediaOpen = false">
      <section class="modal-card editor-dialog media-picker-dialog">
        <div class="section-title"><div><p class="eyebrow">MEDIA LIBRARY</p><h2>插入正文图片</h2></div><button class="modal-close" @click="mediaOpen = false">×</button></div>
        <div class="media-picker-actions"><button class="button secondary" type="button" :disabled="uploading" @click="fileInput?.click()">{{ uploading ? '上传中…' : '＋ 上传新图片' }}</button><input ref="fileInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" @change="uploadImage"></div>
        <p v-if="mediaPending" class="muted">正在加载媒体库…</p>
        <div v-else class="media-picker-grid">
          <button v-for="asset in mediaAssets" :key="asset.id" type="button" :class="{ selected:selectedAsset?.id === asset.id }" @click="selectAsset(asset)"><img :src="asset.url" :alt="asset.filename"><span>{{ asset.filename }}</span></button>
        </div>
        <template v-if="selectedAsset"><label>图片替代文字<input v-model="imageAlt" placeholder="描述图片内容"></label><label>图片说明<input v-model="imageCaption" placeholder="可选，将显示在图片下方"></label></template>
        <div class="modal-actions"><button class="button secondary" type="button" @click="mediaOpen=false">取消</button><button class="button primary" type="button" :disabled="!selectedAsset" @click="insertSelectedImage">插入文章</button></div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { MediaImage } from '~/extensions/MediaImage';
import type { TipTapDocument } from '~/types/article';
import type { MediaAssetDTO } from '~/composables/useMediaApi';

const props = defineProps<{ modelValue:TipTapDocument }>();
const emit = defineEmits<{ 'update:modelValue':[value:TipTapDocument] }>();
const editor = shallowRef<Editor|null>(null); const fileInput = ref<HTMLInputElement|null>(null);
const media = useMediaApi(); const toast = useToast();
const linkOpen = ref(false); const linkHref = ref(''); const savedSelection = ref({ from:0, to:0 });
const mediaOpen = ref(false); const mediaPending = ref(false); const uploading = ref(false);
const mediaAssets = ref<MediaAssetDTO[]>([]); const selectedAsset = ref<MediaAssetDTO|null>(null);
const imageAlt = ref(''); const imageCaption = ref('');

onMounted(() => { editor.value = new Editor({ extensions:[StarterKit.configure({ link:false }), Link.configure({ openOnClick:false }), MediaImage], content:props.modelValue, onUpdate:({ editor:current }) => emit('update:modelValue', current.getJSON() as TipTapDocument) }); });
const command = (type:string, level?:number) => { const chain = editor.value?.chain().focus(); if (!chain) return; if (type==='heading') chain.toggleHeading({ level:level as 2|3 }).run(); else if (type==='bold') chain.toggleBold().run(); else if (type==='italic') chain.toggleItalic().run(); else if (type==='quote') chain.toggleBlockquote().run(); else if (type==='bullet') chain.toggleBulletList().run(); else chain.toggleOrderedList().run(); };
const rememberSelection = () => { if (editor.value) savedSelection.value = { from:editor.value.state.selection.from, to:editor.value.state.selection.to }; };
const openLink = () => { if (!editor.value) return; if (editor.value.state.selection.empty) return toast.error('请先拖动鼠标选中需要添加链接的文字'); rememberSelection(); linkHref.value = String(editor.value.getAttributes('link').href || ''); linkOpen.value = true; };
const closeLink = () => { linkOpen.value = false; editor.value?.chain().focus().setTextSelection(savedSelection.value).run(); };
const applyLink = () => { editor.value?.chain().focus().setTextSelection(savedSelection.value).extendMarkRange('link').setLink({ href:linkHref.value.trim() }).run(); linkOpen.value = false; toast.success('网页链接已插入'); };
const openMedia = async () => { rememberSelection(); mediaOpen.value = true; selectedAsset.value = null; mediaPending.value = true; try { mediaAssets.value = await media.list(); } catch (error) { toast.error(getApiErrorMessage(error)); } finally { mediaPending.value = false; } };
const selectAsset = (asset:MediaAssetDTO) => { selectedAsset.value = asset; imageAlt.value = asset.filename; imageCaption.value = ''; };
const uploadImage = async (event:Event) => { const input=event.target as HTMLInputElement; const file=input.files?.[0]; if (!file) return; uploading.value=true; try { const asset=await media.uploadImage(file); mediaAssets.value.unshift(asset); selectAsset(asset); toast.success('图片已上传并选中'); } catch(error) { toast.error(getApiErrorMessage(error)); } finally { uploading.value=false; input.value=''; } };
const insertSelectedImage = () => { if (!selectedAsset.value) return; editor.value?.chain().focus().setTextSelection(savedSelection.value.from).setImage({ src:selectedAsset.value.url, alt:imageAlt.value, caption:imageCaption.value } as never).run(); mediaOpen.value=false; toast.success('图片已插入正文'); };
onBeforeUnmount(() => editor.value?.destroy());
</script>
