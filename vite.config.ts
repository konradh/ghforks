import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { existsSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.VITE_BASE,
    server: {
      port: 8000,
    },
    appType: 'mpa',
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          page404: resolve(__dirname, '404.html'),
        }
      }
    },
    plugins: [
      vue(),
      {
        // Make the dev server behave like GitHub pages.
        // By default, if the page is not found, the vite dev server returns index.html.
        // This change makes it so that 404.html is returned instead.
        // See https://stackoverflow.com/a/71282714.
        name: 'fallback404Middleware',
        configureServer(server) {
          function fallback404Middleware(req, _, next) {
            const path = new URL('https://example.com' + req.url).pathname;
            if (path === '/') {
              req.url = '/index.html';
            } else {
              req.url = '/404.html';
            }
            next();
          }
          return function () {
            // This function runs after the vite middlewares are already present.

            // Remove vites default fallback middleware.
            const stack = server.middlewares.stack;
            const i = stack.findIndex(layer => layer.handle.name === 'viteHtmlFallbackMiddleware')
            if (i > -1) {
              stack.splice(i, 1);
            }

            // Use our custom middleware instead.
            server.middlewares.use(fallback404Middleware);
          }
        }
      }
    ],
  }
})
