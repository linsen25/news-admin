<template>
  <div>
    <div class="page-heading">
      <div><p class="eyebrow">REVIEW CENTER</p><h1>审核中心</h1></div>
    </div>
    <section class="panel">
      <div class="article-table review-table">
        <div class="table-head"><span>文章 / 作者</span><span>状态</span><span>创建时间</span><span>操作</span></div>
        <div v-for="article in reviewArticles" :key="article.id" class="table-row">
          <div>
            <strong>{{ article.title }}</strong>
            <small>署名：{{ article.byline }} · 录入：{{ article.author.name }}</small>
          </div>
          <StatusBadge :status="article.status" />
          <span>{{ new Date(article.createdAt).toLocaleDateString('zh-CN') }}</span>
          <div class="row-actions">
            <button @click="openPreview(article.id)">预览</button>
            <button @click="showHistory(article.id, article.title)">历史</button>
            <button v-if="article.status === 'review'" class="approve" @click="requestApprove(article.id)">{{ hasPermission('articles.review.decide') ? '通过' : '🔒 通过' }}</button>
            <button v-if="['review', 'approved'].includes(article.status)" class="reject" @click="requestReject(article.id, article.title)">{{ hasPermission('articles.review.decide') ? '退回' : '🔒 退回' }}</button>
            <button v-if="article.status === 'approved'" class="publish-small" @click="requestPublish(article.id)">{{ hasPermission('articles.publish') ? '发布' : '🔒 发布' }}</button>
          </div>
        </div>
        <p v-if="!reviewArticles.length" class="empty-state">当前没有待处理文章。</p>
        <div v-if="pageData.total > pageData.limit" class="pagination">
          <button class="button secondary" type="button" :disabled="page <= 1" @click="page--">上一页</button>
          <span>第 {{ pageData.page }} / {{ totalPages }} 页，共 {{ pageData.total }} 篇待处理</span>
          <button class="button secondary" type="button" :disabled="page >= totalPages" @click="page++">下一页</button>
        </div>
      </div>
    </section>

    <div v-if="rejectTarget" class="modal-backdrop" @click.self="closeReject">
      <form class="modal-card" @submit.prevent="confirmReject">
        <p class="eyebrow">REJECT ARTICLE</p>
        <h2>退回《{{ rejectTarget.title }}》</h2>
        <p class="muted">退回后作者可以根据意见修改并再次提交。</p>
        <label>退回原因
          <textarea v-model="rejectComment" rows="5" required minlength="2" placeholder="例如：图片版权不明确，请补充来源。" />
        </label>
        <div class="modal-actions">
          <button class="button secondary" type="button" @click="closeReject">取消</button>
          <button class="button danger" type="submit" :disabled="busy">确认退回</button>
        </div>
      </form>
    </div>

    <div v-if="historyTarget" class="modal-backdrop" @click.self="historyTarget = null">
      <section class="modal-card history-modal">
        <div class="section-title">
          <div><p class="eyebrow">REVIEW HISTORY</p><h2>{{ historyTarget.title }}</h2></div>
          <button class="modal-close" @click="historyTarget = null">×</button>
        </div>
        <p class="history-explanation">这里记录文章每一次提交审核、退回、再次提交、审核通过和发布的完整过程。作者修改后重新提交时，之前的退回原因和审核记录仍会保留。</p>
        <h3>审核意见</h3>
        <div v-if="historyTarget.data.reviewComments.length" class="timeline">
          <article v-for="comment in historyTarget.data.reviewComments" :key="comment.id">
            <strong>{{ comment.reviewer.name }}</strong>
            <time>{{ formatTime(comment.createdAt) }}</time>
            <p>{{ comment.content }}</p>
          </article>
        </div>
        <p v-else class="muted">暂无退回意见。</p>
        <h3>操作日志</h3>
        <p class="muted">连续保存或修改会合并显示；提交、退回、通过和发布等关键节点始终单独保留。</p>
        <div class="timeline">
          <article v-for="log in simplifiedAuditLogs" :key="log.id">
            <strong>{{ log.user.name }}</strong>
            <time>{{ formatTime(log.createdAt) }}</time>
            <p>{{ log.description }}</p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });
const { hasPermission } = useAuth();
const { listPage, approve, reject, publish, history, createPreviewToken } = useArticlesApi();
const { success, error } = useToast();
const permissionNotice = usePermissionNotice();
const config = useRuntimeConfig();
const page = ref(1);
const { data: pageData, refresh } = await useAsyncData('review-articles', () => listPage({ reviewQueue:true,page:page.value,limit:20 }), { default: () => ({ items:[],total:0,page:1,limit:20 }), watch:[page] });
const reviewArticles = computed(() => pageData.value.items);
const totalPages = computed(() => Math.max(1, Math.ceil(pageData.value.total / pageData.value.limit)));
const busy = ref(false);
const rejectTarget = ref<{ id: string; title: string } | null>(null);
const rejectComment = ref('');
const historyTarget = ref<{
  title: string;
  data: Awaited<ReturnType<typeof history>>;
} | null>(null);
const simplifiedAuditLogs = computed(() => {
  const logs = historyTarget.value?.data.auditLogs ?? [];
  return logs.filter((log, index) =>
    log.action !== 'UPDATE_ARTICLE' || logs[index - 1]?.action !== 'UPDATE_ARTICLE',
  );
});

const openPreview = async (id: string) => {
  const previewWindow = window.open('', '_blank');
  try {
    const { token } = await createPreviewToken(id);
    const url = `${config.public.webBase}/preview/${id}?token=${encodeURIComponent(token)}`;
    if (previewWindow) previewWindow.location.href = url;
  } catch (exception) {
    previewWindow?.close();
    error(getApiErrorMessage(exception));
  }
};
const openReject = (id: string, title: string) => {
  rejectTarget.value = { id, title };
  rejectComment.value = '';
};
const requestApprove = (id: string) => {
  if (!hasPermission('articles.review.decide')) return permissionNotice.open('审核通过文章', '审核文章权限');
  return decide(id, 'approve');
};
const requestReject = (id: string, title: string) => {
  if (!hasPermission('articles.review.decide')) return permissionNotice.open('退回文章', '审核文章权限');
  openReject(id, title);
};
const requestPublish = (id: string) => {
  if (!hasPermission('articles.publish')) return permissionNotice.open('发布文章', '文章发布权限（管理员）');
  return decide(id, 'publish');
};
const closeReject = () => {
  rejectTarget.value = null;
  rejectComment.value = '';
};
const confirmReject = async () => {
  if (!rejectTarget.value || rejectComment.value.trim().length < 2) return;
  busy.value = true;
  try {
    await reject(rejectTarget.value.id, rejectComment.value.trim());
    success('文章已退回，审核意见已保存');
    closeReject();
    await refresh();
  } catch (exception) {
    error(getApiErrorMessage(exception));
  } finally {
    busy.value = false;
  }
};
const showHistory = async (id: string, title: string) => {
  try {
    historyTarget.value = { title, data: await history(id) };
  } catch (exception) {
    error(getApiErrorMessage(exception));
  }
};
const decide = async (id: string, action: 'approve' | 'publish') => {
  if (
    action === 'publish' &&
    !window.confirm('确定发布该文章？发布后普通用户可以看到。')
  ) return;
  try {
    if (action === 'approve') {
      await approve(id);
      success('文章审核通过');
    } else {
      await publish(id);
      success('文章发布成功');
    }
    await refresh();
  } catch (exception) {
    error(getApiErrorMessage(exception));
  }
};
const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN');
</script>
