<template>
  <div class="login-card">
    <div class="login-copy">
      <p class="eyebrow">NEWSROOM CMS</p>
      <h1>让好新闻<br>有序抵达。</h1>
      <p>统一管理写作、审核、修订和发布流程。</p>
    </div>
    <form class="login-form" @submit.prevent="submit">
      <h2>登录工作台</h2>
      <p class="muted">使用你的中加网后台账号登录</p>
      <label>邮箱<input v-model="email" type="email" autocomplete="username" required></label>
      <label>
        密码
        <span class="password-field">
          <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required>
          <button
            type="button"
            class="password-toggle"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            :title="showPassword ? '隐藏密码' : '显示密码'"
            @click="showPassword = !showPassword"
          >{{ showPassword ? '◉' : '◎' }}</button>
        </span>
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="button primary" type="submit" :disabled="submitting">
        {{ submitting ? '登录中…' : '登录' }}
      </button>
      <small>开发测试账号</small>
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
const showPassword = ref(false);
const submitting = ref(false);
const error = ref('');
const { login } = useAuth();
const toast = useToast();

const submit = async () => {
  submitting.value = true;
  error.value = '';
  try {
    await login(email.value, password.value);
    toast.success('登录成功');
    await navigateTo('/dashboard');
  } catch (exception) {
    error.value = getApiErrorMessage(exception);
    toast.error(error.value);
  } finally {
    submitting.value = false;
  }
};
</script>
