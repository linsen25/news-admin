<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">TAXONOMY</p><h1>标签管理</h1></div>
      <span v-if="!canManage" class="readonly-label">🔒 只读模式</span>
    </div>
    <section class="panel tag-manager">
      <form v-if="canManage" class="tag-form" @submit.prevent="save">
        <label>标签名称<input v-model="draft.name" required maxlength="50" placeholder="例如：加拿大经济"></label>
        <label>
          网址标识
          <input v-model="draft.slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="例如：canada-policy">
          <small class="field-help">用于生成筛选网址，请填写小写英文或拼音；多个单词用短横线连接。</small>
        </label>
        <div class="tag-form-actions">
          <button class="button primary" type="submit" :disabled="saving">{{ saving ? '保存中…' : editingId ? '保存修改' : '新增标签' }}</button>
          <button v-if="editingId" class="button secondary" type="button" @click="reset">取消</button>
        </div>
      </form>
      <button v-else class="button primary" type="button" @click="permissionNotice.open('新增标签', '标签管理权限（管理员）')">🔒 新增标签</button>
      <div class="tag-table">
        <div class="tag-table-head"><span>标签名称</span><span>网址标识</span><span>操作</span></div>
        <div v-for="tag in tags" :key="tag.id" class="tag-table-row">
          <strong>{{ tag.name }}</strong><code>{{ tag.slug }}</code>
          <div class="row-actions">
            <button type="button" @click="edit(tag)">{{ canManage ? '编辑' : '🔒 编辑' }}</button>
            <button class="reject" type="button" @click="remove(tag)">{{ canManage ? '删除' : '🔒 删除' }}</button>
          </div>
        </div>
        <p v-if="!tags.length" class="empty-state">暂无标签。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CatalogItem } from '~/composables/useCatalogApi';
definePageMeta({ middleware: ['auth'] });
const api = useCatalogApi();
const toast = useToast();
const { hasPermission } = useAuth();
const canManage = computed(() => hasPermission('users.permissions.manage'));
const permissionNotice = usePermissionNotice();
const editingId = ref('');
const saving = ref(false);
const draft = reactive({ name: '', slug: '' });
const { data: tags, refresh } = await useAsyncData('managed-tags', api.tags, { default: () => [] });
const reset = () => { editingId.value = ''; draft.name = ''; draft.slug = ''; };
const edit = (tag: CatalogItem) => {
  if (!canManage.value) return permissionNotice.open('编辑标签', '标签管理权限（管理员）');
  editingId.value = tag.id; draft.name = tag.name; draft.slug = tag.slug;
};
const save = async () => {
  saving.value = true;
  try {
    const input = { name: draft.name.trim(), slug: draft.slug.trim().toLowerCase() };
    if (editingId.value) await api.updateTag(editingId.value, input); else await api.createTag(input);
    toast.success(editingId.value ? '标签修改成功' : '标签创建成功'); reset(); await refresh();
  } catch (error) { toast.error(getApiErrorMessage(error)); } finally { saving.value = false; }
};
const remove = async (tag: CatalogItem) => {
  if (!canManage.value) return permissionNotice.open('删除标签', '标签管理权限（管理员）');
  if (!window.confirm(`确定删除标签“${tag.name}”吗？`)) return;
  try { await api.deleteTag(tag.id); toast.success('标签已删除'); await refresh(); }
  catch (error) { toast.error(getApiErrorMessage(error)); }
};
</script>
