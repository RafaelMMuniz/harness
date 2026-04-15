import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo',
          'Consolas', '"Liberation Mono"', 'monospace',
        ],
        mono: [
          'ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo',
          'Consolas', '"Liberation Mono"', 'monospace',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
