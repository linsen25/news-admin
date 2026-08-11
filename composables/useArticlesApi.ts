import type { ArticleDTO, ArticleHistoryDTO, ArticleInput, ArticleUpdateInput } from '~/types/article';
import type { components } from '~/types/generated/api';

type ArticlePageDTO = components['schemas']['ArticlePageDto'];

export const useArticlesApi = () => {
  const config = useRuntimeConfig();
  const { authHeaders } = useAuth();
  const endpoint = (path = '') => `${config.public.apiBase}/articles${path}`;
  const options = () => ({
    headers: authHeaders(),
  });

  const listPage = (query: {
    status?: string;
    categoryId?: string;
    search?: string;
    reviewQueue?: boolean;
    page?: number;
    limit?: number;
  } = {}) =>
    $fetch<ArticlePageDTO>(endpoint(), {
      ...options(),
      query: { page: 1, limit: 20, ...query },
    });
  const list = async (status?: string) =>
    (await listPage({ status })).items;
  const get = (id: string) => $fetch<ArticleDTO>(endpoint(`/${id}`), options());
  const create = (input: ArticleInput) =>
    $fetch<ArticleDTO>(endpoint(), { method: 'POST', body: input, ...options() });
  const update = (id: string, input: ArticleUpdateInput) =>
    $fetch<ArticleDTO>(endpoint(`/${id}`), { method: 'PUT', body: input, ...options() });
  const action = (
    id: string,
    name: 'submit' | 'approve' | 'reject' | 'publish' | 'withdraw',
    body?: Record<string, string>,
  ) => $fetch<ArticleDTO>(endpoint(`/${id}/${name}`), {
    method: 'POST',
    body,
    ...options(),
  });
  const history = (id: string) =>
    $fetch<ArticleHistoryDTO>(endpoint(`/${id}/history`), options());
  const createPreviewToken = (id: string) =>
    $fetch<{ token: string; expiresIn: number }>(endpoint(`/${id}/preview-token`), {
      method: 'POST',
      ...options(),
    });

  return {
    list,
    listPage,
    get,
    create,
    update,
    submit: (id: string) => action(id, 'submit'),
    approve: (id: string) => action(id, 'approve'),
    reject: (id: string, comment: string) => action(id, 'reject', { comment }),
    publish: (id: string) => action(id, 'publish'),
    withdraw: (id: string) => action(id, 'withdraw'),
    history,
    createPreviewToken,
  };
};
