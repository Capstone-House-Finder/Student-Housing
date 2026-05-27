// report.test.js – Report submission and admin moderation test suite
import { describe, it, expect, beforeAll, jest } from '@jest/globals';

// Mock DB pool used by controller
const mockQuery = jest.fn();
jest.unstable_mockModule('../app.js', () => ({
  pool: { query: mockQuery },
}));

let reportController;

beforeAll(async () => {
  const mod = await import('./reportController.js');
  reportController = mod;
});

function mockReqRes({ body = {}, params = {}, user = null } = {}) {
  return {
    req: { body, params, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('submitReport', () => {
  it('allows authenticated student to submit a valid report', async () => {
    const { req, res, next } = mockReqRes({
      body: { target_type: 'listing', target_id: 10, reason: 'Spam' },
      user: { id: 5 },
    });
    await reportController.submitReport(req, res, next);
    expect(mockQuery).toHaveBeenCalledWith(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
      [5, 'listing', 10, 'Spam']
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Report submitted successfully' });
  });

  it('rejects unauthenticated request', async () => {
    const { req, res, next } = mockReqRes({ body: { target_type: 'user', target_id: 2, reason: 'Abuse' }, user: null });
    await reportController.submitReport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects missing fields', async () => {
    const { req, res, next } = mockReqRes({ body: { target_type: 'user' }, user: { id: 3 } });
    await reportController.submitReport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects invalid target_type', async () => {
    const { req, res, next } = mockReqRes({ body: { target_type: 'invalid', target_id: 1, reason: 'test' }, user: { id: 1 } });
    await reportController.submitReport(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('admin endpoints (mocked admin middleware assumed)', () => {
  it('gets all reports for admin', async () => {
    const mockRows = [{ id: 1, target_type: 'listing' }];
    mockQuery.mockResolvedValueOnce([mockRows]);
    const { req, res, next } = mockReqRes({ user: { id: 1, role: 'admin' } });
    await reportController.getAllReports(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockRows });
  });

  it('updates report status with valid status', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const { req, res, next } = mockReqRes({
      params: { id: 2 },
      body: { status: 'resolved' },
      user: { id: 1, role: 'admin' },
    });
    await reportController.updateReportStatus(req, res, next);
    expect(mockQuery).toHaveBeenCalledWith('UPDATE reports SET status = ? WHERE id = ?', ['resolved', 2]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Report resolved' });
  });

  it('rejects invalid status update', async () => {
    const { req, res, next } = mockReqRes({ params: { id: 3 }, body: { status: 'unknown' }, user: { id: 1, role: 'admin' } });
    await reportController.updateReportStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
