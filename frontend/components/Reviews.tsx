'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import { API } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewsProps {
  listingId: string;
  reviews: Array<{
    id: string;
    studentName: string;
    rating: number;
    comment: string;
    createdAt: string;
    replies?: Array<{
      id: string;
      message: string;
      createdAt: string;
    }>;
  }>;
}

export default function Reviews({ listingId, reviews: initialReviews }: ReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (!rating || !comment.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await API.post(`/listings/${listingId}/reviews`, {
        rating,
        comment,
      });

      const newReview = {
        id: Date.now().toString(),
        studentName: user?.full_name || user?.email || 'Anonymous',
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      setReviews([newReview, ...reviews]);
      setShowForm(false);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-5">
      <h3 className="mb-4">Reviews ({reviews.length})</h3>

      {user?.role === 'student' && (
        <div className="mb-4">
          {!showForm ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Write a Review
            </button>
          ) : (
            <div className="card mb-4">
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Rating</label>
                  <div>
                    <StarRating value={rating} onChange={setRating} interactive />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="comment" className="form-label">
                    Your Review
                  </label>
                  <textarea
                    id="comment"
                    className="form-control"
                    rows={4}
                    placeholder="Share your experience with this property..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitReview}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-muted">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="card-subtitle mb-1">{review.studentName}</h6>
                    <div className="mb-2">
                      <StarRating value={review.rating} />
                    </div>
                  </div>
                  <small className="text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <p className="card-text mb-0">{review.comment}</p>

                {review.replies && review.replies.length > 0 && (
                  <div className="mt-3 ps-3 border-start">
                    <small className="text-muted">Landlord Reply:</small>
                    {review.replies.map((reply) => (
                      <p key={reply.id} className="mb-1 small">
                        {reply.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
