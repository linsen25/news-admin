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
      <div class="taxonomy-heading"><div><p class="eyebrow">CATEGORIES</p><h2>分类管理</h2></div><span>一级新闻栏目</span></div>
      <form v-if="canManage" class="taxonomy-form category-form" @submit.prevent="saveCategory">
        <label>分类名称<input v-model="categoryDraft.name" required maxlength="50" placeholder="例如：加拿大"></label>
        <div class="tag-form-actions"><button class="button primary" :disabled="categorySaving">{{ categorySaving ? '保存中…' : categoryEditingId ? '保存修改' : '新增分类' }}</button><button v-if="categoryEditingId" class="button secondary" type="button" @click="resetCategory">取消</button></div>
        <details class="slug-setting"><summary>自定义网址标识（可选）</summary><label>网址标识<input v-model="categoryDraft.slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="留空将自动生成"></label><small>一般不需要填写；只在需要固定英文网址时设置。</small></details>
      </form>
      <button v-else class="button primary locked-action" type="button" @click="locked('新增分类')">🔒 新增分类</button>

      <div class="category-tree">
        <article v-for="category in categories" :key="category.id" class="category-row">
          <div><strong>{{ category.name }}</strong><small>新闻分类</small></div>
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
        <label>所属分类<span class="select-control"><select v-model="tagDraft.categoryId" required><option disabled value="">请选择分类</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></span></label>
        <div class="tag-form-actions"><button class="button primary" :disabled="tagSaving">{{ tagSaving ? '保存中…' : tagEditingId ? '保存修改' : '新增标签' }}</button><button v-if="tagEditingId" class="button secondary" type="button" @click="resetTag">取消</button></div>
        <details class="slug-setting"><summary>自定义网址标识（可选）</summary><label>网址标识<input v-model="tagDraft.slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="留空将自动生成"></label><small>一般不需要填写；系统会自动生成唯一标识。</small></details>
      </form>
      <button v-else class="button primary locked-action" type="button" @click="locked('新增标签')">🔒 新增标签</button>

      <div class="tag-table">
        <div class="tag-table-head"><span>标签名称</span><span>所属分类 / 网址标识</span><span>操作</span></div>
        <div v-for="tag in tags" :key="tag.id" class="tag-table-row"><strong>{{ tag.name }}</strong><span class="tag-category"><b>{{ categoryName(tag.categoryId) }}</b><code>{{ tag.slug }}</code></span><div class="row-actions"><button type="button" @click="editTag(tag)">{{ canManage ? '编辑' : '🔒 编辑' }}</button><button class="reject" type="button" @click="removeTag(tag)">{{ canManage ? '删除' : '🔒 删除' }}</button></div></div>
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
const categoryDraft = reactive({ name: '', slug: '' });
const tagEditingId = ref(''); const tagSaving = ref(false);
const tagDraft = reactive({ name: '', slug: '', categoryId: '' });
const locked = (action: string) => permissionNotice.open(action, '分类与标签管理权限（管理员）');
const autoSlug = (name: string, prefix: string) => {
  const latin = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return latin || `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
};
const resetCategory = () => { categoryEditingId.value = ''; Object.assign(categoryDraft, { name: '', slug: '' }); };
const editCategory = (item: CatalogItem) => { if (!canManage.value) return locked('编辑分类'); categoryEditingId.value = item.id; Object.assign(categoryDraft, { name: item.name, slug: item.slug }); };
const saveCategory = async () => { categorySaving.value = true; try { const input = { name: categoryDraft.name.trim(), slug: categoryDraft.slug.trim().toLowerCase() || autoSlug(categoryDraft.name, 'category'), parentId: null }; if (categoryEditingId.value) await api.updateCategory(categoryEditingId.value, input); else await api.createCategory(input); toast.success(categoryEditingId.value ? '分类修改成功' : '分类创建成功'); resetCategory(); await refreshCategories(); } catch (error) { toast.error(getApiErrorMessage(error)); } finally { categorySaving.value = false; } };
const removeCategory = async (item: CatalogItem) => { if (!canManage.value) return locked('删除分类'); if (!window.confirm(`确定删除分类“${item.name}”吗？存在文章引用时将无法删除。`)) return; try { await api.deleteCategory(item.id); toast.success('分类已删除'); await refreshCategories(); } catch (error) { toast.error(getApiErrorMessage(error)); } };

const categoryName = (id?: string | null) => categories.value.find((category) => category.id === id)?.name || '尚未归类';
const resetTag = () => { tagEditingId.value = ''; Object.assign(tagDraft, { name: '', slug: '', categoryId: categories.value[0]?.id || '' }); };
const editTag = (item: CatalogItem) => { if (!canManage.value) return locked('编辑标签'); tagEditingId.value = item.id; Object.assign(tagDraft, { name: item.name, slug: item.slug, categoryId: item.categoryId || '' }); };
const saveTag = async () => { tagSaving.value = true; try { const input = { name: tagDraft.name.trim(), slug: tagDraft.slug.trim().toLowerCase() || autoSlug(tagDraft.name, 'tag'), categoryId: tagDraft.categoryId }; if (tagEditingId.value) await api.updateTag(tagEditingId.value, input); else await api.createTag(input); toast.success(tagEditingId.value ? '标签修改成功' : '标签创建成功'); resetTag(); await refreshTags(); } catch (error) { toast.error(getApiErrorMessage(error)); } finally { tagSaving.value = false; } };
const removeTag = async (item: CatalogItem) => { if (!canManage.value) return locked('删除标签'); if (!window.confirm(`确定删除标签“${item.name}”吗？`)) return; try { await api.deleteTag(item.id); toast.success('标签已删除'); await refreshTags(); } catch (error) { toast.error(getApiErrorMessage(error)); } };
watchEffect(() => { if (!tagDraft.categoryId && categories.value[0]) tagDraft.categoryId = categories.value[0].id; });
</script>
