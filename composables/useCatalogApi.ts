export interface CatalogItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export const useCatalogApi = () => {
  const config = useRuntimeConfig();
  const { authHeaders } = useAuth();

  const categories = () =>
    $fetch<CatalogItem[]>(`${config.public.apiBase}/categories`);
  const tags = () =>
    $fetch<CatalogItem[]>(`${config.public.apiBase}/tags`);
  const createTag = (input: Pick<CatalogItem, 'name' | 'slug'>) =>
    $fetch<CatalogItem>(`${config.public.apiBase}/tags`, {
      method: 'POST',
      body: input,
      headers: authHeaders(),
    });
  const updateTag = (
    id: string,
    input: Partial<Pick<CatalogItem, 'name' | 'slug'>>,
  ) => $fetch<CatalogItem>(`${config.public.apiBase}/tags/${id}`, {
    method: 'PUT',
    body: input,
    headers: authHeaders(),
  });
  const deleteTag = (id: string) =>
    $fetch<void>(`${config.public.apiBase}/tags/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

  return { categories, tags, createTag, updateTag, deleteTag };
};
