'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { profileSchema, ProfileFormData, changePasswordSchema, ChangePasswordFormData } from '@/lib/validations';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setValue('phone', user.phone || '');
    }
  }, [user, setValue]);

  const onProfileUpdate = async (data: ProfileFormData) => {
    if (!token) return;

    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess(false);

    const result = await authApi.updateProfile(token, data);

    if (result.success) {
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } else {
      setUpdateError(result.error?.message || 'Failed to update profile');
    }

    setIsUpdating(false);
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    if (!token) return;

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);

    const result = await authApi.changePassword(token, {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    if (result.success) {
      setPasswordSuccess(true);
      resetPasswordForm();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(result.error?.message || 'Failed to change password');
    }

    setIsChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (!token) return;

    setIsDeleting(true);

    const result = await authApi.changePassword(token, {
      currentPassword: '',
      newPassword: '',
    });

    if (result.success) {
      logout();
      router.push('/');
    }

    setIsDeleting(false);
  };

  if (authLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-3">
          <div className="card mb-4">
            <div className="card-body text-center">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                </svg>
              </div>
              <h5 className="mb-1">{user?.email?.split('@')[0]}</h5>
              <p className="text-muted mb-2">{user?.email}</p>
              <span className="badge bg-primary text-capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {/* Profile Update */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Profile Information</h5>
            </div>
            <div className="card-body">
              {updateError && <div className="alert alert-danger">{updateError}</div>}
              {updateSuccess && <div className="alert alert-success">Profile updated successfully!</div>}

              <form onSubmit={handleProfileSubmit(onProfileUpdate)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={user?.email || ''}
                      disabled
                    />
                    <small className="text-muted">Email cannot be changed</small>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label">Phone Number</label>
                    <input
                      type="text"
                      id="phone"
                      className={`form-control ${profileErrors.phone ? 'is-invalid' : ''}`}
                      placeholder="+1234567890"
                      {...registerProfile('phone')}
                    />
                    {profileErrors.phone && (
                      <div className="invalid-feedback">{profileErrors.phone.message}</div>
                    )}
                    <small className="text-muted">Include country code for WhatsApp</small>
                  </div>
                </div>

                <div className="mt-3">
                  <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Change Password</h5>
            </div>
            <div className="card-body">
              {passwordError && <div className="alert alert-danger">{passwordError}</div>}
              {passwordSuccess && <div className="alert alert-success">Password changed successfully!</div>}

              <form onSubmit={handlePasswordSubmit(onChangePassword)}>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                      {...registerPassword('currentPassword')}
                    />
                    {passwordErrors.currentPassword && (
                      <div className="invalid-feedback">{passwordErrors.currentPassword.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                      {...registerPassword('newPassword')}
                    />
                    {passwordErrors.newPassword && (
                      <div className="invalid-feedback">{passwordErrors.newPassword.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                      {...registerPassword('confirmPassword')}
                    />
                    {passwordErrors.confirmPassword && (
                      <div className="invalid-feedback">{passwordErrors.confirmPassword.message}</div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <button type="submit" className="btn btn-warning" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-danger">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">Danger Zone</h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>

              {!showDeleteConfirm ? (
                <button
                  className="btn btn-outline-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              ) : (
                <div className="alert alert-danger">
                  <h6>Are you sure you want to delete your account?</h6>
                  <p className="mb-3">This action cannot be undone. All your data will be permanently removed.</p>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
