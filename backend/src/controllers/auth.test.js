import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

// Mock query function
const mockQueryFn = jest.fn();
const mockSendEmail = jest.fn().mockResolvedValue({ success: true });

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('../config/database.js', () => ({
  getDatabasePool: jest.fn(() => ({ query: mockQueryFn })),
}));

jest.unstable_mockModule('../config/email.js', () => ({
  sendEmail: mockSendEmail,
}));

// Dynamic import after mocking
let register, login;
beforeAll(async () => {
  const mod = await import('../../src/controllers/userController.js');
  register = mod.register;
  login = mod.login;
});

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
    mockQueryFn.mockReset();
    mockSendEmail.mockClear();
  });

  it('should return 201 with pending_verification status (no JWT)', async () => {
    const { req, res, next } = mockReqRes({
      email: 'test@example.com',
      password: 'StrongPass123!',
      role: 'student',
    });

    mockQueryFn
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([{}]);

    const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashedPassword123');
    const signSpy = jest.spyOn(jwt, 'sign');

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        status: 'pending_verification',
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'student',
          email_verified: false,
        },
      },
    });
    expect(mockSendEmail).toHaveBeenCalled();
    expect(signSpy).not.toHaveBeenCalled();
    hashSpy.mockRestore();
    signSpy.mockRestore();
  });

  it('should return 409 if email already registered', async () => {
    const { req, res, next } = mockReqRes({
      email: 'exists@example.com',
      password: 'StrongPass123!',
    });

    // Duplicate check returns existing user
    mockQueryFn.mockResolvedValueOnce([[ { id: 99, email: 'exists@example.com' } ]]);

    await register(req, res, next);

    // Spy on bcrypt.hash to ensure it was not invoked for duplicate email
    const hashSpy = jest.spyOn(bcrypt, 'hash');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(hashSpy).not.toHaveBeenCalled();
    hashSpy.mockRestore();
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

  it('should handle DB errors gracefully', async () => {
    const { req, res, next } = mockReqRes({
      email: 'error@example.com',
      password: 'StrongPass123!',
    });
    mockQueryFn.mockRejectedValueOnce(new Error('DB error'));

    await register(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('BE-02: User Login Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryFn.mockReset();
  });

  it('should return 200 with JWT on valid credentials', async () => {
    const { req, res, next } = mockReqRes({
      email: 'test@example.com',
      password: 'TestPass123!',
    });

    mockQueryFn.mockResolvedValueOnce([[
      { id: 1, email: 'test@example.com', password_hash: 'hashed', role: 'student', email_verified: true }
    ]]);
    const compareSpy = jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
    const signSpy = jest.spyOn(jwt, 'sign').mockReturnValueOnce('login-token');

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    compareSpy.mockRestore();
    signSpy.mockRestore();
  });

  it('should return 403 EMAIL_UNVERIFIED for unverified accounts', async () => {
    const { req, res, next } = mockReqRes({
      email: 'unverified@example.com',
      password: 'TestPass123!',
    });

    mockQueryFn.mockResolvedValueOnce([[
      { id: 1, email: 'unverified@example.com', password_hash: 'hashed', role: 'student', email_verified: false }
    ]]);
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: 'EMAIL_UNVERIFIED' }),
    });
  });

  it('should return 401 for non-existent email', async () => {
    const { req, res, next } = mockReqRes({
      email: 'unknown@example.com',
      password: 'TestPass123!',
    });
    mockQueryFn.mockResolvedValueOnce([[]]);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 for wrong password', async () => {
    const { req, res, next } = mockReqRes({
      email: 'test@example.com',
      password: 'WrongPass!',
    });
    mockQueryFn.mockResolvedValueOnce([[
      { id: 1, email: 'test@example.com', password_hash: 'hashed', role: 'student' }
    ]]);
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 400 for invalid email', async () => {
    const { req, res, next } = mockReqRes({ email: 'invalid', password: 'TestPass123!' });
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
