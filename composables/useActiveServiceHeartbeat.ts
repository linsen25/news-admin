export const useActiveServiceHeartbeat = () => {
  const config = useRuntimeConfig();
  let timer: ReturnType<typeof setInterval> | undefined;

  const heartbeat = async () => {
    if (document.visibilityState !== 'visible') return;
    const backendHealth = new URL(config.public.apiBase, window.location.origin);
    backendHealth.pathname = `${backendHealth.pathname.replace(/\/api\/?$/, '')}/health`;
    await Promise.allSettled([
      $fetch('/health'),
      $fetch(backendHealth.toString()),
    ]);
  };

  onMounted(() => {
    void heartbeat();
    timer = setInterval(() => void heartbeat(), 8 * 60 * 1000);
    document.addEventListener('visibilitychange', heartbeat);
  });
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', heartbeat);
  });
};
