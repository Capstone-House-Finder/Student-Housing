'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@housing/shared';

const RESEND_COOLDOWN = 60;

export default function VerifyPendingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sent, setSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-fill email from query parameter if provided
  useEffect(() => {
    const emailParam = new URLSearchParams(window.location.search).get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setMsgOk(false); setMsg('Please enter your email address.'); return; }
    setMsg('');
    try {
      await authApi.resendVerification(email.trim().toLowerCase());
      // Always show the same message to prevent enumeration
      setSent(true);
      setMsgOk(true);
      setMsg('If that address is registered, a new verification link has been sent. Check your inbox.');
      startCountdown();
    } catch {
      setMsgOk(false);
      setMsg('Network error. Please try again.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }

        .vpp-root {
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

        .vpp-card {
          position: relative;
          width: 100%;
          max-width: 460px;
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
          from { opacity:0; transform:translateY(28px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        .vpp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(239, 61, 131, 0.1);
          border: 1px solid rgba(239, 61, 131, 0.2);
          color: var(--brand-magenta);
          border-radius: 20px; padding: 5px 14px;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 24px;
          animation: fadeSlide 0.6s 0.2s both;
        }
        @keyframes fadeSlide {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .vpp-icon {
          width: 88px; height: 88px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
          background: rgba(239, 61, 131, 0.1);
          border: 2px solid rgba(239, 61, 131, 0.2);
          animation: popIn 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both, wiggle 3s 1s ease-in-out infinite;
        }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.6); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes wiggle {
          0%,90%,100% { transform:rotate(0deg); }
          93%           { transform:rotate(-6deg); }
          97%           { transform:rotate(6deg); }
        }

        .vpp-title {
          font-size: 24px; font-weight: 800;
          color: var(--brand-ink);
          letter-spacing: -0.4px; margin-bottom: 12px;
        }
        .vpp-body {
          font-size: 14px; color: rgba(37, 27, 61, 0.75);
          line-height: 1.7; margin-bottom: 32px;
        }

        .vpp-steps {
          text-align: left; margin-bottom: 28px;
          border: 1px solid rgba(239, 61, 131, 0.12);
          border-radius: 12px; padding: 16px 18px;
          background: rgba(255, 255, 255, 0.4);
        }
        .vpp-step {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13px; color: rgba(37, 27, 61, 0.85);
          margin-bottom: 10px;
        }
        .vpp-step:last-child { margin-bottom: 0; }
        .vpp-step-num {
          flex-shrink: 0; width: 20px; height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand-magenta), var(--brand-violet));
          color: #fff; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }

        .vpp-divider { border:none; border-top:1px solid rgba(239, 61, 131, 0.15); margin:0 0 24px; }

        .vpp-section-title {
          font-size: 13px; font-weight: 600;
          color: rgba(37, 27, 61, 0.6);
          text-transform: uppercase; letter-spacing: 0.8px;
          margin-bottom: 14px;
        }

        .vpp-input {
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
        .vpp-input::placeholder { color: rgba(37, 27, 61, 0.4); }
        .vpp-input:focus {
          border-color: var(--brand-magenta);
          box-shadow: 0 0 0 0.25rem rgba(239, 61, 131, 0.16);
        }

        .vpp-btn {
          width: 100%; padding: 13px 20px;
          border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .vpp-btn--primary {
          background: linear-gradient(135deg, var(--brand-magenta), var(--brand-coral) 52%, var(--brand-gold));
          color: #fff;
          box-shadow: 0 12px 22px rgba(239, 61, 131, 0.28);
        }
        .vpp-btn--primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow: 0 16px 28px rgba(239, 61, 131, 0.34); }
        .vpp-btn--primary:disabled { opacity:0.5; cursor:not-allowed; }
        .vpp-btn--ghost {
          background: transparent; color: rgba(37, 27, 61, 0.7);
          border: 1px solid rgba(239, 61, 131, 0.3); margin-top: 10px;
        }
        .vpp-btn--ghost:hover { background: rgba(239, 61, 131, 0.05); color: var(--brand-magenta); }

        .vpp-msg {
          font-size: 13px; border-radius: 8px;
          padding: 10px 12px; margin-top: 12px; text-align: left;
        }
        .vpp-msg--ok  { background: rgba(34, 197, 94, 0.1); color: #198754; border: 1px solid rgba(34, 197, 94, 0.2); }
        .vpp-msg--err { background: rgba(239, 68, 68, 0.1);  color: #dc3545; border: 1px solid rgba(239, 68, 68, 0.2); }
        .vpp-countdown { font-size:12px; color:rgba(37, 27, 61, 0.5); margin-top:8px; }
      `}</style>

      <div className="vpp-root">
        <div className="vpp-card">

          <div className="vpp-badge">⚠ Verification Required</div>

          <div className="vpp-icon">📬</div>

          <h1 className="vpp-title">Check Your Inbox</h1>
          <p className="vpp-body">
            We sent a verification link to your email address when you registered. 
            Please click the link to activate your account.
          </p>

          <div className="vpp-steps">
            <div className="vpp-step">
              <span className="vpp-step-num">1</span>
              <span>Open the email from <strong style={{color:'var(--brand-magenta)'}}>Student Housing</strong> in your inbox.</span>
            </div>
            <div className="vpp-step">
              <span className="vpp-step-num">2</span>
              <span>Click the <em>"Verify Email"</em> button in the email.</span>
            </div>
            <div className="vpp-step">
              <span className="vpp-step-num">3</span>
              <span>You'll be redirected to your dashboard automatically.</span>
            </div>
          </div>

          <hr className="vpp-divider" />
          <p className="vpp-section-title">Didn't receive the email?</p>

          <form onSubmit={handleResend}>
            <input
              id="vpp-email"
              className="vpp-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={sent && countdown > 0}
            />
            <button
              id="vpp-resend-btn"
              className="vpp-btn vpp-btn--primary"
              type="submit"
              disabled={countdown > 0}
            >
              {countdown > 0 ? `⏳ Resend in ${countdown}s` : '↺ Resend Verification Email'}
            </button>
          </form>

          {msg && (
            <p className={`vpp-msg ${msgOk ? 'vpp-msg--ok' : 'vpp-msg--err'}`}>{msg}</p>
          )}
          {countdown > 0 && !msg && (
            <p className="vpp-countdown">Another email can be requested in {countdown}s.</p>
          )}

          <button
            id="vpp-logout-btn"
            className="vpp-btn vpp-btn--ghost"
            onClick={() => router.push('/logout')}
          >
            Sign Out
          </button>

        </div>
      </div>
    </>
  );
}
