/* global beforeAll */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the pool exported from app.js
const mockQuery = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: { query: mockQuery },
}));

let contactListing;
beforeAll(async () => {
  const mod = await import('./contactController.js');
  contactListing = mod.contactListing;
});

function mockReqRes(params = {}, user = { id: 1 }) {
  return {
    req: { params, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('BE-09: Contact Listing Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('creates a new conversation and returns 201 with WhatsApp URL', async () => {
    const { req, res, next } = mockReqRes({ id: 10 }, { id: 5 });
    // Listing exists
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 2 }]]);
    // No existing conversation
    mockQuery.mockResolvedValueOnce([[]]);
    // Insert returns insertId
    mockQuery.mockResolvedValueOnce([[{ insertId: 99 }]]);
    // Mock student profile query
    mockQuery.mockResolvedValueOnce([[{ full_name: 'Alice', phone: '123456789' }]]);
    // Mock landlord profile query
    mockQuery.mockResolvedValueOnce([[{ phone: '987654321' }]]);

    await contactListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(true);
    expect(jsonArg.data.conversationId).toBe(99);
    // Verify URL format
    expect(jsonArg.data.whatsappUrl).toMatch(/^https:\/\/wa\.me\/987654321\?text=/);
  });

  it('returns existing conversation id with 200', async () => {
    const { req, res, next } = mockReqRes({ id: 11 }, { id: 6 });
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 3 }]]); // listing lookup
    mockQuery.mockResolvedValueOnce([[{ id: 55 }]]); // existing conversation

    await contactListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { conversationId: 55 } });
  });

  it('returns 404 when listing not found', async () => {
    const { req, res, next } = mockReqRes({ id: 999 }, { id: 7 });
    mockQuery.mockResolvedValueOnce([[]]); // no listing
    await contactListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 401 when unauthenticated', async () => {
    const { req, res, next } = mockReqRes({ id: 12 }, null);
    await contactListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
