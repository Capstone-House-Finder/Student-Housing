import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';

// Mock DB pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../config/database.js', () => ({
  getDatabasePool: jest.fn(() => ({ query: mockQuery })),
}));

let getAllUsers, suspendUser, deleteUser;

beforeAll(async () => {
  const mod = await import('../../src/controllers/userController.js');
  getAllUsers = mod.getAllUsers;
  suspendUser = mod.suspendUser;
  deleteUser = mod.deleteUser;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockReset();
});

function mockReqRes(params = {}, user = { id: 1, role: 'admin' }) {
  return {
    req: { params, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('BE-13 Admin User Management', () => {
  it('GET /admin/users returns list of users', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, email: 'a@example.com', role: 'admin', status: 'active' }]]);
    const { req, res, next } = mockReqRes();
    await getAllUsers(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, email: 'a@example.com', role: 'admin', status: 'active' }] });
  });

  it('PATCH suspendUser suspends active user', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 2 }]]); // select
    mockQuery.mockResolvedValueOnce(); // update
    const { req, res, next } = mockReqRes({ id: '2' });
    await suspendUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User suspended' });
  });

  it('PATCH suspendUser returns error for non‑active user', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no rows
    const { req, res, next } = mockReqRes({ id: '99' });
    await suspendUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'User not found or already suspended' } });
  });

  it('DELETE deleteUser anonymizes and removes data', async () => {
    // mock deletions (no return needed)
    mockQuery.mockResolvedValue();
    const { req, res, next } = mockReqRes({ id: '3' });
    await deleteUser(req, res, next);
    // Expect at least a few queries executed (profile, listings, rentals, reviews, update user)
    expect(mockQuery).toHaveBeenCalledTimes(5);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User deleted (anonymized) and related data removed' });
  });
});
