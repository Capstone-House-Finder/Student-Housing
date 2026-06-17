import { authApi, configureApi } from '@/lib/api';

describe('authApi password reset endpoints', () => {
  beforeEach(() => {
    configureApi('http://api.test');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify({ success: true })),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    configureApi(undefined);
  });

  it('posts forgot-password requests to the registered backend endpoint', async () => {
    await authApi.forgotPassword('student@example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/api/auth/forgot-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'student@example.com' }),
      })
    );
  });

  it('posts reset-password requests using the backend token/password contract', async () => {
    await authApi.resetPassword({
      token: 'raw-reset-token',
      password: 'NewPass123!',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://api.test/api/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          token: 'raw-reset-token',
          password: 'NewPass123!',
        }),
      })
    );
  });
});
