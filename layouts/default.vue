<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <NuxtLink class="brand" to="/dashboard">Newsroom<span>CMS</span></NuxtLink>
      <nav>
        <NuxtLink to="/dashboard">概览</NuxtLink>
        <template v-if="hasPermission('articles.view.own')">
          <NuxtLink to="/articles">编辑修改</NuxtLink>
          <NuxtLink v-if="hasPermission('articles.create')" to="/articles/create">创建文章</NuxtLink>
          <NuxtLink v-if="hasPermission('articles.create')" to="/media">媒体库</NuxtLink>
        </template>
        <NuxtLink v-if="hasPermission('articles.review.view')" to="/review">审阅文章</NuxtLink>
        <NuxtLink v-if="hasPermission('users.view')" to="/users">账号管理</NuxtLink>
      </nav>
      <button class="link-button" @click="logout">退出登录</button>
    </aside>
    <main class="workspace">
      <header class="topbar">
        <span>编辑工作台</span>
        <span class="user-chip">{{ user?.name ?? 'Mock User' }} · {{ roleLabel }}</span>
      </header>
      <div class="page-wrap"><slot /></div>
    </main>
  </div>
  <ToastHost />
</template>

<script setup lang="ts">
const { user, logout, hasPermission } = useAuth();
const roleLabel = computed(() => ({
  Author: '作者',
  Reviewer: '审核员',
  Admin: '管理员',
}[user.value?.roleName ?? 'Author']));
</script>
