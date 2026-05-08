/* global beforeAll */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the pool exported from app.js
const mockQuery = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: { query: mockQuery },
}));

// Mock the email config to avoid real email operations and side effects during tests
jest.unstable_mockModule('../config/email.js', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
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
    // 1. Listing exists
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 2, title: 'Test Room', location: 'City' }]]);
    // 2. Student info
    mockQuery.mockResolvedValueOnce([[{ email: 'student@test.com', full_name: 'Alice' }]]);
    // 3. Landlord info
    mockQuery.mockResolvedValueOnce([[{ email: 'landlord@test.com', phone: '987654321' }]]);
    // 4. No existing conversation
    mockQuery.mockResolvedValueOnce([[]]);
    // 5. Insert returns insertId
    mockQuery.mockResolvedValueOnce([[{ insertId: 99 }]]);

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
    // 1. Listing exists
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 3, title: 'Room 2', location: 'Town' }]]);
    // 2. Student info
    mockQuery.mockResolvedValueOnce([[{ email: 's2@test.com', full_name: 'Bob' }]]);
    // 3. Landlord info
    mockQuery.mockResolvedValueOnce([[{ email: 'l2@test.com', phone: '111222333' }]]);
    // 4. Existing conversation
    mockQuery.mockResolvedValueOnce([[{ id: 55 }]]);

    await contactListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ 
      success: true, 
      data: { 
        conversationId: 55, 
        whatsappUrl: expect.stringContaining('https://wa.me/111222333') 
      } 
    });
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
