'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { listingsApi, reviewsApi } from '@/lib/api';
import StarRating from '@/components/StarRating';
import ReportModal from '@/components/ReportModal';

interface Photo {
  id: number;
  url: string;
  public_id: string;
}

interface Amenity {
  id: number;
  name: string;
}

interface Review {
  id: number;
  rating: number;
  comment?: string;
  student_email?: string;
  created_at: string;
  reply?: {
    id: number;
    text: string;
    created_at: string;
  };
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  landlord_id: number;
  landlord_email: string;
  status: string;
  amenities: Amenity[];
  photos: Photo[];
  reviews?: Review[];
  created_at: string;
  updated_at: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [contactUrl, setContactUrl] = useState<string | null>(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Reply form state
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const listingId = Number(params.id);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    const fetchListing = async () => {
      if (!token) return;

      const response = await listingsApi.getById(token, listingId);

      if (response.success && response.data) {
        setListing(response.data as Listing);
      } else {
        setError(response.error?.message || 'Failed to load listing');
      }

      setIsLoading(false);
    };

    if (token) {
      fetchListing();
    }
  }, [token, listingId, authLoading, isAuthenticated, router]);

  const handleContact = async () => {
    if (!token) return;

    setIsContacting(true);
    const response = await listingsApi.contact(token, listingId);

    if (response.success && response.data) {
      const data = response.data as { whatsappUrl: string };
      setContactUrl(data.whatsappUrl);
      window.open(data.whatsappUrl, '_blank');
    }

    setIsContacting(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || reviewRating === 0) return;

    setIsSubmittingReview(true);
    setReviewError('');

    const response = await reviewsApi.create(token, listingId, {
      rating: reviewRating,
      comment: reviewComment || undefined,
    });

    if (response.success) {
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment('');
      // Refresh listing to show new review
      const refreshResponse = await listingsApi.getById(token, listingId);
      if (refreshResponse.success && refreshResponse.data) {
        setListing(refreshResponse.data as Listing);
      }
    } else {
      setReviewError(response.error?.message || 'Failed to submit review');
    }

    setIsSubmittingReview(false);
  };

  const handleSubmitReply = async (reviewId: number) => {
    if (!token || !replyText.trim()) return;

    setIsSubmittingReply(true);

    const response = await reviewsApi.reply(token, reviewId, replyText);

    if (response.success) {
      setReplyingTo(null);
      setReplyText('');
      // Refresh listing
      const refreshResponse = await listingsApi.getById(token, listingId);
      if (refreshResponse.success && refreshResponse.data) {
        setListing(refreshResponse.data as Listing);
      }
    }

    setIsSubmittingReply(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success';
      case 'rented': return 'bg-danger';
      case 'under_negotiation': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error || 'Listing not found'}
        </div>
        <Link href="/search" className="btn btn-primary">
          Back to Search
        </Link>
      </div>
    );
  }

  const defaultImage = 'https://via.placeholder.com/800x600?text=No+Image';
  const currentPhoto = listing.photos?.length > 0
    ? listing.photos[selectedPhotoIndex]?.url
    : defaultImage;

  const isLandlord = user?.role === 'landlord' && user?.id === listing.landlord_id;
  const canReview = user?.role === 'student';

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/search">Search</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {listing.title}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Photo Gallery */}
        <div className="col-lg-7 mb-4">
          <div className="card">
            <div className="position-relative">
              <img
                src={currentPhoto}
                alt={listing.title}
                className="card-img-top gallery-main-image"
              />
              <span className={`badge ${getStatusBadgeClass(listing.status)} position-absolute top-0 end-0 m-3`}>
                {formatStatus(listing.status)}
              </span>
            </div>

            {listing.photos?.length > 1 && (
              <div className="card-body">
                <div className="d-flex gap-2 flex-wrap">
                  {listing.photos?.map((photo, index) => (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className={`gallery-thumbnail rounded ${index === selectedPhotoIndex ? 'active border border-primary border-2' : ''}`}
                      onClick={() => setSelectedPhotoIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Info */}
        <div className="col-lg-5">
          <div className="card mb-4">
            <div className="card-body">
              <h1 className="h3 mb-3">{listing.title}</h1>

              <div className="d-flex align-items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-muted me-2" viewBox="0 0 16 16">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                </svg>
                <span className="text-muted">{listing.location}</span>
              </div>
              <h2>
                {listing.price.toLocaleString()} FCFA/month
              </h2>

              <div className="row g-3 mb-4">
                <div className="col-4">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h5 mb-0">{listing.bedrooms ?? '-'}</div>
                    <small className="text-muted">Bedrooms</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h5 mb-0">{listing.bathrooms ?? '-'}</div>
                    <small className="text-muted">Bathrooms</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h5 mb-0">{listing.square_feet ?? '-'}</div>
                    <small className="text-muted">Sq Ft</small>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <span className="badge bg-light text-dark me-2">
                  {listing.property_type.charAt(0).toUpperCase() + listing.property_type.slice(1)}
                </span>
              </div>

              {/* Contact Button */}
              {!isLandlord && listing.status === 'available' && (
                <button
                  className="btn btn-success btn-lg w-100 mb-3"
                  onClick={handleContact}
                  disabled={isContacting}
                >
                  {isContacting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="me-2" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                      </svg>
                      Contact via WhatsApp
                    </>
                  )}
                </button>
              )}

              {contactUrl && (
                <div className="alert alert-success small">
                  <a href={contactUrl} target="_blank" rel="noopener noreferrer">
                    Click here if the WhatsApp window did not open
                  </a>
                </div>
              )}

              {/* Report Button */}
              {!isLandlord && (
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setShowReportModal(true)}
                >
                  Report Listing
                </button>
              )}

              {/* Landlord Edit Button */}
              {isLandlord && (
                <div className="mt-3 d-grid gap-2">
                  <Link href={`/landlord/listings/${listing.id}/edit`} className="btn btn-primary">
                    Edit Listing
                  </Link>
                  <Link href="/landlord/dashboard" className="btn btn-outline-secondary">
                    Back to Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Landlord Info */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Listed by</h5>
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                </div>
                <div>
                  <div className="fw-bold">{listing.landlord_email}</div>
                  <small className="text-muted">Landlord</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Description</h4>
              <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{listing.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      {listing.amenities && listing.amenities.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h4>Amenities</h4>
                <div className="d-flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <span key={amenity.id} className="amenity-tag">
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h4>Reviews</h4>

              {/* Review Form - Only for students */}
              {canReview && !reviewSuccess && (
                <form onSubmit={handleSubmitReview} className="mb-4 p-3 bg-light rounded">
                  <h5>Leave a Review</h5>
                  {reviewError && (
                    <div className="alert alert-danger">{reviewError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Your Rating *</label>
                    <div>
                      <StarRating
                        rating={reviewRating}
                        size="lg"
                        interactive
                        onChange={setReviewRating}
                      />
                    </div>
                    {reviewRating === 0 && (
                      <small className="text-muted">Click the stars to rate</small>
                    )}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reviewComment" className="form-label">
                      Comment (Optional)
                    </label>
                    <textarea
                      id="reviewComment"
                      className="form-control"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmittingReview || reviewRating === 0}
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {reviewSuccess && (
                <div className="alert alert-success mb-4">
                  Thank you for your review!
                </div>
              )}

              {/* Reviews List */}
              {listing.reviews && listing.reviews.length > 0 ? (
                <div className="reviews-list">
                  {listing.reviews.map((review) => (
                    <div key={review.id} className="border-bottom pb-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <StarRating rating={review.rating} size="sm" />
                          <div className="text-muted small mt-1">
                            {review.student_email} - {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-2 mb-2">{review.comment}</p>
                      )}

                      {/* Reply */}
                      {review.reply ? (
                        <div className="bg-light p-3 rounded mt-2 ms-4">
                          <div className="text-muted small mb-1">
                            <strong>Landlord Reply:</strong>
                          </div>
                          <p className="mb-0">{review.reply.text}</p>
                        </div>
                      ) : isLandlord && (
                        <div className="ms-4 mt-2">
                          {replyingTo === review.id ? (
                            <div className="d-flex gap-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                              />
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSubmitReply(review.id)}
                                disabled={isSubmittingReply || !replyText.trim()}
                              >
                                {isSubmittingReply ? '...' : 'Reply'}
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-link btn-sm p-0"
                              onClick={() => setReplyingTo(review.id)}
                            >
                              Reply to this review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetType="listing"
          targetId={listing.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
