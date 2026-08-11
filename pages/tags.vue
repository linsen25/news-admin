<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">TAXONOMY</p><h1>分类与标签</h1></div>
      <span v-if="!canManage" class="readonly-label">🔒 只读模式</span>
    </div>

    <section class="taxonomy-intro">
      <p><strong>分类</strong>用于组织新闻栏目，一篇文章选择一个分类；<strong>标签</strong>用于描述文章主题，一篇文章可以选择多个标签。</p>
    </section>

    <section class="panel taxonomy-section">
      <div class="taxonomy-heading"><div><p class="eyebrow">CATEGORIES</p><h2>分类管理</h2></div><span>支持父分类与子分类</span></div>
      <form v-if="canManage" class="taxonomy-form category-form" @submit.prevent="saveCategory">
        <label>分类名称<input v-model="categoryDraft.name" required maxlength="50" placeholder="例如：加拿大"></label>
        <label>网址标识<input v-model="categoryDraft.slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="例如：canada"></label>
        <label>上级分类
          <span class="select-control"><select v-model="categoryDraft.parentId"><option value="">无（作为一级分类）</option><option v-for="item in availableParents" :key="item.id" :value="item.id">{{ item.name }}</option></select></span>
        </label>
        <div class="tag-form-actions"><button class="button primary" :disabled="categorySaving">{{ categorySaving ? '保存中…' : categoryEditingId ? '保存修改' : '新增分类' }}</button><button v-if="categoryEditingId" class="button secondary" type="button" @click="resetCategory">取消</button></div>
      </form>
      <button v-else class="button primary locked-action" type="button" @click="locked('新增分类')">🔒 新增分类</button>

      <div class="category-tree">
        <article v-for="category in categoryTree" :key="category.id" class="category-row" :class="{ child: category.depth > 0 }">
          <div><span v-if="category.depth" class="tree-branch">└</span><strong>{{ category.name }}</strong><small>{{ category.depth ? `子分类 · 上级：${category.parentName}` : '一级分类' }}</small></div>
          <code>{{ category.slug }}</code>
          <div class="row-actions"><button type="button" @click="editCategory(category)">{{ canManage ? '编辑' : '🔒 编辑' }}</button><button class="reject" type="button" @click="removeCategory(category)">{{ canManage ? '删除' : '🔒 删除' }}</button></div>
        </article>
        <p v-if="!categories.length" class="empty-state">暂无分类。</p>
      </div>
    </section>

    <section class="panel taxonomy-section">
      <div class="taxonomy-heading"><div><p class="eyebrow">TAGS</p><h2>标签管理</h2></div><span>独立标签，不从属于分类</span></div>
      <form v-if="canManage" class="taxonomy-form tag-form" @submit.prevent="saveTag">
        <label>标签名称<input v-model="tagDraft.name" required maxlength="50" placeholder="例如：加拿大经济"></label>
        <label>网址标识<input v-model="tagDraft.slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="例如：canada-economy"></label>
        <div class="tag-form-actions"><button class="button primary" :disabled="tagSaving">{{ tagSaving ? '保存中…' : tagEditingId ? '保存修改' : '新增标签' }}</button><button v-if="tagEditingId" class="button secondary" type="button" @click="resetTag">取消</button></div>
      </form>
      <button v-else class="button primary locked-action" type="button" @click="locked('新增标签')">🔒 新增标签</button>

      <div class="tag-table">
        <div class="tag-table-head"><span>标签名称</span><span>网址标识</span><span>操作</span></div>
        <div v-for="tag in tags" :key="tag.id" class="tag-table-row"><strong>{{ tag.name }}</strong><code>{{ tag.slug }}</code><div class="row-actions"><button type="button" @click="editTag(tag)">{{ canManage ? '编辑' : '🔒 编辑' }}</button><button class="reject" type="button" @click="removeTag(tag)">{{ canManage ? '删除' : '🔒 删除' }}</button></div></div>
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
const permissionNotice = usePermissionNotice();
const canManage = computed(() => hasPermission('users.permissions.manage'));
const { data: categories, refresh: refreshCategories } = await useAsyncData('managed-categories', api.categories, { default: () => [] });
const { data: tags, refresh: refreshTags } = await useAsyncData('managed-tags', api.tags, { default: () => [] });

const categoryEditingId = ref(''); const categorySaving = ref(false);
const categoryDraft = reactive({ name: '', slug: '', parentId: '' });
const tagEditingId = ref(''); const tagSaving = ref(false);
const tagDraft = reactive({ name: '', slug: '' });
const locked = (action: string) => permissionNotice.open(action, '分类与标签管理权限（管理员）');
const availableParents = computed(() => categories.value.filter((item) => !item.parentId && item.id !== categoryEditingId.value));
const categoryTree = computed(() => {
  const roots = categories.value.filter((item) => !item.parentId);
  const rows: Array<CatalogItem & { depth: number; parentName: string }> = [];
  for (const root of roots) {
    rows.push({ ...root, depth: 0, parentName: '' });
    for (const child of categories.value.filter((item) => item.parentId === root.id)) rows.push({ ...child, depth: 1, parentName: root.name });
  }
  for (const orphan of categories.value.filter((item) => item.parentId && !categories.value.some((parent) => parent.id === item.parentId))) rows.push({ ...orphan, depth: 0, parentName: '' });
  return rows;
});
const resetCategory = () => { categoryEditingId.value = ''; Object.assign(categoryDraft, { name: '', slug: '', parentId: '' }); };
const editCategory = (item: CatalogItem) => { if (!canManage.value) return locked('编辑分类'); categoryEditingId.value = item.id; Object.assign(categoryDraft, { name: item.name, slug: item.slug, parentId: item.parentId || '' }); };
const saveCategory = async () => { categorySaving.value = true; try { const input = { name: categoryDraft.name.trim(), slug: categoryDraft.slug.trim().toLowerCase(), parentId: categoryDraft.parentId || null }; if (categoryEditingId.value) await api.updateCategory(categoryEditingId.value, input); else await api.createCategory(input); toast.success(categoryEditingId.value ? '分类修改成功' : '分类创建成功'); resetCategory(); await refreshCategories(); } catch (error) { toast.error(getApiErrorMessage(error)); } finally { categorySaving.value = false; } };
const removeCategory = async (item: CatalogItem) => { if (!canManage.value) return locked('删除分类'); if (!window.confirm(`确定删除分类“${item.name}”吗？存在子分类或文章引用时将无法删除。`)) return; try { await api.deleteCategory(item.id); toast.success('分类已删除'); await refreshCategories(); } catch (error) { toast.error(getApiErrorMessage(error)); } };

const resetTag = () => { tagEditingId.value = ''; Object.assign(tagDraft, { name: '', slug: '' }); };
const editTag = (item: CatalogItem) => { if (!canManage.value) return locked('编辑标签'); tagEditingId.value = item.id; Object.assign(tagDraft, { name: item.name, slug: item.slug }); };
const saveTag = async () => { tagSaving.value = true; try { const input = { name: tagDraft.name.trim(), slug: tagDraft.slug.trim().toLowerCase() }; if (tagEditingId.value) await api.updateTag(tagEditingId.value, input); else await api.createTag(input); toast.success(tagEditingId.value ? '标签修改成功' : '标签创建成功'); resetTag(); await refreshTags(); } catch (error) { toast.error(getApiErrorMessage(error)); } finally { tagSaving.value = false; } };
const removeTag = async (item: CatalogItem) => { if (!canManage.value) return locked('删除标签'); if (!window.confirm(`确定删除标签“${item.name}”吗？`)) return; try { await api.deleteTag(item.id); toast.success('标签已删除'); await refreshTags(); } catch (error) { toast.error(getApiErrorMessage(error)); } };
</script>
