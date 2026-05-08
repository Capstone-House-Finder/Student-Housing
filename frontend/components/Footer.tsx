'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light mt-5 py-5">
      <div className="container">
        <div className="row mb-4">
          <div className="col-md-3 mb-3 mb-md-0">
            <h5 className="mb-3">StudentHousing</h5>
            <p className="small">
              Your trusted platform for finding and managing student housing.
            </p>
          </div>

          <div className="col-md-3 mb-3 mb-md-0">
            <h6 className="mb-3">For Students</h6>
            <ul className="list-unstyled small">
              <li>
                <Link href="/search" className="text-light text-decoration-none">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/student/dashboard" className="text-light text-decoration-none">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-light text-decoration-none">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-3 mb-3 mb-md-0">
            <h6 className="mb-3">For Landlords</h6>
            <ul className="list-unstyled small">
              <li>
                <Link href="/landlord/dashboard" className="text-light text-decoration-none">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/landlord/listings/create" className="text-light text-decoration-none">
                  Create Listing
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-3">
            <h6 className="mb-3">Help</h6>
            <ul className="list-unstyled small">
              <li>
                <a href="#" className="text-light text-decoration-none">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-light text-decoration-none">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-light text-decoration-none">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-light text-decoration-none">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="bg-secondary" />

        <div className="row">
          <div className="col-md-6">
            <small className="text-muted">
              &copy; {currentYear} StudentHousing. All rights reserved.
            </small>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="d-flex gap-3 justify-content-md-end">
              <a href="#" className="text-light text-decoration-none small">
                Facebook
              </a>
              <a href="#" className="text-light text-decoration-none small">
                Twitter
              </a>
              <a href="#" className="text-light text-decoration-none small">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
