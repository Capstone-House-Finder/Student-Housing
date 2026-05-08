'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'landlord':
        return '/landlord/dashboard';
      case 'student':
      default:
        return '/student/dashboard';
    }
  };

  const navLinkClass = (href: string) =>
    `nav-link nav-pill ${pathname === href ? 'active' : ''}`;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar navbar-expand-lg sticky-top app-navbar">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold brand-mark" onClick={closeMenu}>
          <span className="brand-orb" aria-hidden="true">SH</span>
          <span>Student Housing Finder</span>
        </Link>

        <button
          className={`navbar-toggler nav-toggle ${isMenuOpen ? 'is-open' : ''}`}
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <Link href="/" className={navLinkClass('/')} onClick={closeMenu}>
                Home
              </Link>
            </li>
            {isAuthenticated && (
              <li className="nav-item">
                <Link href="/search" className={navLinkClass('/search')} onClick={closeMenu}>
                  Search Properties
                </Link>
              </li>
            )}
          </ul>

          <ul className="navbar-nav align-items-lg-center gap-lg-2">
            {isLoading ? (
              <li className="nav-item">
                <span className="nav-link">
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Loading...
                </span>
              </li>
            ) : isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link href={getDashboardLink()} className={navLinkClass(getDashboardLink())} onClick={closeMenu}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle nav-pill user-pill"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {user?.email}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <span className="dropdown-item-text text-muted small">
                        Role: {user?.role}
                      </span>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link href="/profile" className="dropdown-item">
                        Profile Settings
                      </Link>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link href="/login" className={navLinkClass('/login')} onClick={closeMenu}>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/register" className="btn nav-cta ms-lg-2" onClick={closeMenu}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
