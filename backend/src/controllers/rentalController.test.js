/**
 * Unit tests for rental controller – BE-10
 */
/* global beforeAll */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the pool from app.js
const mockQuery = jest.fn();
const mockGetConnection = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: {
    query: mockQuery,
    getConnection: mockGetConnection,
  },
}));

let rentalController;
beforeAll(async () => {
  const mod = await import('./rentalController.js');
  rentalController = mod;
});

function mockReqRes(body = {}, user = { id: 1, role: 'landlord' }) {
  return {
    req: { body, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('createRental', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockGetConnection.mockReset();
  });

  it('creates rental with valid data and returns 201', async () => {
    const { req, res, next } = mockReqRes({
      student_id: 2,
      listing_id: 5,
      start_date: '2026-06-01',
      end_date: '2026-12-01',
    });

    // Mock listing lookup
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 1 }]]);
    // Mock transaction connection
    const mockConn = {
      beginTransaction: jest.fn().mockResolvedValue(),
      query: jest.fn()
        .mockResolvedValueOnce([{ insertId: 10 }]) // insert rental
        .mockResolvedValueOnce([{}]), // update listing status
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };
    mockGetConnection.mockResolvedValueOnce(mockConn);

    await rentalController.createRental(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 10 } });
    expect(mockConn.beginTransaction).toHaveBeenCalled();
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });

  it('returns 400 when required fields missing', async () => {
    const { req, res, next } = mockReqRes({ listing_id: 5, start_date: '2026-06-01' });
    await rentalController.createRental(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const { req, res, next } = mockReqRes({ student_id: 2, listing_id: 5, start_date: '2026-06-01' }, null);
    await rentalController.createRental(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 for insufficient role', async () => {
    const { req, res, next } = mockReqRes({ student_id: 2, listing_id: 5, start_date: '2026-06-01' }, { id: 3, role: 'student' });
    await rentalController.createRental(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when listing not found', async () => {
    const { req, res, next } = mockReqRes({ student_id: 2, listing_id: 999, start_date: '2026-06-01' });
    mockQuery.mockResolvedValueOnce([[]]); // No listing row
    await rentalController.createRental(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when landlord does not own listing', async () => {
    const { req, res, next } = mockReqRes({ student_id: 2, listing_id: 5, start_date: '2026-06-01' }, { id: 2, role: 'landlord' });
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 1 }]]);
    await rentalController.createRental(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
