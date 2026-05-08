/**
 * Unit tests for reviewController – BE-11 endpoints.
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';

// Mock the DB pool used in the controller
const mockQuery = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: { query: mockQuery },
}));

let reviewController;

beforeAll(async () => {
  const mod = await import('./reviewController.js');
  reviewController = mod;
});

function mockReqRes({ body = {}, params = {}, user = null } = {}) {
  return {
    req: { body, params, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('createReview', () => {
  it('creates review when student has confirmed rental', async () => {
    const { req, res, next } = mockReqRes({
      body: { rating: 4, comment: 'Great place' },
      params: { id: 10 },
      user: { id: 2 },
    });
    // rental exists
    mockQuery.mockResolvedValueOnce([[{ id: 1 }]]);
    // insert review returns insertId
    mockQuery.mockResolvedValueOnce([{ insertId: 55 }]);

    await reviewController.createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 55 } });
  });

  it('fails when unauthenticated', async () => {
    const { req, res, next } = mockReqRes({
      body: { rating: 5 },
      params: { id: 10 },
      user: null,
    });
    await reviewController.createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('fails when rating missing', async () => {
    const { req, res, next } = mockReqRes({
      body: { comment: 'Nice' },
      params: { id: 10 },
      user: { id: 2 },
    });
    await reviewController.createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('fails when rating out of range', async () => {
    const { req, res, next } = mockReqRes({
      body: { rating: 6 },
      params: { id: 10 },
      user: { id: 2 },
    });
    await reviewController.createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('fails when student has no rental', async () => {
    const { req, res, next } = mockReqRes({
      body: { rating: 4 },
      params: { id: 10 },
      user: { id: 2 },
    });
    mockQuery.mockResolvedValueOnce([[]]); // no rental rows
    await reviewController.createReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('replyReview', () => {
  it('allows landlord to reply when none exists', async () => {
    const { req, res, next } = mockReqRes({
      body: { reply: 'Thank you' },
      params: { reviewId: 33 },
      user: { id: 1 }, // landlord id
    });
    // review exists, get listing_id
    mockQuery.mockResolvedValueOnce([[{ listing_id: 10 }]]);
    // listing exists with landlord_id 1
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 1 }]]);
    // no existing reply
    mockQuery.mockResolvedValueOnce([[]]);
    // insert reply returns insertId
    mockQuery.mockResolvedValueOnce([{ insertId: 77 }]);

    await reviewController.replyReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 77 } });
  });

  it('rejects unauthenticated', async () => {
    const { req, res, next } = mockReqRes({
      body: { reply: 'Hi' },
      params: { reviewId: 33 },
      user: null,
    });
    await reviewController.replyReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects missing reply content', async () => {
    const { req, res, next } = mockReqRes({
      body: {},
      params: { reviewId: 33 },
      user: { id: 1 },
    });
    await reviewController.replyReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects when review not found', async () => {
    const { req, res, next } = mockReqRes({
      body: { reply: 'Nice' },
      params: { reviewId: 99 },
      user: { id: 1 },
    });
    mockQuery.mockResolvedValueOnce([[]]); // review rows empty
    await reviewController.replyReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('rejects when not the owning landlord', async () => {
    const { req, res, next } = mockReqRes({
      body: { reply: 'Thanks' },
      params: { reviewId: 33 },
      user: { id: 2 }, // different landlord
    });
    mockQuery.mockResolvedValueOnce([[{ listing_id: 10 }]]);
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 1 }]]); // listing owned by 1
    await reviewController.replyReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects when a reply already exists', async () => {
    const { req, res, next } = mockReqRes({
      body: { reply: 'Second reply' },
      params: { reviewId: 33 },
      user: { id: 1 },
    });
    mockQuery.mockResolvedValueOnce([[{ listing_id: 10 }]]);
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 1 }]]);
    // existing reply present
    mockQuery.mockResolvedValueOnce([[{ id: 55 }]]);
    await reviewController.replyReview(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
