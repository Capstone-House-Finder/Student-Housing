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
      description: 'A very cozy and nice house for students.',
      location: 'City',
      price: 1200,
      property_type: 'apartment',
      bedrooms: 2,
      bathrooms: 1,
      square_meters: 500
    }, {}, { id: 42 });

    // 1. Insert listing
    mockQuery.mockResolvedValueOnce([{ insertId: 100 }]);

    await listingController.createListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 100 } });
  });

  it('creates listing with amenities and links them', async () => {
    const { req, res, next } = mockReqRes({
      title: 'House Title',
      description: 'A wonderful house with many amenities.',
      location: 'Town Center',
      price: 800,
      property_type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      square_meters: 1000,
      amenities: ['WiFi', 'Parking'],
    }, {}, { id: 42 });

    // 1. Insert listing
    mockQuery.mockResolvedValueOnce([{ insertId: 101 }]);
    // 2. WiFi: SELECT check
    mockQuery.mockResolvedValueOnce([[{ id: 1 }]]);
    // 3. WiFi: Link
    mockQuery.mockResolvedValueOnce([{}]);
    // 4. Parking: SELECT check
    mockQuery.mockResolvedValueOnce([[{ id: 2 }]]);
    // 5. Parking: Link
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
    const { req, res, next } = mockReqRes({ 
      title: 'Nice House', 
      description: 'A very cozy and nice house for students.', 
      location: 'City', 
      price: 1, 
      property_type: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      square_feet: 100
    }, {}, null);
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
    mockQuery.mockResolvedValueOnce([[]]); // amenities
    mockQuery.mockResolvedValueOnce([[]]); // photos

    await listingController.getListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { ...fakeRow, amenities: [], photos: [] } });
  });

  it('returns 404 when not found', async () => {
    const { req, res, next } = mockReqRes({}, { id: 999 });
    mockQuery.mockResolvedValueOnce([[]]);
    await listingController.getListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('searchListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  it('returns array of listings with pagination meta', async () => {
    const { req, res, next } = mockReqRes();
    req.query = { page: '1', limit: '20' };
    const rows = [{ id: 1, title: 'Listing 1' }, { id: 2, title: 'Listing 2' }];
    const total = 2;
    
    // 1. Total count query
    mockQuery.mockResolvedValueOnce([[{ total }]]);
    // 2. Listings query
    mockQuery.mockResolvedValueOnce([rows]);
    // 3. Photo query for first listing
    mockQuery.mockResolvedValueOnce([[{ id: 10, url: 'img1' }]]);
    // 4. Photo query for second listing
    mockQuery.mockResolvedValueOnce([[]]);

    await listingController.searchListings(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        listings: [
          { id: 1, title: 'Listing 1', photos: [{ id: 10, url: 'img1' }] },
          { id: 2, title: 'Listing 2', photos: [] }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      }
    });
  });
});
