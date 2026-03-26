const BASE = process.env.API_URL || 'http://localhost:3000';

const endpoints = [
  '/health',
  '/health/services',
  '/api/auth/login',          // should return 400 (missing body) not 500
  '/api/finance/kas-kecil',   // should return 401 (no auth) not 500
  '/api/finance/vouchers',
  '/api/finance/buku-besar',
  '/api/finance/neraca-saldo',
  '/api/finance/assets',
  '/api/finance/asset-acquisition-journals',
  '/api/finance/asset-depreciation-journals',
  '/api/finance/jurnal-memorial',
  '/api/finance/accounting-periods',
  '/api/finance/master-accounts',
];

describe('Backend Health Check', () => {
  it('API gateway is reachable', async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
  });

  for (const endpoint of endpoints) {
    it(`${endpoint} responds (not 500)`, async () => {
      const res = await fetch(`${BASE}${endpoint}`);
      expect(res.status).not.toBe(500);
      expect(res.status).not.toBe(502);
      expect(res.status).not.toBe(503);
    });
  }
});
