<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">ACCOUNTS</p><h1>账号管理</h1></div>
      <span v-if="!canManage" class="readonly-label">🔒 只读模式</span>
    </div>
    <section v-if="accountsError || rolesError" class="panel data-error">
      <strong>账号数据加载失败</strong>
      <p>{{ getApiErrorMessage(accountsError || rolesError) }}</p>
      <button class="button secondary" type="button" @click="reloadAccounts">重新加载</button>
    </section>
    <section class="users-grid">
      <article v-for="account in accounts" :key="account.id" class="panel user-card">
        <header class="user-card-head">
          <div class="avatar">{{ account.username.slice(0, 1) }}</div>
          <div><h2>{{ account.username }}</h2><p>{{ account.email }}</p></div>
        </header>
        <fieldset class="role-selector" :disabled="!canManage || saving === account.id">
          <legend>分配角色（可多选）</legend>
          <label v-for="role in roles" :key="role.id" class="role-option" :class="{ selected: selectedRoles[account.id]?.includes(role.id) }">
            <input type="checkbox" :checked="selectedRoles[account.id]?.includes(role.id)" @change="toggleRole(account.id, role.id)">
            <span class="role-check">✓</span>
            <span><strong>{{ roleMeta[role.name]?.label || role.name }}</strong><small>{{ roleMeta[role.name]?.description }}</small></span>
          </label>
        </fieldset>
        <details class="permission-details">
          <summary>查看合并后的权限（{{ permissionsFor(account.id).length }}）</summary>
          <div class="permission-list"><span v-for="permission in permissionsFor(account.id)" :key="permission.key">{{ permission.description }}</span></div>
        </details>
        <button class="button primary" type="button" :disabled="saving === account.id || !selectedRoles[account.id]?.length" @click="openConfirmation(account)">
          {{ canManage ? '保存角色设置' : '🔒 仅管理员可修改' }}
        </button>
      </article>
    </section>

    <div v-if="confirmTarget" class="modal-backdrop" @click.self="closeConfirmation">
      <form class="modal-card role-confirm-modal" @submit.prevent="confirmSave">
        <p class="eyebrow">SECURITY CONFIRMATION</p>
        <h2>确认修改角色</h2>
        <p class="muted">你正在修改“{{ confirmTarget.username }}”的角色。请输入当前登录管理员的账号和密码确认操作。</p>
        <label>管理员邮箱<input v-model="credentials.email" type="email" autocomplete="username" required></label>
        <label>管理员密码
          <span class="password-field">
            <input v-model="credentials.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required minlength="6">
            <button type="button" class="password-toggle" :title="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">{{ showPassword ? '◉' : '◎' }}</button>
          </span>
        </label>
        <div class="confirmation-summary">
          <span>将分配角色</span>
          <strong>{{ selectedRoleLabels(confirmTarget.id) }}</strong>
        </div>
        <div class="modal-actions">
          <button class="button secondary" type="button" :disabled="saving === confirmTarget.id" @click="closeConfirmation">取消</button>
          <button class="button primary" type="submit" :disabled="saving === confirmTarget.id">{{ saving === confirmTarget.id ? '验证并保存中…' : '确认保存' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { components } from '~/types/generated/api';
definePageMeta({ middleware: ['auth'] });
type AccountDTO = components['schemas']['UserDto'];
type RoleDTO = components['schemas']['RoleDto'];
const config = useRuntimeConfig();
const { user, authHeaders, hasPermission } = useAuth();
const toast = useToast();
const permissionNotice = usePermissionNotice();
const canManage = computed(() => hasPermission('users.permissions.manage'));
const saving = ref('');
const confirmTarget = ref<AccountDTO | null>(null);
const showPassword = ref(false);
const credentials = reactive({ email: '', password: '' });
const selectedRoles = reactive<Record<string, string[]>>({});
const roleMeta: Record<string, { label: string; description: string }> = {
  Author: { label: '作者', description: '创建、编辑并提交自己的文章' },
  Reviewer: { label: '审核员', description: '查看、通过或退回待审文章' },
  Admin: { label: '管理员', description: '管理发布、账号、角色与系统设置' },
};
const [{ data: accounts, error: accountsError, refresh: refreshAccounts }, { data: roles, error: rolesError, refresh: refreshRoles }] = await Promise.all([
  useAsyncData('accounts', () => $fetch<AccountDTO[]>(`${config.public.apiBase}/users`, { headers: authHeaders() }), { default: () => [] }),
  useAsyncData('account-roles', () => $fetch<RoleDTO[]>(`${config.public.apiBase}/users/roles`, { headers: authHeaders() }), { default: () => [] }),
]);
const reloadAccounts = async () => { await Promise.all([refreshAccounts(), refreshRoles()]); };
watchEffect(() => { for (const account of accounts.value) if (!selectedRoles[account.id]) selectedRoles[account.id] = account.roles.map((role) => role.id); });
const toggleRole = (userId: string, roleId: string) => { const current = selectedRoles[userId] || []; selectedRoles[userId] = current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]; };
const permissionsFor = (userId: string) => Array.from(new Map(roles.value.filter((role) => (selectedRoles[userId] || []).includes(role.id)).flatMap((role) => role.permissions).map((permission) => [permission.key, permission])).values());
const selectedRoleLabels = (userId: string) => roles.value.filter((role) => (selectedRoles[userId] || []).includes(role.id)).map((role) => roleMeta[role.name]?.label || role.name).join('、');
const openConfirmation = (account: AccountDTO) => {
  if (!canManage.value) return permissionNotice.open('修改账号角色和权限', '账号及权限管理权限（管理员）');
  confirmTarget.value = account; credentials.email = user.value?.email || ''; credentials.password = ''; showPassword.value = false;
};
const closeConfirmation = () => { if (saving.value) return; confirmTarget.value = null; credentials.password = ''; };
const confirmSave = async () => {
  if (!confirmTarget.value) return;
  const target = confirmTarget.value;
  saving.value = target.id;
  try {
    await $fetch(`${config.public.apiBase}/users/${target.id}/roles`, { method: 'PUT', headers: authHeaders(), body: { roleIds: selectedRoles[target.id], email: credentials.email, password: credentials.password } });
    toast.success('用户角色已更新'); confirmTarget.value = null; credentials.password = ''; await refreshAccounts();
  } catch (exception) { toast.error(getApiErrorMessage(exception)); }
  finally { saving.value = ''; }
};
</script>
