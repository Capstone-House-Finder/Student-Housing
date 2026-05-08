'use client';

import React from 'react';

interface LoadingSpinnerProps {
  fullHeight?: boolean;
  message?: string;
}

export default function LoadingSpinner({ fullHeight = true, message = 'Loading...' }: LoadingSpinnerProps) {
  const containerClass = fullHeight ? 'min-vh-100 d-flex align-items-center justify-content-center' : 'd-flex align-items-center justify-content-center py-5';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">{message}</p>
      </div>
    </div>
  );
}
