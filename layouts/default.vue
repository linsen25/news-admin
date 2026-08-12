<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <NuxtLink class="brand" to="/dashboard">Newsroom<span>CMS</span></NuxtLink>
      <nav>
        <NuxtLink to="/dashboard">概览</NuxtLink>
        <NuxtLink v-slot="{ href, navigate }" to="/articles" custom>
          <a :href="href" :class="{ 'sidebar-active': articlesActive }" @click="navigate">文章管理 <span v-if="!hasPermission('articles.create')" class="nav-lock">🔒</span></a>
        </NuxtLink>
        <NuxtLink v-if="hasPermission('articles.create')" to="/articles/create">创建文章</NuxtLink>
        <NuxtLink v-if="hasPermission('articles.view.own')" v-slot="{ href, navigate }" to="/articles?status=draft" custom>
          <a :href="href" :class="{ 'sidebar-active': draftsActive }" @click="navigate">草稿箱</a>
        </NuxtLink>
        <NuxtLink to="/review">审阅文章 <span v-if="!hasPermission('articles.review.decide')" class="nav-lock">🔒</span></NuxtLink>
        <NuxtLink to="/homepage">首页编排 <span v-if="!hasPermission('homepage.manage')" class="nav-lock">🔒</span></NuxtLink>
        <NuxtLink to="/media">媒体库 <span v-if="!hasPermission('media.upload')" class="nav-lock">🔒</span></NuxtLink>
        <NuxtLink to="/users">账号管理 <span v-if="!hasPermission('users.permissions.manage')" class="nav-lock">🔒</span></NuxtLink>
        <NuxtLink to="/tags">分类与标签 <span v-if="!hasPermission('users.permissions.manage')" class="nav-lock">🔒</span></NuxtLink>
      </nav>
      <button class="link-button" @click="logout">退出登录</button>
    </aside>
    <main class="workspace">
      <header class="topbar">
        <span>编辑工作台</span>
        <span class="user-chip">{{ user?.name ?? 'User' }} · {{ roleLabel }}</span>
      </header>
      <div class="page-wrap"><slot /></div>
    </main>
  </div>
  <ToastHost />
  <PermissionNoticeModal />
</template>

<script setup lang="ts">
const { user, logout, hasPermission } = useAuth();
const route = useRoute();
const draftsActive = computed(() => route.path === '/articles' && route.query.status === 'draft');
const articlesActive = computed(() =>
  (route.path === '/articles' && route.query.status !== 'draft') || route.path.startsWith('/articles/edit/'),
);
const roleNames = { Author: '作者', Reviewer: '审核员', Admin: '管理员' } as const;
const roleLabel = computed(() => user.value?.roles?.map((role) => roleNames[role.name]).join(' / ') || '请重新登录');
</script>
