/**
 * Unit tests for reportController – BE-12 implementation.
 */
/* global beforeAll */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the pool exported from app.js
const mockQuery = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: { query: mockQuery },
}));

let reportController;
beforeAll(async () => {
  const mod = await import('./reportController.js');
  reportController = mod;
});

function mockReqRes(body = {}, user = { id: 10 }) {
  return {
    req: { body, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('submitReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('creates a report with valid data and returns 201', async () => {
    const { req, res, next } = mockReqRes({
      target_type: 'listing',
      target_id: 5,
      reason: 'Inappropriate content',
    });

    mockQuery.mockResolvedValueOnce([{}]); // INSERT result

    await reportController.submitReport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Report submitted successfully',
    });
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, 'listing', 5, 'Inappropriate content']
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const { req, res, next } = mockReqRes({ target_type: 'user', target_id: 2, reason: 'Spam' }, null);
    await reportController.submitReport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 for missing fields', async () => {
    const { req, res, next } = mockReqRes({ target_type: 'user' });
    await reportController.submitReport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
