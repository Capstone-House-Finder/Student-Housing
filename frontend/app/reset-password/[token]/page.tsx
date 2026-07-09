'use client';

import { useParams } from 'next/navigation';
import { ResetPasswordForm } from '../page';

export default function TokenResetPage() {
  const params = useParams();
  const token = params.token as string;
  
  if (!token) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body p-4 text-center">
                <h4 className="mb-3">Invalid Reset Link</h4>
                <p className="text-muted mb-4">Please request a new password reset link.</p>
                <a href="/forgot-password" className="btn btn-primary">
                  Request Password Reset
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return <ResetPasswordForm token={token} />;
}
