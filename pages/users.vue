<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">ACCOUNTS</p><h1>账号管理</h1></div>
      <span v-if="!canManage" class="readonly-label">🔒 只读模式</span>
    </div>
    <section class="users-grid">
      <article v-for="account in accounts" :key="account.id" class="panel user-card">
        <div class="avatar">{{ account.username.slice(0, 1) }}</div>
        <div class="user-identity"><h2>{{ account.username }}</h2><p>{{ account.email }}</p></div>
        <fieldset class="role-selector" :disabled="!canManage || saving === account.id">
          <legend>角色（可多选）</legend>
          <label v-for="role in roles" :key="role.id">
            <input type="checkbox" :checked="selectedRoles[account.id]?.includes(role.id)" @change="toggleRole(account.id, role.id)">
            <span>{{ roleLabels[role.name] || role.name }}</span>
          </label>
        </fieldset>
        <div class="permission-list">
          <strong>合并后的权限</strong>
          <span v-for="permission in permissionsFor(account.id)" :key="permission.key">{{ permission.description }}</span>
        </div>
        <button class="button primary" type="button" :disabled="!canManage || saving === account.id || !selectedRoles[account.id]?.length" :title="canManage ? '' : '你没有管理用户角色的权限'" @click="saveRoles(account.id)">
          {{ saving === account.id ? '保存中…' : canManage ? '保存角色' : '🔒 仅管理员可修改' }}
        </button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { components } from '~/types/generated/api';

definePageMeta({ middleware: ['auth'] });
type AccountDTO = components['schemas']['UserDto'];
type RoleDTO = components['schemas']['RoleDto'];
const config = useRuntimeConfig();
const { authHeaders, hasPermission } = useAuth();
const toast = useToast();
const canManage = computed(() => hasPermission('users.permissions.manage'));
const saving = ref('');
const selectedRoles = reactive<Record<string, string[]>>({});
const roleLabels: Record<string, string> = { Author: '作者', Reviewer: '审核员', Admin: '管理员' };

const [{ data: accounts, refresh }, { data: roles }] = await Promise.all([
  useAsyncData('accounts', () => $fetch<AccountDTO[]>(`${config.public.apiBase}/users`, { headers: authHeaders() }), { default: () => [] }),
  useAsyncData('account-roles', () => $fetch<RoleDTO[]>(`${config.public.apiBase}/users/roles`, { headers: authHeaders() }), { default: () => [] }),
]);

watchEffect(() => {
  for (const account of accounts.value) {
    if (!selectedRoles[account.id]) selectedRoles[account.id] = account.roles.map((role) => role.id);
  }
});
const toggleRole = (userId: string, roleId: string) => {
  const current = selectedRoles[userId] || [];
  selectedRoles[userId] = current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId];
};
const permissionsFor = (userId: string) => Array.from(new Map(
  roles.value.filter((role) => (selectedRoles[userId] || []).includes(role.id)).flatMap((role) => role.permissions)
    .map((permission) => [permission.key, permission]),
).values());
const saveRoles = async (userId: string) => {
  saving.value = userId;
  try {
    await $fetch(`${config.public.apiBase}/users/${userId}/roles`, { method: 'PUT', headers: authHeaders(), body: { roleIds: selectedRoles[userId] } });
    toast.success('用户角色已更新');
    await refresh();
  } catch (exception) { toast.error(getApiErrorMessage(exception)); }
  finally { saving.value = ''; }
};
</script>
