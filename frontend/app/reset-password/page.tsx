'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token || !email) {
      setServerError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !email) return;

    setIsSubmitting(true);
    setServerError('');

    const result = await authApi.resetPassword({
      email,
      resetToken: token,
      newPassword: data.newPassword,
    });

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      if (result.error?.message?.includes('expired')) {
        setServerError('This reset link has expired. Please request a new password reset.');
      } else if (result.error?.message?.includes('used')) {
        setServerError('This reset link has already been used. Please request a new password reset.');
      } else {
        setServerError(result.error?.message || 'Failed to reset password. Please try again.');
      }
    }

    setIsSubmitting(false);
  };

  if (showSuccess) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                </div>
                <h4 className="text-success">Password Reset Successful!</h4>
                <p className="text-muted">Redirecting you to the login page...</p>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-2">Reset Password</h2>
              <p className="text-muted text-center mb-4">
                Enter your new password below.
              </p>

              {serverError && (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                  {serverError.includes('request') && (
                    <div className="mt-2">
                      <Link href="/forgot-password" className="alert-link">
                        Request new reset link
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {(!token || !email) ? (
                <div className="text-center">
                  <Link href="/forgot-password" className="btn btn-primary">
                    Request Password Reset
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                      placeholder="Enter new password"
                      {...register('newPassword')}
                    />
                    {errors.newPassword && (
                      <div className="invalid-feedback">{errors.newPassword.message}</div>
                    )}
                    <small className="text-muted d-block mt-1">
                      Must be 8+ characters with uppercase, lowercase, number, and special character
                    </small>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Confirm new password"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              )}

              <div className="text-center mt-4">
                <Link href="/login" className="text-decoration-none">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body p-4 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
