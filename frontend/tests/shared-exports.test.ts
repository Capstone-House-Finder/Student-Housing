import { describe, expect, it } from '@jest/globals';
import { authApi, configureApi, loginSchema } from '@/lib/api';
import { cn } from '@/lib/utils';
import { reportSchema } from '@/lib/validations';

describe('shared package frontend compatibility exports', () => {
  it('re-exports API clients and validation schemas through the existing lib/api path', () => {
    expect(typeof configureApi).toBe('function');
    expect(typeof authApi.login).toBe('function');

    const parsed = loginSchema.safeParse({
      email: 'student@example.com',
      password: 'Password1!',
    });

    expect(parsed.success).toBe(true);
  });

  it('keeps validation and utility imports working through legacy frontend paths', () => {
    expect(reportSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(cn('px-2', false && 'hidden', 'px-4')).toBe('px-4');
  });
});
