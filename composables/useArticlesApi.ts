import type { ArticleDTO, ArticleHistoryDTO, ArticleInput } from '~/types/article';
import type { components } from '~/types/generated/api';

type ArticlePageDTO = components['schemas']['ArticlePageDto'];

export const useArticlesApi = () => {
  const config = useRuntimeConfig();
  const { authHeaders } = useAuth();
  const endpoint = (path = '') => `${config.public.apiBase}/articles${path}`;
  const options = () => ({
    headers: authHeaders(),
  });

  const listPage = (status?: string, page = 1, limit = 20) =>
    $fetch<ArticlePageDTO>(endpoint(), {
      ...options(),
      query: { page, limit, ...(status ? { status } : {}) },
    });
  const list = async (status?: string) =>
    (await listPage(status)).items;
  const get = (id: string) => $fetch<ArticleDTO>(endpoint(`/${id}`), options());
  const create = (input: ArticleInput) =>
    $fetch<ArticleDTO>(endpoint(), { method: 'POST', body: input, ...options() });
  const update = (id: string, input: Partial<ArticleInput>) =>
    $fetch<ArticleDTO>(endpoint(`/${id}`), { method: 'PUT', body: input, ...options() });
  const action = (
    id: string,
    name: 'submit' | 'approve' | 'reject' | 'publish',
    body?: Record<string, string>,
  ) => $fetch<ArticleDTO>(endpoint(`/${id}/${name}`), {
    method: 'POST',
    body,
    ...options(),
  });
  const history = (id: string) =>
    $fetch<ArticleHistoryDTO>(endpoint(`/${id}/history`), options());

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
    history,
  };
};
