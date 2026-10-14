// Lightweight end-to-end smoke test for the Peak Nuts API.
//
// Usage:
//   node scripts/smoke-test.js                       # tests the live site
//   node scripts/smoke-test.js http://localhost:5000 # tests a local server
//
// Exits with code 1 if any check fails.

const BASE = (process.argv[2] || process.env.SMOKE_URL || 'https://ecommers-teal-phi.vercel.app').replace(/\/+$/, '');

let passed = 0;
let failed = 0;

async function check(name, path, opts, expected) {
  let res;
  try {
    res = await fetch(BASE + path, opts || {});
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name}  (request error: ${err.message})`);
    return null;
  }
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  if (ok) { passed++; console.log(`ok    ${name}  -> ${res.status}`); }
  else { failed++; console.log(`FAIL  ${name}  -> ${res.status} (expected ${expected})`); }
  return res;
}

function json(body) {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

(async function main() {
  console.log(`Smoke testing ${BASE}\n`);

  await check('products reachable', '/api/products', {}, 200);
  await check('orders require auth', '/api/orders', {}, 401);
  await check('debug endpoint removed', '/api/debug', {}, 404);
  await check('server.js not served', '/server.js', {}, 404);
  await check('package.json not served', '/package.json', {}, 404);
  await check('env not served', '/.env', {}, 404);
  await check('admin page reachable', '/admin', {}, [200, 308]);
  await check('homepage reachable', '/', {}, [200, 308]);
  await check('unknown product rejected', '/api/orders', json({
    customer: 'Test', email: 'test@example.com', phone: '000', city: 'X', address: 'Y',
    items: [{ name: '___NO_SUCH_PRODUCT___', qty: 1, price: 0.01 }]
  }), 400);
  await check('invalid email rejected', '/api/orders', json({
    customer: 'Test', email: 'not-an-email', phone: '000', city: 'X', address: 'Y',
    items: [{ name: 'Organic Almonds', qty: 1, price: 0.01 }]
  }), 400);
  await check('bad admin login rejected', '/api/login', json({ username: 'admin', password: 'wrong-password' }), 401);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
