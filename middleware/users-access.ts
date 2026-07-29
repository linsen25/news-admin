export default defineNuxtRouteMiddleware(() => {
  const { hasPermission } = useAuth();
  if (!hasPermission('users.view')) return navigateTo('/dashboard');
});
