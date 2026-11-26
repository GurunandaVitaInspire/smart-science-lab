import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Runs the Vercel functions in /api during `npm run dev` too (on Vercel they run as serverless functions).
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next();
      const name = req.url.slice(5).split('?')[0].replace(/[^a-z0-9_-]/gi, '');
      try {
        const mod = await server.ssrLoadModule(`/api/${name}.js`);
        req.query = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
        await mod.default(req, res);
      } catch (e) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: `No API route ${name}: ${e.message}` }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  // server-side keys for local testing come from .env.local (never shipped to the browser)
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), tailwindcss(), devApi()],
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'lucide-react', 'three', 'lucide', 'gsap'] },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1600,
    },
  };
});
