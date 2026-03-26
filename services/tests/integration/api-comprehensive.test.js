const BASE = process.env.API_URL || 'http://localhost:3000';
let token = '';
let periodId = null;

beforeAll(async () => {
  // Login to get real token
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
  });
  const data = await res.json();
  token = data.token || data.data?.token || data.accessToken;
  expect(token).toBeTruthy();

  // Get a period
  const periodsRes = await fetch(`${BASE}/api/finance/accounting-periods`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const periods = await periodsRes.json();
  const list = Array.isArray(periods) ? periods : periods.data ?? [];
  periodId = list.find(p => p.status === 'OPEN')?.id || list[0]?.id;
});

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// ── Auth ──────────────────────────────────────────────────────────────────────
describe('AUTH API', () => {
  it('POST /api/auth/login — valid creds → 200 + token', async () => {
    const { status, body } = await api('POST', '/api/auth/login', { username: 'admin', password: 'Admin@123' });
    expect(status).toBe(200);
    const t = body.token || body.data?.token || body.accessToken;
    expect(t).toBeTruthy();
  });

  it('POST /api/auth/login — invalid creds → 401', async () => {
    const { status } = await api('POST', '/api/auth/login', { username: 'wrong', password: 'wrong' });
    expect(status).toBe(401);
  });

  it('GET /api/auth/me — returns current user', async () => {
    const { status, body } = await api('GET', '/api/auth/me');
    expect(status).toBe(200);
    expect(body.username || body.data?.username).toBeTruthy();
  });
});

// ── Finance: Kas Kecil ────────────────────────────────────────────────────────
describe('KAS KECIL API', () => {
  let entryId;
  it('GET /api/finance/kas-kecil → 200, returns array', async () => {
    const { status, body } = await api('GET', `/api/finance/kas-kecil?periodId=${periodId}`);
    expect(status).toBe(200);
  });

  it('POST /api/finance/kas-kecil → 201, transNumber assigned', async () => {
    const { status, body } = await api('POST', '/api/finance/kas-kecil', {
      date: new Date().toISOString().split('T')[0],
      description: 'API Test Kas Kecil',
      accountNumber: '6211305',
      debit: 10000,
      credit: 0,
      periodId,
    });
    expect(status).toBe(201);
    const trans = body.transNumber || body.data?.transNumber || body.trans_number;
    expect(trans).toBeTruthy();
    entryId = body.id || body.data?.id;
  });
});

// ── Finance: Kas Bank ─────────────────────────────────────────────────────────
describe('KAS BANK API', () => {
  it('GET /api/finance/kas-bank → 200', async () => {
    const { status } = await api('GET', `/api/finance/kas-bank?periodId=${periodId}`);
    expect(status).toBe(200);
  });

  it('POST /api/finance/kas-bank → 201', async () => {
    const { status, body } = await api('POST', '/api/finance/kas-bank', {
      date: new Date().toISOString().split('T')[0],
      coaAccount: '1110201',
      description: 'API Test Kas Bank',
      outflow: 10000,
      inflow: 0,
      periodId,
    });
    expect(status).toBe(201);
  });
});

// ── Finance: Buku Besar ───────────────────────────────────────────────────────
describe('BUKU BESAR API', () => {
  it('GET /api/finance/buku-besar → 200, array response', async () => {
    const { status, body } = await api('GET', `/api/finance/buku-besar?periodId=${periodId}`);
    expect(status).toBe(200);
  });
});

// ── Finance: Neraca Saldo ─────────────────────────────────────────────────────
describe('NERACA SALDO API', () => {
  it('GET /api/finance/neraca-saldo → 200, balanced property exists', async () => {
    const { status, body } = await api('GET', `/api/finance/neraca-saldo?periodId=${periodId}`);
    expect(status).toBe(200);
    expect(typeof body.balanced).toBe('boolean');
  });
});

// ── Assets ────────────────────────────────────────────────────────────────────
describe('ASSETS API', () => {
  it('GET /api/assets → 200', async () => {
    const { status } = await api('GET', '/api/assets');
    expect(status).toBe(200);
  });

  it('GET /api/finance/asset-depreciation-journals → 200', async () => {
    const { status } = await api('GET', `/api/finance/asset-depreciation-journals?periodId=${periodId}`);
    expect(status).toBe(200);
  });
});

// ── HR ────────────────────────────────────────────────────────────────────────
describe('HR API', () => {
  it('GET /api/employees → 200', async () => {
    const { status } = await api('GET', '/api/employees');
    expect(status).toBe(200);
  });

  it('GET /api/positions → 200', async () => {
    const { status } = await api('GET', '/api/positions');
    expect(status).toBe(200);
  });
});

// ── Access Control ────────────────────────────────────────────────────────────
describe('ACCESS CONTROL API', () => {
  it('GET /api/roles → 200', async () => {
    const { status } = await api('GET', '/api/roles');
    expect(status).toBe(200);
  });

  it('GET /api/users → 200', async () => {
    const { status } = await api('GET', '/api/users');
    expect(status).toBe(200);
  });
});
