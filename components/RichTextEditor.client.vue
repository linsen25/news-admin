<template>
  <div class="rich-editor">
    <div v-if="editor" class="editor-toolbar">
      <button type="button" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <button type="button" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">引用</button>
      <button type="button" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">项目列表</button>
      <button type="button" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">编号列表</button>
      <button type="button" @click="setLink">链接</button>
      <button type="button" :disabled="uploading" @click="fileInput?.click()">
        {{ uploading ? '上传中…' : '图片' }}
      </button>
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        @change="uploadImage"
      />
      <button type="button" :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()">撤销</button>
      <button type="button" :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()">重做</button>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import type { TipTapDocument } from '~/types/article';
import { MediaImage } from '~/extensions/MediaImage';

const props = defineProps<{ modelValue: TipTapDocument }>();
const emit = defineEmits<{ 'update:modelValue': [value: TipTapDocument] }>();
const editor = shallowRef<Editor | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const media = useMediaApi();
const { success, error: showError } = useToast();

onMounted(() => {
  editor.value = new Editor({
    extensions: [StarterKit, MediaImage],
    content: props.modelValue,
    onUpdate: ({ editor: currentEditor }) => {
      emit('update:modelValue', currentEditor.getJSON() as TipTapDocument);
    },
  });
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return;
    const current = JSON.stringify(editor.value.getJSON());
    if (current !== JSON.stringify(value)) editor.value.commands.setContent(value);
  },
  { deep: true },
);

const setLink = () => {
  if (!editor.value) return;
  const previous = editor.value.getAttributes('link').href as string | undefined;
  const href = window.prompt('输入链接地址', previous ?? 'https://');
  if (href === null) return;
  if (!href) {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href }).run();
};

const uploadImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !editor.value) return;
  const alt = window.prompt('图片替代文字（用于无障碍和 SEO）', file.name) ?? '';
  const caption = window.prompt('图片说明（可留空）', '') ?? '';
  uploading.value = true;
  try {
    const asset = await media.uploadImage(file);
    editor.value
      .chain()
      .focus()
      .setImage({ src: asset.url, alt, caption } as never)
      .run();
    success('图片上传成功');
  } catch (exception) {
    showError(getApiErrorMessage(exception));
  } finally {
    uploading.value = false;
    input.value = '';
  }
};

onBeforeUnmount(() => editor.value?.destroy());
</script>
