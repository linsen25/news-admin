export default defineNuxtRouteMiddleware(() => {
  const { hasPermission } = useAuth();
  if (!hasPermission('articles.view.own')) return navigateTo('/dashboard');
});
