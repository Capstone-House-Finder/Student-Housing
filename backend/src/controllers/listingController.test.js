/**
 * Listing controller unit tests covering CRUD behavior.
 * Uses Jest ESM mocking to replace the DB pool.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the pool exported from app.js
const mockQuery = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: { query: mockQuery },
}));

// Import after mocking
let listingController;
beforeAll(async () => {
  const mod = await import('./listingController.js');
  listingController = mod;
});

function mockReqRes(body = {}, params = {}, user = null) {
  return {
    req: { body, params, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('createListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('creates listing with valid data and returns 201', async () => {
    const { req, res, next } = mockReqRes({
      title: 'Nice House',
      description: 'Cozy',
      location: 'City',
      price: 1200,
      property_type: 'apartment',
    }, {}, { id: 42 });

    // Simulate successful insert returning insertId
    mockQuery.mockResolvedValueOnce([{ insertId: 100 }]);

    await listingController.createListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 100 } });
  });

  it('returns 400 when required fields are missing', async () => {
    const { req, res, next } = mockReqRes({ title: 'Only title' }, {}, { id: 42 });
    await listingController.createListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const { req, res, next } = mockReqRes({ title: 't', description: 'd', location: 'l', price: 1, property_type: 'p' }, {});
    await listingController.createListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('getListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('returns listing when found', async () => {
    const { req, res, next } = mockReqRes({}, { id: 55 });
    const fakeRow = { id: 55, title: 'A' };
    mockQuery.mockResolvedValueOnce([[fakeRow]]);
    await listingController.getListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: fakeRow });
  });

  it('returns 404 when not found', async () => {
    const { req, res, next } = mockReqRes({}, { id: 999 });
    mockQuery.mockResolvedValueOnce([[]]);
    await listingController.getListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('updateListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('updates when owner and valid fields', async () => {
    const { req, res, next } = mockReqRes({ price: 2000 }, { id: 10 }, { id: 7 });
    // Owner check returns landlord_id 7
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 7 }]]);
    // Update query resolves
    mockQuery.mockResolvedValueOnce([{}]);
    await listingController.updateListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Listing 10 updated' });
  });

  it('returns 403 when not owner', async () => {
    const { req, res, next } = mockReqRes({ price: 2000 }, { id: 10 }, { id: 5 });
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 7 }]]);
    await listingController.updateListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when listing does not exist', async () => {
    const { req, res, next } = mockReqRes({ price: 2000 }, { id: 11 }, { id: 5 });
    mockQuery.mockResolvedValueOnce([[]]);
    await listingController.updateListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('deleteListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('deletes when owner', async () => {
    const { req, res, next } = mockReqRes({}, { id: 20 }, { id: 3 });
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 3 }]]);
    mockQuery.mockResolvedValueOnce([{}]);
    await listingController.deleteListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Listing 20 deleted' });
  });

  it('returns 403 when not owner', async () => {
    const { req, res, next } = mockReqRes({}, { id: 20 }, { id: 4 });
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 3 }]]);
    await listingController.deleteListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('listAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('returns array of listings', async () => {
    const { req, res, next } = mockReqRes();
    const rows = [{ id: 1 }, { id: 2 }];
    mockQuery.mockResolvedValueOnce([rows]);
    await listingController.listAll(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: rows });
  });
});
