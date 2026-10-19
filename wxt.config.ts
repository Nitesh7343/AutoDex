import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AutoDex — Form Filler',
    description: 'Your profile, ready to fill repetitive application forms.',
    permissions: ['storage', 'activeTab'],
    host_permissions: [],
    icons: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    action: {
      default_title: 'Open AutoDex',
      default_icon: { 16: 'icons/icon16.png', 32: 'icons/icon32.png' },
    },
  },
});
