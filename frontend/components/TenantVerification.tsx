'use client';

import { useState } from 'react';
import { API } from '@/lib/api';

interface TenantVerificationProps {
  tenantId: string;
  tenantName: string;
  onVerify: () => void;
}

export default function TenantVerification({ tenantId, tenantName, onVerify }: TenantVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await API.post(`/negotiations/${tenantId}/verify`, {});
      setVerified(true);
      onVerify();
    } catch (error) {
      console.error('Error verifying tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="alert alert-success mb-0">
        <i className="bi bi-check-circle"></i> Tenant verified and approved
      </div>
    );
  }

  return (
    <button
      className="btn btn-success btn-sm"
      onClick={handleVerify}
      disabled={loading}
    >
      {loading ? 'Verifying...' : 'Verify Tenant'}
    </button>
  );
}
