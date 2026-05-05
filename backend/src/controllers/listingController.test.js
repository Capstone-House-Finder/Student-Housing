/**
 * Listing controller unit tests covering CRUD behavior.
 * Uses Jest ESM mocking to replace the DB pool.
 */
/* global beforeAll */
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

function mockReqRes(body = {}, params = {}, user = { id: 1 }) {
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
    // Mock the SELECT amenity IDs query (empty since no amenities provided)
    // pool.query returns [rows, metadata], so mock as [[]]
    mockQuery.mockResolvedValueOnce([[]]);

    await listingController.createListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 100 } });
  });

  it('creates listing with amenities and links them', async () => {
    const { req, res, next } = mockReqRes({
      title: 'House',
      description: 'Desc',
      location: 'Town',
      price: 800,
      property_type: 'house',
      amenities: ['WiFi', 'Parking'],
    }, {}, { id: 42 });

    // First query: insert listing
    mockQuery.mockResolvedValueOnce([{ insertId: 101 }]);
    // Second query: SELECT amenity IDs by name - returns [rows, metadata]
    mockQuery.mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]]);
    // Third query: insert amenities linking
    mockQuery.mockResolvedValueOnce([{}]);

    await listingController.createListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 101 } });
  });

  it('returns 400 when required fields are missing', async () => {
    const { req, res, next } = mockReqRes({ title: 'Only title' }, {}, { id: 42 });
    await listingController.createListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const { req, res, next } = mockReqRes({ title: 't', description: 'd', location: 'l', price: 1, property_type: 'p' }, {}, null);
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
    // First query returns listing row
    mockQuery.mockResolvedValueOnce([[fakeRow]]);
    // Second query returns amenities (empty for this test)
    mockQuery.mockResolvedValueOnce([[]]);
    await listingController.getListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { ...fakeRow, amenities: [] } });
  });

  it('getListing includes amenities when present', async () => {
    const { req, res, next } = mockReqRes({}, { id: 55 });
    const fakeRow = { id: 55, title: 'A' };
    const fakeAmenities = [{ id: 1, name: 'WiFi' }, { id: 2, name: 'Parking' }];
    mockQuery.mockResolvedValueOnce([[fakeRow]]);
    mockQuery.mockResolvedValueOnce([fakeAmenities]);
    await listingController.getListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { ...fakeRow, amenities: fakeAmenities } });
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

  it('updates amenities when provided', async () => {
    const { req, res, next } = mockReqRes({ amenities: ['Gym', 'Pool'] }, { id: 12 }, { id: 7 });
    // Owner check
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 7 }]]);
    // Delete existing amenities
    mockQuery.mockResolvedValueOnce([{}]);
    // SELECT amenity IDs by name - returns [rows, metadata]
    mockQuery.mockResolvedValueOnce([[{ id: 3 }, { id: 4 }]]);
    // Insert new amenities linking
    mockQuery.mockResolvedValueOnce([{}]);
    await listingController.updateListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Listing 12 updated' });
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
  // existing deleteListing tests remain unchanged
});

describe('updateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('updates status when owner and valid status', async () => {
    const { req, res, next } = mockReqRes({ status: 'rented' }, { id: 15 }, { id: 7 });
    // Owner check returns listing with landlord_id 7
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 7, status: 'available' }]]);
    // Update query resolves
    mockQuery.mockResolvedValueOnce([{}]);
    // Return updated listing
    mockQuery.mockResolvedValueOnce([[{ id: 15, status: 'rented', landlord_id: 7 }]]);
    await listingController.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 15, status: 'rented', landlord_id: 7 } });
  });

  it('returns 400 for invalid status', async () => {
    const { req, res, next } = mockReqRes({ status: 'invalid' }, { id: 20 }, { id: 7 });
    await listingController.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 when not the owner', async () => {
    const { req, res, next } = mockReqRes({ status: 'available' }, { id: 30 }, { id: 5 });
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 9, status: 'available' }]]);
    await listingController.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when listing not found', async () => {
    const { req, res, next } = mockReqRes({ status: 'available' }, { id: 99 }, { id: 7 });
    mockQuery.mockResolvedValueOnce([[]]); // No listing found
    await listingController.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('deletes when owner', async () => {
    const { req, res, next } = mockReqRes({}, { id: 20 }, { id: 3 });
    mockQuery.mockResolvedValueOnce([[{ landlord_id: 3 }]]);
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
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

describe('searchListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('returns array of listings with pagination meta', async () => {
    const { req, res, next } = mockReqRes();
    const rows = [{ id: 1 }, { id: 2 }];
    const total = 2;
    // First query returns rows
    mockQuery.mockResolvedValueOnce([rows]);
    // Second query returns total count
    mockQuery.mockResolvedValueOnce([[{ total }]]);
    await listingController.searchListings(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: rows,
      meta: { total, page: 1, limit: 20 },
    });
  });
});
