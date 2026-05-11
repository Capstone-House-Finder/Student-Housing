'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { amenitiesApi, listingsApi, uploadPhotos } from '@/lib/api';
import { listingSchema, ListingFormData } from '@/lib/validations';

interface Amenity {
  id: number;
  name: string;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<(number | string)[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastStepTimestamp, setLastStepTimestamp] = useState(0);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
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
    const fetchAmenities = async () => {
      if (!token) return;
      const response = await amenitiesApi.getAll(token);
      if (response.success && response.data) {
        setAmenities(response.data as Amenity[]);
      }
    };

    if (token) {
      fetchAmenities();
    }
  }, [token]);

  const nextStep = async () => {
    let fieldsToValidate: (keyof ListingFormData)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'description', 'property_type'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['location', 'price'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['bedrooms', 'bathrooms', 'square_meters'];
    } else if (currentStep === 4) {
      if (photoFiles.length === 0) {
        setSubmitError('Please upload at least one photo');
        return;
      }
      setSubmitError('');
    }

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setLastStepTimestamp(Date.now());
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleAmenityToggle = (amenityId: number | string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleAddCustomAmenity = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      setSelectedAmenities((prev) => [...prev, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photoFiles.length > 10) {
      alert('Maximum 10 photos allowed');
      return;
    }

    setPhotoFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    // Form onSubmit (e.g. from Enter key) should only move to next step
    if (currentStep < totalSteps) {
      await nextStep();
    }
  };

  const handlePublish = async (data: ListingFormData) => {
    if (currentStep !== totalSteps) return;
    
    // Prevent accidental double-click from previous step
    if (Date.now() - lastStepTimestamp < 500) return;

    if (!token) return;
    if (photoFiles.length === 0) {
      setSubmitError('Please upload at least one photo');
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 1. Create the listing with JSON data
      const listingData = {
        ...data,
        amenities: selectedAmenities,
      };

      const result = await listingsApi.create(token, listingData);

      if (result.success && result.data) {
        const listingId = (result.data as any).id;
        
        // 2. Upload photos for the new listing
        const photoResult = await uploadPhotos(listingId, photoFiles, token);
        
        if (photoResult.success) {
          router.push('/landlord/dashboard');
        } else {
          setSubmitError(`Listing created, but photo upload failed: ${photoResult.error?.message || 'Unknown error'}. You can manage photos in the dashboard.`);
          // Still success in a way, but with warning
          setTimeout(() => router.push('/landlord/dashboard'), 3000);
        }
      } else {
        setSubmitError(result.error?.message || 'Failed to create listing');
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const formData = getValues();

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/landlord/dashboard">Dashboard</Link>
          </li>
          <li className="breadcrumb-item active">Create Listing</li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          {/* Progress Stepper */}
          <div className="mb-5">
            <div className="position-relative mb-4">
              <div className="progress" style={{ height: '2px' }}>
                <div 
                  className="progress-bar bg-primary" 
                  role="progressbar" 
                  style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                ></div>
              </div>
              <div className="d-flex justify-content-between position-absolute top-0 w-100" style={{ transform: 'translateY(-50%)' }}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <div 
                    key={step}
                    className={`rounded-circle d-flex align-items-center justify-content-center border-2 border ${
                      currentStep >= step ? 'bg-primary border-primary text-white' : 'bg-white border-secondary text-secondary'
                    }`}
                    style={{ width: '32px', height: '32px', fontWeight: 'bold', fontSize: '14px' }}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="d-flex justify-content-between px-1 text-center" style={{ margin: '0 -10px' }}>
              <span className={`small fw-bold flex-fill ${currentStep === 1 ? 'text-primary' : 'text-muted'}`}>Details</span>
              <span className={`small fw-bold flex-fill ${currentStep === 2 ? 'text-primary' : 'text-muted'}`}>Location</span>
              <span className={`small fw-bold flex-fill ${currentStep === 3 ? 'text-primary' : 'text-muted'}`}>Features</span>
              <span className={`small fw-bold flex-fill ${currentStep === 4 ? 'text-primary' : 'text-muted'}`}>Photos</span>
              <span className={`small fw-bold flex-fill ${currentStep === 5 ? 'text-primary' : 'text-muted'}`}>Review</span>
            </div>
          </div>

          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-header bg-white border-0 py-3">
              <h4 className="mb-0 fw-bold">Step {currentStep}: {
                currentStep === 1 ? 'General Information' : 
                currentStep === 2 ? 'Location & Pricing' : 
                currentStep === 3 ? 'Features & Amenities' : 
                currentStep === 4 ? 'Photo Gallery' :
                'Review & Publish'
              }</h4>
            </div>
            <div className="card-body p-4">
              {submitError && (
                <div className="alert alert-danger mb-4">{submitError}</div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="row g-4 animate-in">
                    <div className="col-12">
                      <label htmlFor="title" className="form-label fw-bold">Title <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        id="title"
                        className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                        placeholder="e.g., Luxury Penthouse near campus"
                        {...register('title')}
                      />
                      {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                    </div>

                    <div className="col-12">
                      <label htmlFor="description" className="form-label fw-bold">Description <span className="text-danger">*</span></label>
                      <textarea
                        id="description"
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        rows={6}
                        placeholder="Provide a detailed description of your property..."
                        {...register('description')}
                      ></textarea>
                      {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="propertyType" className="form-label fw-bold">Property Type <span className="text-danger">*</span></label>
                      <select
                        id="propertyType"
                        className={`form-select form-select-lg ${errors.property_type ? 'is-invalid' : ''}`}
                        {...register('property_type')}
                      >
                        <option value="">Select type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="room">Room</option>
                        <option value="condo">Condo</option>
                        <option value="townhouse">Townhouse</option>
                      </select>
                      {errors.property_type && <div className="invalid-feedback">{errors.property_type.message}</div>}
                    </div>
                  </div>
                )}

                {/* Step 2: Location & Price */}
                {currentStep === 2 && (
                  <div className="row g-4 animate-in">
                    <div className="col-12">
                      <label htmlFor="location" className="form-label fw-bold">Address / Location <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        id="location"
                        className={`form-control form-control-lg ${errors.location ? 'is-invalid' : ''}`}
                        placeholder="e.g., 123 University Ave, City"
                        {...register('location')}
                      />
                      {errors.location && <div className="invalid-feedback">{errors.location.message}</div>}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="price" className="form-label fw-bold">Monthly Rent (FCFA) <span className="text-danger">*</span></label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text">FCFA</span>
                        <input
                          type="number"
                          id="price"
                          className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                          placeholder="e.g., 1500"
                          {...register('price', { valueAsNumber: true })}
                        />
                      </div>
                      {errors.price && <div className="invalid-feedback d-block">{errors.price.message}</div>}
                    </div>
                  </div>
                )}

                {/* Step 3: Features & Amenities */}
                {currentStep === 3 && (
                  <div className="row g-4 animate-in">
                    <div className="col-md-4">
                      <label htmlFor="bedrooms" className="form-label fw-bold">Bedrooms</label>
                      <input
                        type="number"
                        id="bedrooms"
                        className={`form-control form-control-lg ${errors.bedrooms ? 'is-invalid' : ''}`}
                        placeholder="0"
                        {...register('bedrooms', { valueAsNumber: true })}
                      />
                      {errors.bedrooms && <div className="invalid-feedback">{errors.bedrooms.message}</div>}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="bathrooms" className="form-label fw-bold">Bathrooms</label>
                      <input
                        type="number"
                        id="bathrooms"
                        step="0.5"
                        className={`form-control form-control-lg ${errors.bathrooms ? 'is-invalid' : ''}`}
                        placeholder="0"
                        {...register('bathrooms', { valueAsNumber: true })}
                      />
                      {errors.bathrooms && <div className="invalid-feedback">{errors.bathrooms.message}</div>}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="squareMeters" className="form-label fw-bold">Sq. Meters</label>
                      <input
                        type="number"
                        id="squareMeters"
                        className={`form-control form-control-lg ${errors.square_meters ? 'is-invalid' : ''}`}
                        placeholder="e.g., 100"
                        {...register('square_meters', { valueAsNumber: true })}
                      />
                      {errors.square_meters && <div className="invalid-feedback">{errors.square_meters.message}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold d-block mb-3">Amenities</label>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {amenities.map((amenity) => (
                          <button
                            key={amenity.id}
                            type="button"
                            className={`btn btn-sm px-3 rounded-pill transition-all ${
                              selectedAmenities.includes(amenity.id) ? 'btn-primary' : 'btn-outline-secondary'
                            }`}
                            onClick={() => handleAmenityToggle(amenity.id)}
                          >
                            {amenity.name}
                          </button>
                        ))}
                        {selectedAmenities.filter(a => typeof a === 'string').map((name) => (
                          <button
                            key={name}
                            type="button"
                            className="btn btn-sm btn-primary px-3 rounded-pill"
                            onClick={() => handleAmenityToggle(name)}
                          >
                            {name} <span className="ms-1">&times;</span>
                          </button>
                        ))}
                      </div>
                      
                      <div className="input-group input-group-sm mb-2" style={{ maxWidth: '400px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Add custom amenity..."
                          value={customAmenity}
                          onChange={(e) => setCustomAmenity(e.target.value)}
                          onKeyDown={handleAddCustomAmenity}
                        />
                        <button className="btn btn-primary" type="button" onClick={handleAddCustomAmenity}>Add</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Photos */}
                {currentStep === 4 && (
                  <div className="row g-4 animate-in">
                    <div className="col-12 text-center py-4">
                      <div className="photo-upload-zone p-5 border-2 border-dashed rounded-4 bg-light mb-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          id="photos-input"
                          multiple
                          onChange={handlePhotoChange}
                        />
                        <label htmlFor="photos-input" className="btn btn-primary btn-lg mb-3 cursor-pointer">
                          <i className="bi bi-cloud-upload me-2"></i> Select Photos
                        </label>
                        <p className="text-muted mb-0">Upload up to 10 high-quality images of your property</p>
                      </div>

                      <div className="row g-3">
                        {photoPreview.map((preview, index) => (
                          <div key={index} className="col-6 col-md-3">
                            <div className="position-relative ratio ratio-4x3 group">
                              <img src={preview} alt="Preview" className="object-fit-cover rounded-3 shadow-sm" />
                              <button
                                type="button"
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removePhoto(index)}
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <div className="animate-in">
                    <div className="row g-4">
                      <div className="col-md-7">
                        <div className="mb-4">
                          <h6 className="text-uppercase text-muted small fw-bold mb-2">General Information</h6>
                          <h2 className="h4 mb-2">{formData.title}</h2>
                          <p className="badge bg-primary mb-3">{formData.property_type}</p>
                          <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{formData.description}</p>
                        </div>

                        <div className="mb-4">
                          <h6 className="text-uppercase text-muted small fw-bold mb-2">Location & Pricing</h6>
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-geo-alt text-primary me-2"></i>
                            <span>{formData.location}</span>
                          </div>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-cash text-primary me-2"></i>
                            <span className="fw-bold">{formData.price?.toLocaleString()} FCFA / month</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h6 className="text-uppercase text-muted small fw-bold mb-2">Features</h6>
                          <div className="row g-2">
                            <div className="col-4">
                              <div className="bg-light p-2 rounded text-center">
                                <div className="fw-bold">{formData.bedrooms || 0}</div>
                                <div className="small text-muted">Beds</div>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light p-2 rounded text-center">
                                <div className="fw-bold">{formData.bathrooms || 0}</div>
                                <div className="small text-muted">Baths</div>
                              </div>
                            </div>
                            <div className="col-4">
                              <div className="bg-light p-2 rounded text-center">
                                <div className="fw-bold">{formData.square_meters || 0}</div>
                                <div className="small text-muted">m²</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-0">
                          <h6 className="text-uppercase text-muted small fw-bold mb-2">Amenities</h6>
                          <div className="d-flex flex-wrap gap-1">
                            {selectedAmenities.map(id => {
                              const name = typeof id === 'number' ? amenities.find(a => a.id === id)?.name : id;
                              return <span key={id} className="badge bg-light text-dark border">{name}</span>;
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-5">
                        <h6 className="text-uppercase text-muted small fw-bold mb-2">Photos ({photoPreview.length})</h6>
                        <div className="row g-2">
                          {photoPreview.map((p, i) => (
                            <div key={i} className={i === 0 ? 'col-12' : 'col-4'}>
                              <img src={p} className="img-fluid rounded shadow-sm object-fit-cover" style={{ height: i === 0 ? '200px' : '80px', width: '100%' }} alt="" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="alert alert-info mt-5 border-0 bg-primary bg-opacity-10 d-flex align-items-center">
                      <i className="bi bi-info-circle-fill text-primary me-3 h4 mb-0"></i>
                      <div>
                        <strong>Ready to go?</strong> Once you publish, your listing will be visible to students across the platform.
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Controls */}
                <div className="d-flex justify-content-between mt-5 pt-4 border-top">
                  {currentStep > 1 ? (
                    <button type="button" className="btn btn-outline-secondary btn-lg px-4" onClick={prevStep}>
                      Back
                    </button>
                  ) : (
                    <Link href="/landlord/dashboard" className="btn btn-link text-muted px-0">Cancel</Link>
                  )}

                  {currentStep < totalSteps ? (
                    <button type="button" className="btn btn-primary btn-lg px-5" onClick={nextStep}>
                      Next Step
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-primary btn-lg px-5" 
                      disabled={isSubmitting}
                      onClick={handleSubmit(handlePublish)}
                    >
                      {isSubmitting ? 'Publishing...' : 'Finish & Publish'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
