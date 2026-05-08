import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

// Mock DB pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: { query: mockQuery },
}));

let getMetrics;

beforeAll(async () => {
  const mod = await import('./metricsController.js');
  getMetrics = mod.getMetrics;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockReset();
});

function mockReqRes(query = {}) {
  return {
    req: { query },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn().mockReturnThis(),
    },
    next: jest.fn(),
  };
}

describe('BE-15 Admin Platform Metrics', () => {
  it('returns JSON metrics', async () => {
    // mock each count query in metricsController.js (currently 8 queries)
    mockQuery
      .mockResolvedValueOnce([[{ total_users: 10 }]])
      .mockResolvedValueOnce([[{ total_students: 6 }]])
      .mockResolvedValueOnce([[{ total_landlords: 4 }]])
      .mockResolvedValueOnce([[{ total_listings: 5 }]])
      .mockResolvedValueOnce([[{ pending_listings: 1 }]])
      .mockResolvedValueOnce([[{ total_reviews: 20 }]])
      .mockResolvedValueOnce([[{ total_reports: 3 }]])
      .mockResolvedValueOnce([[{ pending_reports: 1 }]]);

    const { req, res, next } = mockReqRes();
    await getMetrics(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        total_users: 10,
        total_students: 6,
        total_landlords: 4,
        total_listings: 5,
        pending_listings: 1,
        total_reviews: 20,
        total_reports: 3,
        pending_reports: 1,
      },
    });
  });

  it('returns CSV when format=csv', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ total_users: 1 }]])
      .mockResolvedValueOnce([[{ total_students: 1 }]])
      .mockResolvedValueOnce([[{ total_landlords: 0 }]])
      .mockResolvedValueOnce([[{ total_listings: 1 }]])
      .mockResolvedValueOnce([[{ pending_listings: 0 }]])
      .mockResolvedValueOnce([[{ total_reviews: 0 }]])
      .mockResolvedValueOnce([[{ total_reports: 0 }]])
      .mockResolvedValueOnce([[{ pending_reports: 0 }]]);

    const { req, res, next } = mockReqRes({ format: 'csv' });
    await getMetrics(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.status).toHaveBeenCalledWith(200);
    
    const expectedCsv = 'metric,value\n' +
      'total_users,1\n' +
      'total_students,1\n' +
      'total_landlords,0\n' +
      'total_listings,1\n' +
      'pending_listings,0\n' +
      'total_reviews,0\n' +
      'total_reports,0\n' +
      'pending_reports,0';
    
    expect(res.send).toHaveBeenCalledWith(expectedCsv);
  });
});
