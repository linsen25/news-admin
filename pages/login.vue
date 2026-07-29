<template>
  <div class="login-card">
    <div class="login-copy">
      <p class="eyebrow">NEWSROOM CMS</p>
      <h1>让好新闻<br />有序抵达。</h1>
      <p>统一管理写作、审核、修订和发布流程。</p>
    </div>
    <form class="login-form" @submit.prevent="submit">
      <h2>登录工作台</h2>
      <p class="muted">第一阶段使用 Mock 账号</p>
      <label>邮箱<input v-model="email" type="email" required /></label>
      <label>密码<input v-model="password" type="password" required /></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="button primary" type="submit">登录</button>
      <small>作者 / 审核员 / 管理员测试账号见页面下方</small>
      <div class="mock-accounts">
        <code>author@example.com</code>
        <code>reviewer@example.com</code>
        <code>admin@example.com</code>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });
const email = ref('author@example.com');
const password = ref('123456');
const error = ref('');
const { login } = useAuth();
const { success, error: showError } = useToast();

const submit = async () => {
  try {
    await login(email.value, password.value);
    success('登录成功');
    await navigateTo('/dashboard');
  } catch (exception) {
    error.value = getApiErrorMessage(exception);
    if (exception instanceof Error && exception.message === 'Mock 账号不存在') {
      error.value = exception.message;
    }
    showError(error.value);
  }
};
</script>
