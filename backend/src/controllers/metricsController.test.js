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
    // mock each count query
    mockQuery
      .mockResolvedValueOnce([[{ total_users: 10 }]])
      .mockResolvedValueOnce([[{ total_listings: 5 }]])
      .mockResolvedValueOnce([[{ active_rentals: 2 }]])
      .mockResolvedValueOnce([[{ total_reports: 3 }]])
      .mockResolvedValueOnce([[{ flagged_content: 1 }]]);
    const { req, res, next } = mockReqRes();
    await getMetrics(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        total_users: 10,
        total_listings: 5,
        active_rentals: 2,
        total_reports: 3,
        flagged_content: 1,
      },
    });
  });

  it('returns CSV when format=csv', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ total_users: 1 }]])
      .mockResolvedValueOnce([[{ total_listings: 1 }]])
      .mockResolvedValueOnce([[{ active_rentals: 0 }]])
      .mockResolvedValueOnce([[{ total_reports: 0 }]])
      .mockResolvedValueOnce([[{ flagged_content: 0 }]]);
    const { req, res, next } = mockReqRes({ format: 'csv' });
    await getMetrics(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.status).toHaveBeenCalledWith(200);
    const expectedCsv = 'metric,value\n' +
      'total_users,1\n' +
      'total_listings,1\n' +
      'active_rentals,0\n' +
      'total_reports,0\n' +
      'flagged_content,0';
    expect(res.send).toHaveBeenCalledWith(expectedCsv);
  });
});
