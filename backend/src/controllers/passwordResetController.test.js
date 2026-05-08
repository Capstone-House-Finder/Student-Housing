// Tests for Password Reset Controller (BE-03)

import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

// Mock the database pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../config/database.js', () => ({
  getDatabasePool: jest.fn(() => ({ query: mockQuery })),
}));

// Mock the email config to avoid real email operations
jest.unstable_mockModule('../config/email.js', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

let forgotPassword, resetPassword;

beforeAll(async () => {
  const mod = await import('./passwordResetController.js');
  forgotPassword = mod.forgotPassword;
  resetPassword = mod.resetPassword;
});


function mockReqRes(body = {}, user = null) {
  return {
    req: { body, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('BE-03: Forgot Password Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('responds with success message when email exists and suspends account', async () => {
    const { req, res, next } = mockReqRes({ email: 'user@example.com' });
    // SELECT user
    mockQuery.mockResolvedValueOnce([[{ id: 5, status: 'active' }]]);
    // INSERT token (upsert)
    mockQuery.mockResolvedValueOnce([{}]);
    // UPDATE users status to suspended
    mockQuery.mockResolvedValueOnce([{}]);

    await forgotPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'If the email is registered, a reset link will be sent.' });
  });

  it('responds with success message even when email does not exist', async () => {
    const { req, res, next } = mockReqRes({ email: 'nonexistent@example.com' });
    // SELECT returns empty
    mockQuery.mockResolvedValueOnce([[]]);

    await forgotPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'If the email is registered, a reset link will be sent.' });
    // No further DB calls
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

describe('BE-03: Reset Password Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('resets password when token is valid and not used', async () => {
    const { req, res, next } = mockReqRes({ token: 'validtoken', password: 'NewPass123!' });
    // SELECT token record
    mockQuery.mockResolvedValueOnce([[{ user_id: 5, expires_at: new Date(Date.now() + 3600000), used: 0 }]]);
    // UPDATE users password and status
    mockQuery.mockResolvedValueOnce([{}]);
    // UPDATE token used flag
    mockQuery.mockResolvedValueOnce([{}]);

    await resetPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password has been reset.' });
  });

  it('returns 400 when token is invalid or used', async () => {
    const { req, res, next } = mockReqRes({ token: 'badtoken', password: 'NewPass123!' });
    // SELECT returns empty (no token)
    mockQuery.mockResolvedValueOnce([[]]);

    await resetPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Invalid or expired token' } });
  });
});
