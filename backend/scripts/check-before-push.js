/**
 * Offline checks before pushing to GitHub:
 * - prisma validate (uses a placeholder DB URL if yours is missing/invalid)
 * - prisma generate
 *
 * Applying migrations/schema to your real DB still requires a valid DATABASE_URL:
 *   npm run db:push
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function isValidPgUrl(url) {
  return typeof url === 'string' && (url.startsWith('postgresql://') || url.startsWith('postgres://'));
}

require('dotenv').config({ path: path.join(root, '.env') });

const env = { ...process.env };
if (!isValidPgUrl(env.DATABASE_URL)) {
  env.DATABASE_URL = 'postgresql://preflight:preflight@127.0.0.1:5432/preflight';
  console.log(
    '[check] DATABASE_URL missing or not Postgres — using a placeholder only for `prisma validate`.\n'
  );
}

function run(label, cmd, args) {
  console.log(`→ ${label}`);
  const r = spawnSync(cmd, args, { cwd: root, env, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('prisma validate', 'npx', ['prisma', 'validate']);
run('prisma generate', 'npx', ['prisma', 'generate']);

console.log('\n✓ Backend schema & Prisma client are OK.');
console.log('  With your real Neon URL in .env, run: npm run db:push');
