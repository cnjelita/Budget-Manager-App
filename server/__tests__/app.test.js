const request = require('supertest');

// Stub mongoose connect so tests don't need a real DB
jest.mock('../config/db', () => jest.fn().mockResolvedValue(undefined));

// Stub mongoose model operations used by auth middleware
jest.mock('../models/User', () => {
  const mockUser = {
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    created_at: new Date(),
    matchPassword: jest.fn().mockResolvedValue(true),
  };
  const Model = jest.fn().mockImplementation(() => mockUser);
  Model.findOne = jest.fn();
  Model.findById = jest.fn();
  Model.create = jest.fn();
  return Model;
});

const app = require('../server');

describe('Health check', () => {
  it('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('404 handler', () => {
  it('unknown routes return 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth routes — input validation', () => {
  it('POST /api/auth/register rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('POST /api/auth/login rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notanemail', password: 'abc123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Protected routes — no token', () => {
  it('GET /api/expenses returns 401 without token', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/budgets returns 401 without token', async () => {
    const res = await request(app).get('/api/budgets');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/categories returns 401 without token', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
