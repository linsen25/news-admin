<template>
  <div v-if="state.visible" class="modal-backdrop" @click.self="close">
    <section class="modal-card permission-notice-modal" role="dialog" aria-modal="true" aria-labelledby="permission-notice-title">
      <div class="permission-notice-icon">🔒</div>
      <p class="eyebrow">PERMISSION REQUIRED</p>
      <h2 id="permission-notice-title">当前账号无权执行此操作</h2>
      <p class="muted">你可以查看此模块，但不能{{ state.action }}。</p>
      <div class="permission-notice-detail">
        <span>需要权限</span>
        <strong>{{ state.requirement }}</strong>
      </div>
      <button class="button primary" type="button" @click="close">我知道了</button>
    </section>
  </div>
</template>

<script setup lang="ts">
const { state, close } = usePermissionNotice();
</script>
