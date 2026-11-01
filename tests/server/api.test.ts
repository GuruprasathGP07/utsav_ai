import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../server/index.js';

describe('API Server Integration Tests', () => {
  it('GET /api/health returns status ok and demo mode flag', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.demo).toBe('boolean');
  });

  it('GET /.well-known/security.txt returns security contact information', async () => {
    const res = await request(app).get('/.well-known/security.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Contact: mailto:security@');
  });

  it('POST /api/parse-intake rejects non-whitelisted Origin', async () => {
    const res = await request(app)
      .post('/api/parse-intake')
      .set('Origin', 'http://malicious-site.com')
      .send({ sentence: 'wedding in Mumbai for 100 guests' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /api/parse-intake handles valid request with same-origin header in demo mode', async () => {
    const res = await request(app)
      .post('/api/parse-intake')
      .set('Origin', 'http://localhost:8080')
      .set('Content-Type', 'application/json')
      .send({ sentence: 'Tamil wedding in Chennai for 300 guests with 8 lakh budget' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.occasion).toBe('wedding');
    expect(res.body.data.guests).toBe(300);
    expect(res.body.data.budget).toBe(800_000);
  });
});

