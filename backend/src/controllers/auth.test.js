import { describe, it, expect, beforeEach, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

// Mock database pool
const mockPool = { query: jest.fn() };
jest.mock('../config/database.js', () => ({
  getDatabasePool: () => mockPool,
}));

// Auto-mock bcrypt and jsonwebtoken
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { register, login } from '../../src/controllers/userController.js';

function mockReqRes(body = {}, user = null) {
  return {
    req: { body, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('BE-01: User Registration Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  it('should return 201 with JWT on success', async () => {
    const { req, res, next } = mockReqRes({ email: 'test@example.com', password: 'StrongPass123!', role: 'student' });
    // first call: duplicate check -> no existing user
    mockPool.query.mockResolvedValueOnce([[]]);
    // bcrypt.hash mock
    bcrypt.hash.mockResolvedValueOnce('hashedPassword');
    // second call: insert -> return insertId
    mockPool.query.mockResolvedValueOnce([{ insertId: 1 }]);
    // jwt.sign mock
    jwt.sign.mockReturnValueOnce('fake-jwt-token');

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass123!', 12);
  });

  it('should return 409 if email already registered', async () => {
    const { req, res, next } = mockReqRes({ email: 'exists@example.com', password: 'StrongPass123!' });
    // duplicate check returns existing user
    mockPool.query.mockResolvedValueOnce([[ { id: 99 } ]]);
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid email', async () => {
    const { req, res, next } = mockReqRes({ email: 'bad', password: 'StrongPass123!' });
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for weak password', async () => {
    const { req, res, next } = mockReqRes({ email: 'test@example.com', password: 'short' });
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle DB errors', async () => {
    const { req, res, next } = mockReqRes({ email: 'error@example.com', password: 'TestPass123!' });
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));
    await register(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('BE-02: User Login Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  it('should return 200 with JWT on valid credentials', async () => {
    const { req, res, next } = mockReqRes({ email: 'test@example.com', password: 'TestPass123!' });
    mockPool.query.mockResolvedValueOnce([[ { id: 1, email: 'test@example.com', password_hash: 'hashed', role: 'student' } ]]);
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce('login-token');
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 401 for non-existent email', async () => {
    const { req, res, next } = mockReqRes({ email: 'unknown@example.com', password: 'TestPass123!' });
    mockPool.query.mockResolvedValueOnce([[]]);
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 for wrong password', async () => {
    const { req, res, next } = mockReqRes({ email: 'test@example.com', password: 'WrongPass!' });
    mockPool.query.mockResolvedValueOnce([[ { id: 1, email: 'test@example.com', password_hash: 'hashed', role: 'student' } ]]);
    bcrypt.compare.mockResolvedValueOnce(false);
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 400 for invalid email', async () => {
    const { req, res, next } = mockReqRes({ email: 'invalid', password: 'TestPass123!' });
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
