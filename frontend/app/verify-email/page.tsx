'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, type ApiResponse } from '@capstone-house-finder/shf-api';
import Cookies from 'js-cookie';

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [dashboardRoute, setDashboardRoute] = useState('/dashboard');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    // Prevent running multiple times after redirect
    if (verifiedRef.current) return;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in the link.');
      return;
    }
    verifiedRef.current = true;
    authApi.verifyEmail(token)
      .then((res: ApiResponse) => {
        if (res.success) {
          setStatus('success');
          // Automatically log the user in using the returned token
          const data = res.data as { token?: string; user?: { role?: string } } | undefined;
          if (data && data.token) {
            Cookies.set('authToken', data.token, { expires: 7, sameSite: 'lax' });
            sessionStorage.setItem('auth_token', data.token);
          }

          // Map role to dashboard route
          const roleToDashboard: Record<string, string> = {
            admin: '/admin/dashboard',
            landlord: '/landlord/dashboard',
            student: '/student/dashboard',
          };
          const route = data?.user?.role ? roleToDashboard[data.user.role] : '/dashboard';
          setDashboardRoute(route);

          setTimeout(() => router.push(route), 3000);
        } else {
          setStatus('error');
          const msg = res.error?.message ?? 'Verification failed.';
          setErrorMsg(
            msg.includes('expired')
              ? 'This verification link has expired.'
              : msg.includes('already used') || msg.includes('used')
              ? 'This verification link has already been used.'
              : msg.includes('Invalid')
              ? 'This verification link is invalid.'
              : msg
          );
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('A network error occurred. Please try again.');
      });
  }, [router]);

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setResendMsg('Please enter your email address.');
      return;
    }
    setResendMsg('');
    try {
      const res = await authApi.resendVerification(email.trim().toLowerCase());
      if (res.success) {
        setResendSuccess(true);
        setResendMsg('Verification email sent! Please check your inbox.');
        startCountdown();
      } else {
        setResendMsg(res.error?.message ?? 'Failed to resend. Please try again.');
      }
    } catch {
      setResendMsg('Network error. Please try again.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .vep-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 12% 8%, rgba(255, 209, 102, 0.38), transparent 28%),
            radial-gradient(circle at 90% 0%, rgba(0, 184, 148, 0.22), transparent 30%),
            linear-gradient(135deg, #fff9f1 0%, #fff3fb 48%, #f0fffb 100%);
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .vep-card {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 24px;
          padding: 48px 40px;
          text-align: center;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 18px 18px 36px rgba(98, 39, 81, 0.08), -14px -14px 30px rgba(255, 255, 255, 0.9);
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          z-index: 1;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .vep-icon {
          width: 80px; height: 80px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          font-size: 36px;
        }
        .vep-icon--loading { background: rgba(239, 61, 131, 0.1); animation: pulse 1.6s ease-in-out infinite; }
        .vep-icon--success { background: rgba(34,197,94,0.15); animation: popIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .vep-icon--error   { background: rgba(239,68,68,0.1); animation: shake 0.4s both; }

        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.6; transform:scale(0.95); }
        }
        @keyframes popIn {
          0%   { opacity:0; transform:scale(0.5); }
          70%  { transform:scale(1.15); }
          100% { opacity:1; transform:scale(1); }
        }
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          20%,60% { transform:translateX(-6px); }
          40%,80% { transform:translateX(6px); }
        }

        .vep-title {
          font-size: 22px; font-weight: 700;
          color: var(--brand-ink); margin-bottom: 10px;
          letter-spacing: -0.3px;
        }
        .vep-subtitle {
          font-size: 14px; color: rgba(37, 27, 61, 0.75);
          line-height: 1.6; margin-bottom: 28px;
        }
        .vep-loading-dots span {
          display: inline-block; width: 8px; height: 8px;
          background: var(--brand-magenta); border-radius: 50%;
          animation: bounce 1.2s ease-in-out infinite;
          margin: 0 3px;
        }
        .vep-loading-dots span:nth-child(2) { animation-delay: .2s; }
        .vep-loading-dots span:nth-child(3) { animation-delay: .4s; }
        @keyframes bounce {
          0%,80%,100% { transform:translateY(0); }
          40%          { transform:translateY(-10px); }
        }

        .vep-success-bar {
          height: 4px;
          background: linear-gradient(90deg, #22c55e, #86efac);
          border-radius: 2px;
          margin-bottom: 24px;
          animation: grow 3s linear forwards;
        }
        @keyframes grow { from { width:0; } to { width:100%; } }

        .vep-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 100%; padding: 13px 20px;
          border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .vep-btn--primary {
          background: linear-gradient(135deg, var(--brand-magenta), var(--brand-coral) 52%, var(--brand-gold));
          color: #fff;
          box-shadow: 0 12px 22px rgba(239, 61, 131, 0.28);
        }
        .vep-btn--primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(239, 61, 131, 0.34);
        }
        .vep-btn--primary:disabled {
          opacity: 0.5; cursor: not-allowed;
        }
        .vep-btn--ghost {
          background: transparent; color: rgba(37, 27, 61, 0.7);
          border: 1px solid rgba(239, 61, 131, 0.3);
          margin-top: 12px;
        }
        .vep-btn--ghost:hover { background: rgba(239, 61, 131, 0.05); color: var(--brand-magenta); }

        .vep-input {
          width: 100%; padding: 12px 14px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(239, 61, 131, 0.18);
          border-radius: 12px;
          color: var(--brand-ink); font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 12px;
          box-shadow: inset 4px 4px 10px rgba(117, 61, 106, 0.08), inset -4px -4px 10px rgba(255, 255, 255, 0.9);
        }
        .vep-input::placeholder { color: rgba(37, 27, 61, 0.4); }
        .vep-input:focus {
          border-color: var(--brand-magenta);
          box-shadow: 0 0 0 0.25rem rgba(239, 61, 131, 0.16);
        }

        .vep-msg {
          font-size: 13px; border-radius: 8px;
          padding: 10px 12px; margin-top: 12px; text-align: left;
        }
        .vep-msg--ok  { background: rgba(34, 197, 94, 0.1); color: #198754; border: 1px solid rgba(34, 197, 94, 0.2); }
        .vep-msg--err { background: rgba(239, 68, 68, 0.1);  color: #dc3545; border: 1px solid rgba(239, 68, 68, 0.2); }
        .vep-divider { border: none; border-top: 1px solid rgba(239, 61, 131, 0.15); margin: 28px 0; }
        .vep-resend-title { font-size: 14px; font-weight: 600; color: rgba(37, 27, 61, 0.8); margin-bottom: 14px; }
        .vep-countdown { font-size: 12px; color: rgba(37, 27, 61, 0.5); margin-top: 10px; }
      `}</style>
      <div className="vep-root">
        <div className="vep-card">

          {/* LOADING */}
          {status === 'loading' && (
            <>
              <div className="vep-icon vep-icon--loading">📧</div>
              <h1 className="vep-title">Verifying your email…</h1>
              <p className="vep-subtitle">Hang tight while we confirm your address.</p>
              <div className="vep-loading-dots">
                <span/><span/><span/>
              </div>
            </>
          )}

          {/* SUCCESS */}
          {status === 'success' && (
            <>
              <div className="vep-icon vep-icon--success">✓</div>
              <h1 className="vep-title">Email Verified!</h1>
              <p className="vep-subtitle">
                Your email address has been confirmed. Redirecting you to your dashboard in a moment…
              </p>
              <div className="vep-success-bar" />
              <button className="vep-btn vep-btn--primary" onClick={() => router.push(dashboardRoute)}>
                Go to Dashboard
              </button>
            </>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <>
              <div className="vep-icon vep-icon--error">✕</div>
              <h1 className="vep-title">Verification Failed</h1>
              <p className="vep-subtitle">{errorMsg}</p>

              <hr className="vep-divider" />

              <p className="vep-resend-title">Resend a new verification link</p>
              <form onSubmit={handleResend}>
                <input
                  id="vep-email"
                  className="vep-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={resendSuccess && countdown > 0}
                />
                <button
                  id="vep-resend-btn"
                  className="vep-btn vep-btn--primary"
                  type="submit"
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
                </button>
              </form>

              {resendMsg && (
                <p className={`vep-msg ${resendSuccess ? 'vep-msg--ok' : 'vep-msg--err'}`}>
                  {resendMsg}
                </p>
              )}
              {countdown > 0 && (
                <p className="vep-countdown">You can request another email in {countdown} seconds.</p>
              )}

              <button className="vep-btn vep-btn--ghost" onClick={() => router.push('/login')}>
                Back to Login
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}
