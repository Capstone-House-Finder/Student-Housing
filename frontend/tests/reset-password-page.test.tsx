import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from '@/app/reset-password/page';
import { API } from '@/lib/api';

const pushMock = jest.fn();
let searchParamString = 'token=valid-token';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => new URLSearchParams(searchParamString),
}));

jest.mock('@/lib/api', () => ({
  API: {
    post: jest.fn(),
  },
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    searchParamString = 'token=valid-token';
    pushMock.mockClear();
    jest.useFakeTimers();
    jest.mocked(API.post).mockReset();
    jest.mocked(API.post).mockResolvedValue({
      success: true,
      message: 'Password has been reset.',
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('accepts a token-only reset link and submits the backend payload', async () => {
    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'valid-token',
        password: 'NewPass123!',
      });
    });

    expect(screen.getByText('Password Reset Successful!')).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });
    expect(pushMock).toHaveBeenCalledWith('/login?reset=success');
  });

  it('shows a recovery action when the token is missing', () => {
    searchParamString = '';

    render(<ResetPasswordForm />);

    expect(screen.getByText('Invalid or missing reset link. Please request a new password reset.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request Password Reset' })).toHaveAttribute('href', '/forgot-password');
    expect(API.post).not.toHaveBeenCalled();
  });
});
