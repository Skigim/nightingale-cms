import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure React plugin to also transform JSX inside .js files (not just .jsx/.tsx)
export default defineConfig({
  base: '/nightingale-cms/', // GitHub Pages base path (repository name)
  plugins: [
    react({
      include: [
        '**/*.jsx',
        '**/*.js', // allow JSX in .js files (project convention)
        '**/*.tsx',
        '**/*.ts',
      ],
    }),
  ],
});
