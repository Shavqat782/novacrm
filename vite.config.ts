import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/telegram-api': {
            target: 'https://api.telegram.org',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/telegram-api/, ''),
            secure: true,
          },
          // Прокси для Google Gemini: в dev ключ подставляется на сервере (см. плагин ниже)
          // и не попадает в браузер/бандл
          '/gemini-api': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/gemini-api/, ''),
            secure: true,
          },
        },
      },
      plugins: [
        react(),
        {
          name: 'gemini-server-auth',
          configureServer(server) {
            server.middlewares.use('/gemini-api', (req, _res, next) => {
              if (env.GEMINI_API_KEY) {
                req.headers['x-goog-api-key'] = env.GEMINI_API_KEY;
              }
              next();
            });
          },
        },
      ],
      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      },
    };
});
