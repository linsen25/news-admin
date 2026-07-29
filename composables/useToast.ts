type ToastTone = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
}

export const useToast = () => {
  const messages = useState<ToastMessage[]>('toast-messages', () => []);

  const show = (text: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    messages.value.push({ id, text, tone });
    if (import.meta.client) {
      window.setTimeout(() => remove(id), 3500);
    }
  };
  const remove = (id: number) => {
    messages.value = messages.value.filter((message) => message.id !== id);
  };

  return {
    messages,
    remove,
    success: (text: string) => show(text, 'success'),
    error: (text: string) => show(text, 'error'),
    info: (text: string) => show(text, 'info'),
  };
};

export const getApiErrorMessage = (exception: unknown): string => {
  const error = exception as {
    statusCode?: number;
    status?: number;
    data?: { statusCode?: number; message?: string | string[] };
  };
  const status = error.statusCode ?? error.status ?? error.data?.statusCode;
  if (status === 401) return '登录状态无效，请重新登录';
  if (status === 403) return '你没有权限执行该操作';
  if (status === 404) return '请求的数据不存在';
  if (status === 400) {
    const message = error.data?.message;
    return Array.isArray(message) ? message.join('；') : message ?? '提交的数据不符合要求';
  }
  return '操作失败，请稍后重试';
};
