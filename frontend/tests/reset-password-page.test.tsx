import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResetPasswordForm } from '@/app/reset-password/page';
import { API } from '@/lib/api';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/lib/api', () => ({
  API: {
    post: jest.fn(),
  },
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    window.history.pushState({}, 'Test', '/');
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

  it('accepts a path-based token prop and submits the backend payload', async () => {
    render(<ResetPasswordForm token="valid-token" />);

    fireEvent.change(await screen.findByLabelText('New Password'), {
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

  it('falls back to query param token when no prop is given', async () => {
    window.history.pushState({}, 'Test', '/?token=query-token');

    render(<ResetPasswordForm />);

    fireEvent.change(await screen.findByLabelText('New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'query-token',
        password: 'NewPass123!',
      });
    });
  });

  it('shows a recovery action when the token is missing', async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText('Invalid or missing reset link. Please request a new password reset.')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Request Password Reset' })).toHaveAttribute('href', '/forgot-password');
    });
    expect(API.post).not.toHaveBeenCalled();
  });
});
