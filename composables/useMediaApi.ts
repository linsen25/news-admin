import type { components } from '~/types/generated/api';

export type MediaAssetDTO = components['schemas']['MediaAssetDto'];

export const useMediaApi = () => {
  const config = useRuntimeConfig();
  const { authHeaders } = useAuth();
  const endpoint = (path = '') => `${config.public.apiBase}/upload${path}`;

  const uploadImage = (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return $fetch<MediaAssetDTO>(endpoint('/images'), {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
  };

  const list = () =>
    $fetch<MediaAssetDTO[]>(endpoint('/media'), { headers: authHeaders() });

  const remove = (id: string) =>
    $fetch<void>(endpoint(`/media/${id}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });

  return { uploadImage, list, remove };
};
