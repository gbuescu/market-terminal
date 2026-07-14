/**
 * market-terminal API server.
 * Read-only market research terminal — this server must never gain trade
 * execution, order routing, or broker connectivity of any kind.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { getMeta, runMigrations } from './db.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.MKT_API_PORT ?? 4780);

const schemaVersion = runMigrations();

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'market-terminal',
    version: '0.1.0',
    schemaVersion: Number(getMeta('schema_version') ?? 0),
    migrationsDefined: schemaVersion,
    node: process.version,
    time: new Date().toISOString(),
  });
});

// Serve the built client when it exists (production mode). In dev, Vite
// serves the client on :5173 and proxies /api here instead.
const dist = join(repoRoot, 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  // SPA fallback for client-side routes.
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      res.sendFile(join(dist, 'index.html'));
    } else {
      next();
    }
  });
}

app.listen(PORT, () => {
  console.log(`[market-terminal] API listening on http://localhost:${PORT}`);
  console.log(
    `[market-terminal] client build ${existsSync(dist) ? 'served from client/dist' : 'not found (dev mode: use Vite on :5173)'}`,
  );
});
