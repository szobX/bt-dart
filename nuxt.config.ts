import Aura from '@primevue/themes/aura';
import pkg from './package.json';
export const wrappedPrimeInputs: string[] = [
  'AutoComplete',
  'CascadeSelect',
  'Checkbox',
  'Chip',
  'ColorPicker',
  'DatePicker',
  'Editor',
  'InputMask',
  'InputNumber',
  'InputOtp',
  'InputText',
  'Knob',
  'Listbox',
  'MultiSelect',
  'Password',
  'RadioButton',
  'Rating',
  'Select',
  'SelectButton',
  'Slider',
  'Textarea',
  'ToggleButton',
  'ToggleSwitch',
  'TreeSelect',
];

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    appManifest: false,
  },

  compatibilityDate: '2024-07-04',

  ssr: true,
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      APP_VERSION: pkg.version,
      APP_NAME: pkg.name,
      APP_MODE: process.env?.NODE_ENV,
    },
  },
  supabase: {
    redirect: false,
  },
  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxt/test-utils/module',
    '@nuxt/image',
    '@nuxt/fonts',
    '@sfxcode/formkit-primevue-nuxt',
    '@nuxtjs/supabase',
    '@unocss/nuxt',
    '@nuxt/eslint',
    '@primevue/nuxt-module',
  ],
  content: {
    highlight: {
      theme: 'one-dark-pro',
      preload: ['json', 'js', 'ts', 'html', 'css', 'vue'],
    },
    // Options
  },

  i18n: {
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'en',
    strategy: 'no_prefix',
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'de', file: 'de.json', name: 'German' },
    ],
    vueI18n: './vue-i18n.options.ts',
  },
  formkitPrimevue: {
    includePrimeIcons: true,
    includeStyles: true,
    installFormKit: true,
    installI18N: true,
  },
  primevue: {
    autoImport: true,
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        },
      },
      ripple: true,
    },
    components: {
      exclude: [...wrappedPrimeInputs, 'Button', 'Form', 'FormField', 'Chart'],
    },
  },

  build: {
    transpile: ['nuxt', 'primevue', '@sfxcode/formkit-primevue'],
  },

  sourcemap: {
    client: false,
    server: false,
  },
});
