'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations';

export default function ForgotPasswordPage() {
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setServerMessage(null);

    const result = await authApi.forgotPassword(data.email);

    // For security reasons, we show the same message regardless of whether
    // the email exists or not
    setServerMessage({
      type: 'success',
      text: 'If an account with this email exists, you will receive a password reset link shortly.',
    });

    if (!result.success && result.error?.message?.includes('rate')) {
      setServerMessage({
        type: 'error',
        text: 'Too many reset requests. Please try again later.',
      });
    }

    reset();
    setIsSubmitting(false);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-2">Forgot Password</h2>
              <p className="text-muted text-center mb-4">
                Enter your email address and we will send you a link to reset your password.
              </p>

              {serverMessage && (
                <div className={`alert alert-${serverMessage.type === 'success' ? 'success' : 'danger'}`} role="alert">
                  {serverMessage.text}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Enter your registered email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email.message}</div>
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
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

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
