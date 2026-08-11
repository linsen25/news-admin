<template>
  <div class="rich-editor">
    <div v-if="editor" class="editor-toolbar">
      <button type="button" title="二级标题" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" title="三级标题" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <button type="button" title="加粗（Ctrl+B）" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" title="斜体（Ctrl+I）" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" title="引用" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">引用</button>
      <button type="button" title="项目列表" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">项目列表</button>
      <button type="button" title="编号列表" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">编号列表</button>
      <button type="button" title="添加或编辑链接" :class="{ active: editor.isActive('link') }" @click="setLink">链接</button>
      <button type="button" title="上传正文图片" :disabled="uploading" @click="fileInput?.click()">{{ uploading ? '上传中…' : '图片' }}</button>
      <input ref="fileInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" @change="uploadImage">
      <button type="button" title="撤销" :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()">撤销</button>
      <button type="button" title="重做" :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()">重做</button>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { MediaImage } from '~/extensions/MediaImage';
import type { TipTapDocument } from '~/types/article';

const props = defineProps<{ modelValue: TipTapDocument }>();
const emit = defineEmits<{ 'update:modelValue': [value: TipTapDocument] }>();
const editor = shallowRef<Editor | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const media = useMediaApi();
const toast = useToast();

onMounted(() => {
  editor.value = new Editor({
    extensions: [StarterKit.configure({ link: false }), Link.configure({ openOnClick: false }), MediaImage],
    content: props.modelValue,
    onUpdate: ({ editor: currentEditor }) => emit('update:modelValue', currentEditor.getJSON() as TipTapDocument),
  });
});
watch(() => props.modelValue, (value) => {
  if (editor.value && JSON.stringify(editor.value.getJSON()) !== JSON.stringify(value)) editor.value.commands.setContent(value);
}, { deep: true });

const setLink = () => {
  if (!editor.value) return;
  const previous = String(editor.value.getAttributes('link').href || 'https://');
  const href = window.prompt('请输入完整链接地址', previous);
  if (href === null) return;
  if (!href.trim()) editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
  else editor.value.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
};
const uploadImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !editor.value) return;
  const alt = window.prompt('图片替代文字（用于无障碍和搜索）', file.name) ?? '';
  const caption = window.prompt('图片说明（可留空）', '') ?? '';
  uploading.value = true;
  try {
    const asset = await media.uploadImage(file);
    editor.value.chain().focus().setImage({ src: asset.url, alt, caption } as never).run();
    toast.success('正文图片上传成功');
  } catch (exception) { toast.error(getApiErrorMessage(exception)); }
  finally { uploading.value = false; input.value = ''; }
};
onBeforeUnmount(() => editor.value?.destroy());
</script>
