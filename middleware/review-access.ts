export default defineNuxtRouteMiddleware(() => {
  const { hasPermission } = useAuth();
  if (!hasPermission('articles.review.view')) return navigateTo('/dashboard');
});
