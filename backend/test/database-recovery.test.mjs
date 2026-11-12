import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';

// No network or real data: emulate Atlas failing DNS, then being resumed.
process.env.STORAGE_URL = 'mongodb://localhost:27017';
process.env.ALLOWED_ORIGIN = 'https://dp-sahay-ai.vercel.app';
process.env.STRICT_ORIGIN = '1';
let available = false;
let connections = 0;
let closed = 0;
let pings = 0;
const original = {
  connect: MongoClient.prototype.connect,
  close: MongoClient.prototype.close,
  db: MongoClient.prototype.db,
};
const failure = Object.assign(new Error('querySrv ENOTFOUND'), { code: 'ENOTFOUND' });

MongoClient.prototype.connect = async function () {
  connections += 1;
  assert.equal(this.options.serverSelectionTimeoutMS, 5000);
  if (!available) throw failure;
  return this;
};
MongoClient.prototype.close = async function () { closed += 1; };
MongoClient.prototype.db = function () {
  return {
    command: async (command, options) => {
      assert.deepEqual(command, { ping: 1 });
      assert.equal(options.timeoutMS, 5000);
      pings += 1;
      if (!available) throw failure;
    },
    collection: (name) => ({
      createIndex: async () => {},
      find: () => ({ toArray: async () => name === 'state' ? [] : [{ id: 'test-record' }] }),
    }),
  };
};

function response() {
  return {
    headers: {},
    statusCode: 200,
    headersSent: false,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; this.headersSent = true; return this; },
    end() { this.headersSent = true; },
    destroy() { this.destroyed = true; },
  };
}

try {
  const { readAll } = await import('../lib/store.js');
  const { default: router } = await import('../api/router.js');
  const { routes } = await import('../lib/routes.js');
  const request = (path, method = 'GET', origin = process.env.ALLOWED_ORIGIN) => ({
    url: `/api/${path}`, query: { path }, method,
    headers: { host: 'localhost', origin },
  });

  // All concurrent requests share one failed attempt. None silently return
  // empty data from the development file store while Atlas is unavailable.
  const failed = await Promise.allSettled([readAll('residents'), readAll('checkins')]);
  assert.ok(failed.every((result) => result.status === 'rejected' && result.reason === failure));
  assert.equal(connections, 1);
  assert.equal(closed, 1);

  const live = response();
  await router(request('health'), live);
  assert.equal(live.statusCode, 200);
  assert.equal(connections, 1, 'liveness must not require storage');

  const preflight = response();
  await router(request('ready', 'OPTIONS'), preflight);
  assert.equal(preflight.statusCode, 204);
  assert.equal(connections, 1, 'preflight must not attempt a connection');

  const down = response();
  await router(request('ready'), down);
  assert.equal(down.statusCode, 503);
  assert.deepEqual(down.body, { ok: false, error: 'Database unavailable' });
  assert.equal(down.headers['Cache-Control'], 'no-store');
  assert.equal(down.headers['Access-Control-Allow-Origin'], process.env.ALLOWED_ORIGIN);
  assert.equal(connections, 2, 'failed connections must be retried');

  available = true;
  assert.deepEqual(await readAll('residents'), [{ id: 'test-record' }]);
  assert.equal(connections, 3, 'the same process must recover after Atlas resumes');
  const ready = response();
  await router(request('ready'), ready);
  assert.equal(ready.statusCode, 200);
  assert.equal(pings, 1);
  assert.equal(connections, 3, 'successful connections must remain pooled');

  available = false;
  const laterOutage = response();
  await router(request('ready'), laterOutage);
  assert.equal(laterOutage.statusCode, 503, 'readiness must ping even a cached connection');

  // Production must catch rejected handlers and preserve CORS, just as the
  // local server does. Never send internal database errors to the browser.
  routes['/api/test-failure'] = async () => { throw failure; };
  const log = console.error;
  console.error = () => {};
  try {
    const res = response();
    await router(request('test-failure'), res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Internal server error' });
    assert.equal(res.headers['Access-Control-Allow-Origin'], process.env.ALLOWED_ORIGIN);
    const started = response();
    started.headersSent = true;
    await router(request('test-failure'), started);
    assert.equal(started.destroyed, true);
  } finally {
    console.error = log;
    delete routes['/api/test-failure'];
  }
  const missing = response();
  await router(request('missing', 'GET', 'https://untrusted.example'), missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.headers['Access-Control-Allow-Origin'], undefined);
} finally {
  Object.assign(MongoClient.prototype, original);
}

console.log('database recovery checks passed: retry, readiness, pooled connections and CORS errors');
