// Runs the whole app with one command, and keeps it running.
//
// Why this exists: the three servers used to be three terminals a person had
// to remember to open. The two Vite ones are the ones you notice missing —
// the page simply doesn't load — but the backend is invisible when it's gone.
// The frontend still serves, every tab still renders, and the only symptom is
// "Can't reach the server" inside an app that otherwise looks fine. That is a
// confusing failure to debug and it happened repeatedly.
//
// So: one process starts all three, labels their output, restarts anything
// that exits on its own, and shuts the rest down when you Ctrl-C.
//
// Deliberately zero-dependency. Reaching for `concurrently` would mean an
// install step standing between someone cloning this repo and seeing it run,
// which is exactly the friction this script is removing.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

// Written as an escape in source rather than a raw control byte, so the file
// stays greppable and survives being copied through a shell.
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const DIM = `${ESC}2m`;
const BOLD = `${ESC}1m`;
const YELLOW = `${ESC}33m`;
const RED = `${ESC}31m`;

const SERVICES = [
  { name: 'backend', dir: 'backend', script: 'dev:local', color: `${ESC}38;5;114m`, port: 3000 },
  { name: 'frontend', dir: 'frontend', script: 'dev', color: `${ESC}38;5;147m`, port: 5173 },
  { name: 'admin', dir: 'admin', script: 'dev', color: `${ESC}38;5;180m`, port: 5174 },
];

// Restarting is for crashes, not for a service that can never start. Without a
// ceiling, a backend with a syntax error would respawn forever and bury the
// error message under its own restart notices.
//
// The ceiling counts *consecutive rapid* crashes, not crashes for the lifetime
// of the session. A service that came up and ran normally for a while has
// demonstrably not got a startup problem, so its budget resets — otherwise a
// long day's work with five unrelated hiccups in it would end with a backend
// that silently refuses to come back, which is the failure this whole script
// exists to prevent.
const MAX_RESTARTS = 5;
const RESTART_DELAY_MS = 800;
const STABLE_MS = 10_000;

// And an occupied port is not a crash at all — it is permanent, and it is the
// most common startup failure here (usually the app is already running in
// another terminal). Retrying it five times only buries the one useful line of
// output under five identical stack traces, which is what it did the first
// time this script was tested.
const PORT_TAKEN = /EADDRINUSE|already in use/i;

let shuttingDown = false;
const running = new Map();

function label(service, line) {
  return `${service.color}${service.name.padEnd(8)}${RESET} ${DIM}│${RESET} ${line}`;
}

function say(service, line) {
  console.log(label(service, line));
}

function pipe(service, stream, onLine) {
  let buffer = '';
  stream.setEncoding('utf-8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      onLine?.(line);
      say(service, line);
    }
  });
}

function start(service, restarts = 0) {
  const cwd = path.join(ROOT, service.dir);

  if (!existsSync(path.join(cwd, 'node_modules'))) {
    say(service, `${YELLOW}no node_modules — run: npm run install:all${RESET}`);
    return;
  }

  // npm is a .cmd shim on Windows and Node refuses to spawn .cmd directly, so
  // a shell is required there. It is passed as one command string rather than
  // a command plus an args array: the array form under `shell: true` prints a
  // DeprecationWarning (DEP0190) on every startup, and the only reason that
  // warning exists — unescaped arguments — does not apply here, because
  // `service.script` is a literal from SERVICES above and never user input.
  const child = spawn(`npm run ${service.script}`, {
    cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  running.set(service.name, child);
  const startedAt = Date.now();

  let portTaken = false;
  const watch = (line) => {
    if (PORT_TAKEN.test(line)) portTaken = true;
  };
  pipe(service, child.stdout, watch);
  pipe(service, child.stderr, watch);

  child.on('exit', (code, signal) => {
    running.delete(service.name);
    if (shuttingDown) return;

    if (portTaken) {
      say(service, `${YELLOW}port ${service.port} already in use — not restarting.${RESET}`);
      say(service, `${DIM}Usually this app is already running in another terminal.${RESET}`);
      say(service, `${DIM}Stop that one, or free the port: npx kill-port ${service.port}${RESET}`);
      return;
    }

    // Ran long enough to prove it can start? Then this is a fresh problem,
    // not a crash loop, and it gets a full budget again.
    const lived = Date.now() - startedAt;
    const consecutive = lived >= STABLE_MS ? 0 : restarts;

    if (consecutive >= MAX_RESTARTS) {
      say(service, `${RED}crashed ${MAX_RESTARTS} times in a row — giving up.${RESET}`);
      say(service, `${DIM}Fix the error above, then restart with: npm run dev${RESET}`);
      return;
    }

    say(service, `${YELLOW}exited (${signal || `code ${code}`}) — restarting…${RESET}`);
    setTimeout(() => start(service, consecutive + 1), RESTART_DELAY_MS);
  });

  child.on('error', (err) => {
    say(service, `${RED}could not start: ${err.message}${RESET}`);
  });
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${DIM}stopping…${RESET}`);
  for (const child of running.values()) {
    // taskkill /T is the only reliable way to take down npm's child on
    // Windows; child.kill() there kills the shim and orphans the real server,
    // which then holds the port and breaks the next startup.
    if (isWindows) {
      spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`${BOLD}Sahay${RESET} ${DIM}— starting all services${RESET}`);
for (const service of SERVICES) {
  console.log(
    `  ${service.color}${service.name.padEnd(8)}${RESET} ${DIM}http://localhost:${service.port}${RESET}`,
  );
  start(service);
}
console.log(`${DIM}  Ctrl-C to stop everything.${RESET}\n`);
