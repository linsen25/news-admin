export default defineNuxtRouteMiddleware(() => {
  const session = useCookie<string | null>('access-token');
  if (!session.value) return navigateTo('/login');
});
