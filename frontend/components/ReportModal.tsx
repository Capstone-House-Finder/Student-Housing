'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { reportsApi } from '@/lib/api';
import { reportSchema, ReportFormData } from '@/lib/validations';

interface ReportModalProps {
  targetType: 'listing' | 'user';
  targetId: number;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    setError('');

    const result = await reportsApi.submit(token, {
      target_type: targetType,
      target_id: targetId,
      reason: data.reason,
    });

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError(result.error?.message || 'Failed to submit report');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Report {targetType === 'listing' ? 'Listing' : 'User'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {showSuccess ? (
            <div className="modal-body text-center py-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="text-success mb-3" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
              <h5 className="text-success">Report Submitted</h5>
              <p className="text-muted">Thank you for your report. Our team will review it shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}

                <p className="text-muted mb-3">
                  Please describe the issue you are reporting. Your report will be reviewed by our moderation team.
                </p>

                <div className="mb-3">
                  <label htmlFor="reason" className="form-label">
                    Reason for Report <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="reason"
                    className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                    rows={4}
                    placeholder="Please describe the issue..."
                    {...register('reason')}
                  ></textarea>
                  {errors.reason && (
                    <div className="invalid-feedback">{errors.reason.message}</div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
