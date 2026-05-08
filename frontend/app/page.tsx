'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { listingsApi } from '@/lib/api';
import PropertyCard from '@/components/PropertyCard';

interface Listing {
  id: number;
  title: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  photos?: { url: string }[];
}

const heroImages = [
  {
    src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Bright student apartment living room with warm seating',
  },
  {
    src: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    alt: 'Modern compact apartment with bed and workspace',
  },
  {
    src: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
    alt: 'Colorful home interior with plants and lounge space',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const response = await listingsApi.browse();
      if (response.success && response.data) {
        setListings(response.data as Listing[]);
      }
      setIsLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section text-white">
        <div className="container">
          <div className="row align-items-center py-5 g-5">
            <div className="col-lg-6">
              <span className="hero-kicker">Campus living, reimagined</span>
              <h1 className="display-4 fw-bold mb-4">
                Find Your Perfect Student Home
              </h1>
              <p className="lead mb-4">
                Discover apartments, houses, and rooms near your university. 
                Connect directly with landlords and find your ideal accommodation.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                {isAuthenticated ? (
                  <Link href="/search" className="btn btn-light btn-lg">
                    Search Properties
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-light btn-lg">
                      Get Started
                    </Link>
                    <Link href="/login" className="btn btn-outline-light btn-lg">
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-carousel glass-panel" aria-label="Student home photo carousel">
                {heroImages.map((image, index) => (
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    className="hero-carousel-image"
                    style={{ animationDelay: `${index * 4}s` }}
                  />
                ))}
                <div className="hero-image-caption">
                  <span>Verified spaces</span>
                  <strong>Rooms, apartments, and homes near campus</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 feature-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="text-center p-4 feature-card glass-panel">
                <div className="feature-icon d-inline-flex align-items-center justify-content-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                </div>
                <h4>Easy Search</h4>
                <p className="text-muted">
                  Filter by location, price, property type, and amenities to find your ideal home.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center p-4 feature-card glass-panel">
                <div className="feature-icon d-inline-flex align-items-center justify-content-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                  </svg>
                </div>
                <h4>Direct Contact</h4>
                <p className="text-muted">
                  Connect with landlords via WhatsApp for quick communication and faster responses.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center p-4 feature-card glass-panel">
                <div className="feature-icon d-inline-flex align-items-center justify-content-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="text-primary" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                  </svg>
                </div>
                <h4>Verified Listings</h4>
                <p className="text-muted">
                  All listings are verified to ensure you get accurate information about properties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-5 listings-section">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Featured Properties</h2>
            {isAuthenticated && (
              <Link href="/search" className="btn btn-outline-primary">
                View All
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading properties...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-5">
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="empty-state-icon mb-3" viewBox="0 0 16 16">
                  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z"/>
                </svg>
                <h4>No Properties Available</h4>
                <p className="text-muted">Check back soon for new listings.</p>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {listings.slice(0, 6).map((listing) => (
                <div key={listing.id} className="col-md-6 col-lg-4">
                  <PropertyCard property={listing} />
                </div>
              ))}
            </div>
          )}

          {!isAuthenticated && listings.length > 0 && (
            <div className="text-center mt-5">
              <p className="text-muted mb-3">
                Register or login to view more properties and contact landlords
              </p>
              <Link href="/register" className="btn btn-primary me-2">
                Get Started
              </Link>
              <Link href="/login" className="btn btn-outline-primary">
                Login
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section for Landlords */}
      <section className="py-5 landlord-cta text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h2 className="mb-3">Are You a Landlord?</h2>
              <p className="lead mb-0">
                List your properties and reach thousands of students looking for accommodation.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <Link href="/register" className="btn btn-light btn-lg">
                List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
