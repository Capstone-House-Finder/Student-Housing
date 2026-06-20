import crypto from 'crypto';
import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const mockQuery = jest.fn();
const mockSendEmail = jest.fn().mockResolvedValue({ success: true });

jest.unstable_mockModule('../config/database.js', () => ({
  getDatabasePool: jest.fn(() => ({ query: mockQuery })),
}));

jest.unstable_mockModule('../config/email.js', () => ({
  sendEmail: mockSendEmail,
}));

let verifyEmail, resendVerification, resetRateLimitsForTesting;
let requireVerifiedEmail;

function mockReqRes({ body = {}, query = {}, ip = '127.0.0.1', headers = {} } = {}) {
  return {
    req: {
      body,
      query,
      ip,
      headers: { 'x-forwarded-for': ip, ...headers },
    },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    },
    next: jest.fn(),
  };
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

beforeAll(async () => {
  const mod = await import('./emailVerificationController.js');
  verifyEmail = mod.verifyEmail;
  resendVerification = mod.resendVerification;
  resetRateLimitsForTesting = mod.resetRateLimitsForTesting;

  const middleware = await import('../middleware/verifyEmail.js');
  requireVerifiedEmail = middleware.requireVerifiedEmail;
});

describe('Email Verification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockSendEmail.mockClear();
    resetRateLimitsForTesting();
  });

  describe('verifyEmail', () => {
    it('returns success and JWT when token is valid', async () => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const { req, res, next } = mockReqRes({ body: { token: rawToken } });

      mockQuery
        .mockResolvedValueOnce([[{ id: 10, user_id: 5, expires_at: new Date(Date.now() + 3600000), used: false }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ id: 5, email: 'user@example.com', role: 'student', email_verified: true }]]);

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ email_verified: true }),
          token: expect.any(String),
          refreshToken: expect.any(String),
        }),
      }));
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE email_verifications SET used = TRUE WHERE id = ? AND used = FALSE AND expires_at > NOW()',
        [10]
      );
    });

    it('returns INVALID_TOKEN for unknown token hash', async () => {
      const { req, res, next } = mockReqRes({ body: { token: 'unknown-token' } });
      mockQuery.mockResolvedValueOnce([[]]);

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
      });
    });

    it('returns TOKEN_ALREADY_USED for consumed token', async () => {
      const { req, res, next } = mockReqRes({ body: { token: 'used-token' } });
      mockQuery.mockResolvedValueOnce([[{ id: 1, user_id: 2, expires_at: new Date(Date.now() + 3600000), used: true }]]);

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'TOKEN_ALREADY_USED',
          resendEndpoint: '/api/auth/resend-verification',
        }),
      });
    });

    it('returns TOKEN_EXPIRED for expired token', async () => {
      const { req, res, next } = mockReqRes({ body: { token: 'expired-token' } });
      mockQuery.mockResolvedValueOnce([[{
        id: 1,
        user_id: 2,
        expires_at: new Date(Date.now() - 3600000),
        used: false,
      }]]);

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'TOKEN_EXPIRED',
          resendEndpoint: '/api/auth/resend-verification',
        }),
      });
    });

    it('looks up token by SHA-256 hash, not raw value', async () => {
      const rawToken = 'abc123';
      const { req, res, next } = mockReqRes({ body: { token: rawToken } });
      mockQuery.mockResolvedValueOnce([[]]);

      await verifyEmail(req, res, next);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, user_id, expires_at, used FROM email_verifications WHERE token_hash = ? LIMIT 1',
        [hashToken(rawToken)]
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('resendVerification', () => {
    it('invalidates old tokens, creates new token, and sends email for unverified user', async () => {
      const { req, res, next } = mockReqRes({ body: { email: 'User@Example.com' } });

      mockQuery
        .mockResolvedValueOnce([[{ id: 7, status: 'active' }]])
        .mockResolvedValueOnce([[{ email_verified: false }]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]);

      await resendVerification(req, res, next);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, status FROM users WHERE email = ? LIMIT 1',
        ['user@example.com']
      );
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE email_verifications SET expires_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used = FALSE',
        [7]
      );
      expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'user@example.com' }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If the email is registered, a new verification link will be sent.',
      });
    });

    it('returns same success response when email is not registered', async () => {
      const { req, res, next } = mockReqRes({ body: { email: 'missing@example.com' } });
      mockQuery.mockResolvedValueOnce([[]]);

      await resendVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'If the email is registered, a new verification link will be sent.',
      });
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('returns same success response for already-verified user without sending email', async () => {
      const { req, res, next } = mockReqRes({ body: { email: 'verified@example.com' } });
      mockQuery
        .mockResolvedValueOnce([[{ id: 3, status: 'active' }]])
        .mockResolvedValueOnce([[{ email_verified: true }]]);

      await resendVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockSendEmail).not.toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('returns 429 with Retry-After when rate limit is exceeded', async () => {
      const email = 'rate@example.com';
      for (let i = 0; i < 5; i += 1) {
        mockQuery.mockResolvedValueOnce([[]]);
        const { req, res, next } = mockReqRes({ body: { email }, ip: '10.0.0.1' });
        await resendVerification(req, res, next);
      }

      mockQuery.mockResolvedValueOnce([[]]);
      const { req, res, next } = mockReqRes({ body: { email }, ip: '10.0.0.1' });
      await resendVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ retryAfter: expect.any(Number) }),
      }));
    });
  });
});

describe('requireVerifiedEmail middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('blocks unverified users with EMAIL_UNVERIFIED and resend hint', async () => {
    mockQuery.mockResolvedValueOnce([[{ email_verified: false }]]);
    const req = { user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await requireVerifiedEmail(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        code: 'EMAIL_UNVERIFIED',
        resendEndpoint: '/api/auth/resend-verification',
      }),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows verified users through', async () => {
    mockQuery.mockResolvedValueOnce([[{ email_verified: true }]]);
    const req = { user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await requireVerifiedEmail(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
