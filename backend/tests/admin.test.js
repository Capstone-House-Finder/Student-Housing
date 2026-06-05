// admin.test.js – Admin panel test suite (user & listing moderation)
import { describe, it, expect, beforeAll, jest } from '@jest/globals';

// Mock the database pool - controllers use getDatabasePool() from ../src/config/database.js
const mockQuery = jest.fn();
jest.unstable_mockModule('../src/config/database.js', () => ({
  getDatabasePool: jest.fn(() => ({ 
    query: mockQuery,
    getConnection: jest.fn().mockResolvedValue({})
  })),
}));

let userController, adminController;

beforeAll(async () => {
  // Controllers are exported from userController.js and admin routes use userController functions
  const userMod = await import('../src/controllers/userController.js');
  userController = userMod;
});

function mockReqRes({ body = {}, params = {}, user = null } = {}) {
  return {
    req: { body, params, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('Admin – Get All Users', () => {
  it('returns list of users for admin', async () => {
    const mockRows = [{ id: 1, email: 'a@b.com' }];
    mockQuery.mockResolvedValueOnce([mockRows]);
    const { req, res, next } = mockReqRes({ user: { id: 99, role: 'admin' } });
    await userController.getAllUsers(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockRows });
  });
});

describe('Admin – Suspend User', () => {
  it('suspends an active user', async () => {
    // First query checks existence
    mockQuery.mockResolvedValueOnce([[{ id: 5 }]]);
    // Update query
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const { req, res, next } = mockReqRes({ params: { id: '5' }, user: { id: 1, role: 'admin' } });
    await userController.suspendUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User suspended' });
  });

  it('rejects if user not found or already suspended', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no matching user
    const { req, res, next } = mockReqRes({ params: { id: '999' }, user: { id: 1, role: 'admin' } });
    await userController.suspendUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Admin – Delete (Anonymize) User', () => {
  it('deletes user and related data', async () => {
    // Assume each query succeeds; we only need to ensure they are called in order.
    mockQuery.mockResolvedValueOnce([{}]); // delete profile
    mockQuery.mockResolvedValueOnce([{}]); // delete listings
    mockQuery.mockResolvedValueOnce([{}]); // delete rentals
    mockQuery.mockResolvedValueOnce([{}]); // delete reviews
    mockQuery.mockResolvedValueOnce([{}]); // update users table
    const { req, res, next } = mockReqRes({ params: { id: '7' }, user: { id: 1, role: 'admin' } });
    await userController.deleteUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'User deleted (anonymized) and related data removed',
    });
  });
});

describe('Admin – Listing Moderation', () => {
  it('gets flagged admin listings', async () => {
    const mockRows = [{ id: 12, flagged: true }];
    mockQuery.mockResolvedValueOnce([mockRows]);
    const { req, res, next } = mockReqRes({ user: { id: 1, role: 'admin' } });
    await userController.getAdminListings(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockRows });
  });

  it('verifies a listing', async () => {
    // Update affected rows
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]); // update query
    mockQuery.mockResolvedValueOnce([[{ id: 22, verified: true }]]); // select after update
    const { req, res, next } = mockReqRes({ params: { id: '22' }, user: { id: 1, role: 'admin' } });
    await userController.verifyListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 22, verified: true } });
  });

  it('fails verification when listing not found', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]); // no rows updated
    const { req, res, next } = mockReqRes({ params: { id: '999' }, user: { id: 1, role: 'admin' } });
    await userController.verifyListing(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes a listing as admin (soft delete)', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const { req, res, next } = mockReqRes({ params: { id: '33' }, user: { id: 1, role: 'admin' } });
    await userController.deleteListingAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Listing 33 deleted' });
  });

  it('fails delete when listing not found', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const { req, res, next } = mockReqRes({ params: { id: '999' }, user: { id: 1, role: 'admin' } });
    await userController.deleteListingAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
