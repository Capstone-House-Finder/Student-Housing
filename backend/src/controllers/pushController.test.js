import { jest } from '@jest/globals';

const query = jest.fn();

jest.unstable_mockModule('../config/database.js', () => ({
  getDatabasePool: () => ({ query }),
}));

const pushController = await import('./pushController.js');

describe('pushController', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('registers a valid Expo push token for the authenticated user', async () => {
    query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const req = { user: { id: 42 }, body: { token: 'ExponentPushToken[test]', platform: 'ios' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await pushController.registerToken(req, res, next);

    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO push_tokens'), [42, 'ExponentPushToken[test]', 'ios']);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Push token registered' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid platform values', async () => {
    const req = { user: { id: 42 }, body: { token: 'token', platform: 'web' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await pushController.registerToken(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(query).not.toHaveBeenCalled();
  });
});
