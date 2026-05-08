'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row">
          <div className="col-md-8 mx-auto text-center py-5">
            <h1 className="display-1 fw-bold text-primary mb-4">404</h1>
            <h2 className="h3 mb-3">Page Not Found</h2>
            <p className="lead text-muted mb-4">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Link href="/" className="btn btn-primary btn-lg">
                Go Home
              </Link>
              <Link href="/search" className="btn btn-outline-primary btn-lg">
                Browse Listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
