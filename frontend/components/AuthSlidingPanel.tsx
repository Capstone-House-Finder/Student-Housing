'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import {
  loginSchema,
  LoginFormData,
  registerAccountSchema,
  RegisterAccountFormData,
  registerProfileSchema,
  RegisterProfileFormData,
} from '@/lib/validations';

type AuthMode = 'signin' | 'signup';

interface AuthSlidingPanelProps {
  initialMode?: AuthMode;
}

export default function AuthSlidingPanel({ initialMode = 'signin' }: AuthSlidingPanelProps) {
  const router = useRouter();
  const { login, register: registerUser, isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [profileData, setProfileData] = useState<RegisterProfileFormData | null>(null);

  const {
    register: registerLoginField,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerProfileField,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<RegisterProfileFormData>({
    resolver: zodResolver(registerProfileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      bio: '',
    },
  });

  const {
    register: registerAccountField,
    handleSubmit: handleAccountSubmit,
    formState: { errors: accountErrors },
    watch,
  } = useForm<RegisterAccountFormData>({
    resolver: zodResolver(registerAccountSchema),
    defaultValues: {
      role: 'student',
    },
  });

  const password = watch('password', '');

  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'landlord'
          ? '/landlord/dashboard'
          : '/student/dashboard';
      router.push(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return null;
  }

  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return strength;
  };

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['danger', 'danger', 'warning', 'info', 'success'];
  const strength = getPasswordStrength();

  const showSignIn = () => {
    setMode('signin');
    setLoginError('');
    router.replace('/login', { scroll: false });
  };

  const showSignUp = () => {
    setMode('signup');
    setRegisterError('');
    router.replace('/register', { scroll: false });
  };

  const saveProfileStep = (data: RegisterProfileFormData) => {
    setProfileData(data);
    setRegisterError('');
    setRegisterStep(2);
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoginSubmitting(true);
    setLoginError('');

    const result = await login(data.email, data.password);

    if (result.success) {
      setTimeout(() => {
        router.refresh();
      }, 100);
    } else if (result.error?.includes('credentials') || result.error?.includes('password')) {
      setLoginError('Invalid email or password. Please try again.');
    } else {
      setLoginError(result.error || 'Login failed. Please try again.');
    }

    setIsLoginSubmitting(false);
  };

  const onRegisterSubmit = async (data: RegisterAccountFormData) => {
    if (!profileData) {
      setRegisterStep(1);
      return;
    }

    setIsRegisterSubmitting(true);
    setRegisterError('');

    const result = await registerUser({
      full_name: profileData.full_name,
      phone: profileData.phone,
      bio: profileData.bio,
      email: data.email,
      password: data.password,
      role: data.role,
    });

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else if (result.error?.includes('duplicate') || result.error?.includes('already')) {
      setRegisterError('This email is already registered. Please try logging in instead.');
    } else {
      setRegisterError(result.error || 'Registration failed. Please try again.');
    }

    setIsRegisterSubmitting(false);
  };

  return (
    <section className="auth-shell">
      <div className={`auth-panel ${mode === 'signup' ? 'is-signup' : ''}`}>
        <div className="auth-form-side auth-login-side" aria-hidden={mode !== 'signin'}>
          <div className="auth-form-content">
            <h1>Welcome Back</h1>
            <p className="text-muted">Sign in to continue your housing search.</p>

            {loginError && (
              <div className="alert alert-danger" role="alert">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
              <div className="mb-3">
                <label htmlFor="loginEmail" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="loginEmail"
                  className={`form-control ${loginErrors.email ? 'is-invalid' : ''}`}
                  placeholder="Enter your email"
                  {...registerLoginField('email')}
                />
                {loginErrors.email && (
                  <div className="invalid-feedback">{loginErrors.email.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="loginPassword" className="form-label">Password</label>
                <input
                  type="password"
                  id="loginPassword"
                  className={`form-control ${loginErrors.password ? 'is-invalid' : ''}`}
                  placeholder="Enter your password"
                  {...registerLoginField('password')}
                />
                {loginErrors.password && (
                  <div className="invalid-feedback">{loginErrors.password.message}</div>
                )}
              </div>

              <div className="mb-4 text-end">
                <Link href="/forgot-password" className="text-decoration-none small">
                  Forgot your password?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={isLoginSubmitting}>
                {isLoginSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>

        <div className="auth-form-side auth-register-side" aria-hidden={mode !== 'signup'}>
          <div className="auth-form-content">
            <h1>Create Account</h1>
            <p className="text-muted">Tell us enough to build a useful housing profile.</p>

            <div className="step-indicator register-step-indicator mb-4" aria-label="Registration progress">
              <button
                type="button"
                className={`step ${registerStep === 1 ? 'active' : 'completed'}`}
                onClick={() => setRegisterStep(1)}
                aria-label="Personal details step"
              >
                1
              </button>
              <button
                type="button"
                className={`step ${registerStep === 2 ? 'active' : ''}`}
                onClick={() => handleProfileSubmit(saveProfileStep)()}
                aria-label="Account details step"
              >
                2
              </button>
            </div>

            {showSuccess ? (
              <div className="text-center py-4">
                <h4 className="text-success">Registration Successful!</h4>
                <p className="text-muted">Redirecting you to the homepage...</p>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {registerError && (
                  <div className="alert alert-danger" role="alert">
                    {registerError}
                  </div>
                )}

                {registerStep === 1 ? (
                  <form onSubmit={handleProfileSubmit(saveProfileStep)}>
                    <div className="mb-3">
                      <label htmlFor="fullName" className="form-label">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        className={`form-control ${profileErrors.full_name ? 'is-invalid' : ''}`}
                        placeholder="Enter your full name"
                        {...registerProfileField('full_name')}
                      />
                      {profileErrors.full_name && (
                        <div className="invalid-feedback">{profileErrors.full_name.message}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">Phone</label>
                      <input
                        type="tel"
                        id="phone"
                        className={`form-control ${profileErrors.phone ? 'is-invalid' : ''}`}
                        placeholder="Enter your phone number"
                        {...registerProfileField('phone')}
                      />
                      {profileErrors.phone && (
                        <div className="invalid-feedback">{profileErrors.phone.message}</div>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="bio" className="form-label">Bio</label>
                      <textarea
                        id="bio"
                        rows={3}
                        className={`form-control ${profileErrors.bio ? 'is-invalid' : ''}`}
                        placeholder="Share a short intro for your housing profile"
                        {...registerProfileField('bio')}
                      />
                      {profileErrors.bio && (
                        <div className="invalid-feedback">{profileErrors.bio.message}</div>
                      )}
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                      Continue
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAccountSubmit(onRegisterSubmit)}>
                    <div className="mb-3">
                      <label htmlFor="registerEmail" className="form-label">Email Address</label>
                      <input
                        type="email"
                        id="registerEmail"
                        className={`form-control ${accountErrors.email ? 'is-invalid' : ''}`}
                        placeholder="Enter your email"
                        {...registerAccountField('email')}
                      />
                      {accountErrors.email && (
                        <div className="invalid-feedback">{accountErrors.email.message}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="registerPassword" className="form-label">Password</label>
                      <input
                        type="password"
                        id="registerPassword"
                        className={`form-control ${accountErrors.password ? 'is-invalid' : ''}`}
                        placeholder="Create a password"
                        {...registerAccountField('password')}
                      />
                      {accountErrors.password && (
                        <div className="invalid-feedback">{accountErrors.password.message}</div>
                      )}
                      {password && (
                        <div className="mt-2">
                          <div className="progress" style={{ height: '5px' }}>
                            <div
                              className={`progress-bar bg-${strengthColors[strength - 1] || 'secondary'}`}
                              style={{ width: `${(strength / 5) * 100}%` }}
                            ></div>
                          </div>
                          <small className={`text-${strengthColors[strength - 1] || 'muted'}`}>
                            Password Strength: {strengthLabels[strength - 1] || 'Very Weak'}
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className={`form-control ${accountErrors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Confirm your password"
                        {...registerAccountField('confirmPassword')}
                      />
                      {accountErrors.confirmPassword && (
                        <div className="invalid-feedback">{accountErrors.confirmPassword.message}</div>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="form-label">I am a</label>
                      <div className="d-flex gap-3 flex-wrap">
                        <div className="form-check">
                          <input
                            type="radio"
                            id="roleStudent"
                            value="student"
                            className="form-check-input"
                            {...registerAccountField('role')}
                          />
                          <label htmlFor="roleStudent" className="form-check-label">Student</label>
                        </div>
                        <div className="form-check">
                          <input
                            type="radio"
                            id="roleLandlord"
                            value="landlord"
                            className="form-check-input"
                            {...registerAccountField('role')}
                          />
                          <label htmlFor="roleLandlord" className="form-check-label">Landlord</label>
                        </div>
                      </div>
                      {accountErrors.role && (
                        <div className="text-danger small mt-1">{accountErrors.role.message}</div>
                      )}
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary flex-fill"
                        onClick={() => setRegisterStep(1)}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary flex-fill"
                        disabled={isRegisterSubmitting}
                      >
                        {isRegisterSubmitting ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        <div className="auth-overlay">
          <div className="auth-overlay-content">
            {mode === 'signin' ? (
              <>
                <h2>New here?</h2>
                <p>Create a profile and start matching with better student homes.</p>
                <button type="button" className="btn auth-overlay-btn" onClick={showSignUp}>
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <h2>Already registered?</h2>
                <p>Sign in to manage your profile, listings, and saved searches.</p>
                <button type="button" className="btn auth-overlay-btn" onClick={showSignIn}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
