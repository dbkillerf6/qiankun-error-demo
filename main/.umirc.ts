import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    {
      path: '/',
      component: '@/pages/index',
      routes: [
        { path: '/', redirect: '/overview' },
        { path: '/:id', exact: false, component: '@/pages/widget' },
      ],
    },
  ],
});
