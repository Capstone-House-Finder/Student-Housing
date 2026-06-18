// changePassword.test.js – Change password endpoint test suite
import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import bcrypt from 'bcrypt';

// Mock the database pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../src/config/database.js', () => ({
  getDatabasePool: jest.fn(() => ({ 
    query: mockQuery,
    getConnection: jest.fn().mockResolvedValue({})
  })),
}));

let passwordResetController;

beforeAll(async () => {
  const mod = await import('../src/controllers/passwordResetController.js');
  passwordResetController = mod;
});

function mockReqRes({ body = {}, params = {}, user = null } = {}) {
  return {
    req: { body, params, user },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() },
    next: jest.fn(),
  };
}

describe('Change Password Controller', () => {
  it('successfully changes password when current password is correct and new password is valid', async () => {
    const passwordHash = await bcrypt.hash('OldPassword123!', 12);
    
    // Mock user retrieval
    mockQuery.mockResolvedValueOnce([[{ id: 1, email: 'student@example.com', password_hash: passwordHash, status: 'active' }]]);
    // Mock user update
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const { req, res, next } = mockReqRes({
      body: { currentPassword: 'OldPassword123!', newPassword: 'NewPassword123!' },
      user: { id: 1, role: 'student' }
    });

    await passwordResetController.changePassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Password changed successfully' });
  });

  it('rejects when validation fails (e.g. weak password)', async () => {
    const { req, res, next } = mockReqRes({
      body: { currentPassword: 'OldPassword123!', newPassword: 'weak' },
      user: { id: 1, role: 'student' }
    });

    await passwordResetController.changePassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        message: 'Invalid input'
      })
    }));
  });

  it('rejects when current password does not match', async () => {
    const passwordHash = await bcrypt.hash('OldPassword123!', 12);
    mockQuery.mockResolvedValueOnce([[{ id: 1, email: 'student@example.com', password_hash: passwordHash, status: 'active' }]]);

    const { req, res, next } = mockReqRes({
      body: { currentPassword: 'WrongPassword123!', newPassword: 'NewPassword123!' },
      user: { id: 1, role: 'student' }
    });

    await passwordResetController.changePassword(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Incorrect current password' } });
  });
});
