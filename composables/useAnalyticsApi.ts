import type { components } from '~/types/generated/api';
export type AnalyticsOverviewDTO = components['schemas']['AnalyticsOverviewDto'];

export const useAnalyticsApi = () => {
  const config = useRuntimeConfig();
  const { authHeaders } = useAuth();
  return {
    overview: () => $fetch<AnalyticsOverviewDTO>(`${config.public.apiBase}/analytics/overview`, { headers: authHeaders() }),
  };
};
