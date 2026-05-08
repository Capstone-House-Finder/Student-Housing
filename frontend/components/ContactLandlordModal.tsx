'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { API } from '@/lib/api';

const contactSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message must be less than 500 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactLandlordModalProps {
  listingId: string;
  landlordId: string;
  propertyTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ContactLandlordModal({
  listingId,
  landlordId,
  propertyTitle,
  onClose,
  onSuccess,
}: ContactLandlordModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      await API.post(`/listings/${listingId}/inquire`, {
        message: data.message,
      });
      setSubmitted(true);
      reset();
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Contact Landlord</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={loading}
              />
            </div>

            {submitted ? (
              <div className="modal-body text-center py-4">
                <div className="alert alert-success" role="alert">
                  <h6>Message Sent Successfully!</h6>
                  <p className="mb-0">The landlord will respond to your inquiry shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body">
                  <div className="mb-3">
                    <p className="text-muted mb-2">
                      <strong>Property:</strong> {propertyTitle}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="message" className="form-label">
                      Your Message
                    </label>
                    <textarea
                      id="message"
                      className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                      rows={4}
                      placeholder="Tell the landlord about yourself and why you're interested..."
                      {...register('message')}
                      disabled={loading}
                    />
                    {errors.message && (
                      <div className="invalid-feedback d-block">{errors.message.message}</div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
