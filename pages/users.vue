<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">ACCOUNTS</p><h1>账号管理</h1></div>
      <span class="mock-label">Mock UI · 暂不支持修改</span>
    </div>
    <section class="users-grid">
      <article v-for="account in accounts" :key="account.id" class="panel user-card">
        <div class="avatar">{{ account.username.slice(0, 1) }}</div>
        <div>
          <h2>{{ account.username }}</h2>
          <p>{{ account.email }}</p>
          <span class="role-chip">{{ account.role.name }}</span>
        </div>
        <div class="permission-list">
          <strong>权限</strong>
          <span v-for="permission in account.permissions" :key="permission.key">{{ permission.description }}</span>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { components } from '~/types/generated/api';

definePageMeta({ middleware: ['auth', 'users-access'] });
type AccountDTO = components['schemas']['UserDto'];
const config = useRuntimeConfig();
const { authHeaders } = useAuth();
const { data: accounts } = await useAsyncData('accounts', () =>
  $fetch<AccountDTO[]>(`${config.public.apiBase}/users`, {
    headers: authHeaders(),
  }), { default: () => [] },
);
</script>
