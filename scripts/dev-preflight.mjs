/**
 * Makes `npm run dev` fail in a way you can act on.
 *
 * Strapi cannot start without its database, and when it cannot reach one it
 * spends a minute inside knex and then prints a `KnexTimeoutError` stack — which
 * says nothing about the actual problem (Docker is not running) and takes the
 * frontend down with it. So: check the port the CMS is actually configured to
 * use, start the compose service if it is closed, and if that does not work say
 * exactly what to do instead of handing over a wall of stack frames.
 */

import { spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROBE_TIMEOUT_MS = 2_000;

const red = (text) => `[31m${text}[39m`;
const dim = (text) => `[2m${text}[22m`;
const bold = (text) => `[1m${text}[22m`;

/** Minimal `.env` reader — the CMS is the only thing that knows where its database is. */
function readEnvFile(file) {
  try {
    return Object.fromEntries(
      readFileSync(path.join(root, file), 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const at = line.indexOf('=');

          return at === -1
            ? [line, '']
            : [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')];
        }),
    );
  } catch {
    return null;
  }
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(PROBE_TIMEOUT_MS);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

function fail(lines) {
  console.error(`\n${red('✖')} ${bold('The database is not reachable, so the CMS cannot start.')}\n`);

  for (const line of lines) {
    console.error(`  ${line}`);
  }

  console.error('');
  process.exit(1);
}

const cmsEnv = readEnvFile('apps/cms/.env');

if (!cmsEnv) {
  fail([
    'apps/cms/.env is missing.',
    '',
    `  ${dim('cp apps/cms/.env.example apps/cms/.env')}`,
    `  ${dim('(then generate the secrets — see the README)')}`,
  ]);
}

// Only the networked clients need a server to be up; sqlite is a file.
if ((cmsEnv.DATABASE_CLIENT ?? 'sqlite') === 'sqlite') {
  process.exit(0);
}

const host = cmsEnv.DATABASE_HOST || 'localhost';
const port = Number.parseInt(cmsEnv.DATABASE_PORT || '5432', 10);
const address = `${host}:${port}`;

if (await canConnect(host, port)) {
  process.exit(0);
}

console.log(dim(`• ${address} is not answering — starting the database container…`));

const compose = spawnSync('docker', ['compose', 'up', '-d', '--wait'], {
  cwd: root,
  stdio: 'inherit',
});

if (compose.error?.code === 'ENOENT') {
  fail([
    'Docker is not installed, or its CLI is not on PATH.',
    '',
    'Install Docker Desktop, OrbStack or Colima, then run this again.',
  ]);
}

if (compose.status !== 0) {
  fail([
    `Docker could not start the database (${dim('docker compose up -d --wait')} failed above).`,
    '',
    'The usual causes, in the order they bite:',
    '',
    `  ${bold('1.')} The Docker engine is not running.`,
    `     ${dim('OrbStack: orb status  →  orb start')}`,
    `     ${dim('Docker Desktop: open the app and wait for the whale to settle')}`,
    '',
    `  ${bold('2.')} No disk space left — the engine needs a few GB free for its VM`,
    `     and dies silently without them.`,
    `     ${dim('df -h /System/Volumes/Data')}`,
    '',
    `  ${bold('3.')} Port ${port} is taken by something else.`,
    `     ${dim(`lsof -nP -iTCP:${port} -sTCP:LISTEN`)}`,
    `     ${dim('Then set DATABASE_PORT to a free port in .env and apps/cms/.env,')}`,
    `     ${dim('and re-create the container: npm run db:reset')}`,
  ]);
}

if (!(await canConnect(host, port))) {
  /**
   * The container is healthy, so the database itself is fine and only the route
   * to it is broken. There are two routes: the published port on localhost, and
   * — under OrbStack — the container's own `*.orb.local` name. Probing the other
   * one turns "nothing is listening" into an instruction, because a dead
   * OrbStack domain and a genuine port mismatch need opposite fixes.
   */
  const rootEnv = readEnvFile('.env') ?? {};
  const publishedPort = Number.parseInt(rootEnv.DATABASE_PORT || '5432', 10);
  const publishedWorks = await canConnect('127.0.0.1', publishedPort);

  if (publishedWorks && host.endsWith('.orb.local')) {
    fail([
      `The database is up and answering on ${bold(`127.0.0.1:${publishedPort}`)},`,
      `but its OrbStack name ${bold(host)} does not resolve.`,
      '',
      "OrbStack's `*.orb.local` domains are off or broken — the container is fine.",
      '',
      `  ${bold('1.')} Restart the engine: ${dim('orb stop && orb start')}`,
      `  ${bold('2.')} Or turn the domains back on in OrbStack → Settings → Network.`,
      `  ${bold('3.')} Or reach the same container through its published port —`,
      `     set these in ${bold('apps/cms/.env')}:`,
      '',
      `       ${dim('DATABASE_HOST=127.0.0.1')}`,
      `       ${dim(`DATABASE_PORT=${publishedPort}`)}`,
    ]);
  }

  if (publishedWorks) {
    fail([
      `The database answers on ${bold(`127.0.0.1:${publishedPort}`)}, not on ${bold(address)}.`,
      '',
      `apps/cms/.env points the CMS at ${bold(address)}, while docker-compose publishes`,
      `it on the port from the root ${bold('.env')} — those two have to agree.`,
      '',
      `  ${dim('grep DATABASE_PORT .env apps/cms/.env')}`,
    ]);
  }

  fail([
    `The container started, but nothing is listening on ${bold(address)}`,
    `or on ${bold(`127.0.0.1:${publishedPort}`)}.`,
    '',
    'Postgres is not up inside the container — its own log will say why:',
    '',
    `  ${dim('docker logs lumea-postgres --tail 30')}`,
  ]);
}

console.log(dim(`• ${address} is up.`));
