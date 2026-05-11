'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { amenitiesApi, listingsApi } from '@/lib/api';
import { listingSchema, ListingFormData } from '@/lib/validations';

interface Amenity {
  id: number;
  name: string;
}

interface Photo {
  id: number;
  url: string;
  public_id: string;
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
  square_meters?: number;
  status: string;
  amenities: Amenity[];
  photos: Photo[];
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const listingId = Number(params.id);

  const [listing, setListing] = useState<Listing | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      if (user?.role !== 'landlord') {
        router.push('/');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      // Fetch listing
      const listingResponse = await listingsApi.getById(token, listingId);
      if (listingResponse.success && listingResponse.data) {
        const data = listingResponse.data as Listing;
        setListing(data);
        setSelectedAmenities(data.amenities?.map((a) => a.id) || []);
        setExistingPhotos(data.photos || []);

        // Set form values
        reset({
          title: data.title,
          description: data.description,
          price: data.price,
          location: data.location,
          property_type: data.property_type as ListingFormData['property_type'],
          bedrooms: data.bedrooms || undefined,
          bathrooms: data.bathrooms || undefined,
          square_meters: data.square_meters || undefined,
        });
      }

      // Fetch amenities
      const amenitiesResponse = await amenitiesApi.getAll(token);
      if (amenitiesResponse.success && amenitiesResponse.data) {
        setAmenities(amenitiesResponse.data as Amenity[]);
      }

      setIsLoading(false);
    };

    if (token) {
      fetchData();
    }
  }, [token, listingId, reset]);

  const handleAmenityToggle = (amenityId: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalPhotos = existingPhotos.length - photosToDelete.length + newPhotoFiles.length + files.length;

    if (totalPhotos > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }

    setNewPhotoFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoPreview((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingPhoto = (photoId: number) => {
    setPhotosToDelete((prev) => [...prev, photoId]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    setSubmitError('');

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('location', data.location);
    formData.append('property_type', data.property_type);
    if (data.bedrooms) formData.append('bedrooms', data.bedrooms.toString());
    if (data.bathrooms) formData.append('bathrooms', data.bathrooms.toString());
    if (data.square_meters) formData.append('square_meters', data.square_meters.toString());

    selectedAmenities.forEach((id) => {
      formData.append('amenities[]', id.toString());
    });

    photosToDelete.forEach((id) => {
      formData.append('delete_photos[]', id.toString());
    });

    newPhotoFiles.forEach((file) => {
      formData.append('photos', file);
    });

    const result = await listingsApi.update(token, listingId, formData);

    if (result.success) {
      router.push('/landlord/dashboard');
    } else {
      setSubmitError(result.error?.message || 'Failed to update listing');
    }

    setIsSubmitting(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">Listing not found</div>
        <Link href="/landlord/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const visibleExistingPhotos = existingPhotos.filter(
    (p) => !photosToDelete.includes(p.id)
  );
  const totalPhotos = visibleExistingPhotos.length + newPhotoFiles.length;

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/landlord/dashboard">Dashboard</Link>
          </li>
          <li className="breadcrumb-item active">Edit Listing</li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Edit Listing</h4>
              <span className={`badge ${listing.status === 'available' ? 'bg-success' : 'bg-secondary'}`}>
                {listing.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
            <div className="card-body">
              {submitError && (
                <div className="alert alert-danger">{submitError}</div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Basic Info */}
                <h5 className="mb-3">Basic Information</h5>
                <div className="row g-3 mb-4">
                  <div className="col-12">
                    <label htmlFor="title" className="form-label">
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      {...register('title')}
                    />
                    {errors.title && (
                      <div className="invalid-feedback">{errors.title.message}</div>
                    )}
                  </div>

                  <div className="col-12">
                    <label htmlFor="description" className="form-label">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="description"
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      rows={4}
                      {...register('description')}
                    ></textarea>
                    {errors.description && (
                      <div className="invalid-feedback">{errors.description.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="price" className="form-label">
                      Monthly Rent ($) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="price"
                      className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                      {...register('price', { valueAsNumber: true })}
                    />
                    {errors.price && (
                      <div className="invalid-feedback">{errors.price.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="location" className="form-label">
                      Location <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                      {...register('location')}
                    />
                    {errors.location && (
                      <div className="invalid-feedback">{errors.location.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="propertyType" className="form-label">
                      Property Type <span className="text-danger">*</span>
                    </label>
                    <select
                      id="propertyType"
                      className={`form-select ${errors.property_type ? 'is-invalid' : ''}`}
                      {...register('property_type')}
                    >
                      <option value="">Select type</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="room">Room</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                    </select>
                    {errors.property_type && (
                      <div className="invalid-feedback">{errors.property_type.message}</div>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <h5 className="mb-3">Property Details</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label htmlFor="bedrooms" className="form-label">Bedrooms</label>
                    <input
                      type="number"
                      id="bedrooms"
                      className={`form-control ${errors.bedrooms ? 'is-invalid' : ''}`}
                      min="0"
                      {...register('bedrooms', { valueAsNumber: true })}
                    />
                    {errors.bedrooms && (
                      <div className="invalid-feedback">{errors.bedrooms.message}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="bathrooms" className="form-label">Bathrooms</label>
                    <input
                      type="number"
                      id="bathrooms"
                      className={`form-control ${errors.bathrooms ? 'is-invalid' : ''}`}
                      min="0"
                      step="0.5"
                      {...register('bathrooms', { valueAsNumber: true })}
                    />
                    {errors.bathrooms && (
                      <div className="invalid-feedback">{errors.bathrooms.message}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="squareMeters" className="form-label">Square Meters</label>
                    <input
                      type="number"
                      id="squareMeters"
                      className={`form-control ${errors.square_meters ? 'is-invalid' : ''}`}
                      min="0"
                      {...register('square_meters', { valueAsNumber: true })}
                    />
                    {errors.square_meters && (
                      <div className="invalid-feedback">{errors.square_meters.message}</div>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                <h5 className="mb-3">Amenities</h5>
                <div className="mb-4">
                  <div className="d-flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                      <button
                        key={amenity.id}
                        type="button"
                        className={`btn btn-sm ${
                          selectedAmenities.includes(amenity.id)
                            ? 'btn-primary'
                            : 'btn-outline-secondary'
                        }`}
                        onClick={() => handleAmenityToggle(amenity.id)}
                      >
                        {amenity.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <h5 className="mb-3">Photos</h5>
                <div className="mb-4">
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    {/* Existing Photos */}
                    {visibleExistingPhotos.map((photo) => (
                      <div key={photo.id} className="position-relative">
                        <img
                          src={photo.url}
                          alt="Property"
                          className="rounded"
                          style={{ width: '120px', height: '90px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0"
                          style={{ transform: 'translate(25%, -25%)' }}
                          onClick={() => removeExistingPhoto(photo.id)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}

                    {/* New Photo Previews */}
                    {newPhotoPreview.map((preview, index) => (
                      <div key={`new-${index}`} className="position-relative">
                        <img
                          src={preview}
                          alt={`New Preview ${index + 1}`}
                          className="rounded border border-success border-2"
                          style={{ width: '120px', height: '90px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0"
                          style={{ transform: 'translate(25%, -25%)' }}
                          onClick={() => removeNewPhoto(index)}
                        >
                          &times;
                        </button>
                        <span className="badge bg-success position-absolute bottom-0 start-50 translate-middle-x">New</span>
                      </div>
                    ))}

                    {/* Add Photo Button */}
                    {totalPhotos < 5 && (
                      <label
                        className="border border-dashed rounded d-flex align-items-center justify-content-center"
                        style={{ width: '120px', height: '90px', cursor: 'pointer' }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          multiple
                          onChange={handlePhotoChange}
                        />
                        <div className="text-center text-muted">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                          </svg>
                          <div className="small">Add Photo</div>
                        </div>
                      </label>
                    )}
                  </div>
                  <small className="text-muted">Upload up to 5 photos total</small>
                </div>

                {/* Submit */}
                <div className="d-flex gap-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <Link href="/landlord/dashboard" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
