export interface CatalogItem {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  parentId?: string | null;
  categoryId?: string | null;
}

export const useCatalogApi = () => {
  const config = useRuntimeConfig();
  const { authHeaders } = useAuth();

  const categories = () =>
    $fetch<CatalogItem[]>(`${config.public.apiBase}/categories`);
  const tags = () =>
    $fetch<CatalogItem[]>(`${config.public.apiBase}/tags`);
  const createCategory = (input: Pick<CatalogItem, 'name' | 'nameEn' | 'slug' | 'parentId'>) =>
    $fetch<CatalogItem>(`${config.public.apiBase}/categories`, {
      method: 'POST', body: input, headers: authHeaders(),
    });
  const updateCategory = (id: string, input: Partial<Pick<CatalogItem, 'name' | 'nameEn' | 'slug' | 'parentId'>>) =>
    $fetch<CatalogItem>(`${config.public.apiBase}/categories/${id}`, {
      method: 'PUT', body: input, headers: authHeaders(),
    });
  const deleteCategory = (id: string) =>
    $fetch<void>(`${config.public.apiBase}/categories/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
  const createTag = (input: Pick<CatalogItem, 'name' | 'nameEn' | 'slug' | 'categoryId'>) =>
    $fetch<CatalogItem>(`${config.public.apiBase}/tags`, {
      method: 'POST',
      body: input,
      headers: authHeaders(),
    });
  const updateTag = (
    id: string,
    input: Partial<Pick<CatalogItem, 'name' | 'nameEn' | 'slug' | 'categoryId'>>,
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
  const createCustomTag = (name: string, categoryId: string) =>
    $fetch<CatalogItem>(`${config.public.apiBase}/tags/custom`, {
      method: 'POST', body: { name, categoryId }, headers: authHeaders(),
    });

  return { categories, tags, createCategory, updateCategory, deleteCategory, createTag, updateTag, deleteTag, createCustomTag };
};
