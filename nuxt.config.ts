export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE_URL
        || process.env.NUXT_PUBLIC_API_BASE
        || 'http://localhost:3001/api',
      webBase:
        process.env.NUXT_PUBLIC_WEB_BASE_URL
        || process.env.NUXT_PUBLIC_WEB_BASE
        || 'http://localhost:3000',
    },
  },
  app: {
    head: {
      title: 'Newsroom Admin',
      meta: [{ name: 'description', content: '新闻 CMS 管理工作台' }],
    },
  },
  typescript: { strict: true },
});
