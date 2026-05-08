'use client';

import { useState } from 'react';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxImages?: number;
  previewUrls?: string[];
}

export default function ImageUpload({ onImagesSelected, maxImages = 10, previewUrls = [] }: ImageUploadProps) {
  const [selected, setSelected] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(previewUrls);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxImages - previews.length;

    if (files.length > remaining) {
      alert(`You can only upload ${remaining} more image(s)`);
      return;
    }

    setSelected(files);

    // Generate previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    onImagesSelected(files);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-3">
      <label className="form-label fw-bold">Property Images</label>
      <div className="card border-dashed mb-3">
        <div className="card-body text-center py-5">
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="d-none"
          />
          <label htmlFor="image-upload" className="mb-0 cursor-pointer">
            <i className="bi bi-cloud-upload" style={{ fontSize: '2rem', color: '#0d6efd' }}></i>
            <p className="mt-2 mb-0">Click to upload or drag and drop</p>
            <p className="text-muted small mb-0">PNG, JPG, GIF up to 10MB</p>
          </label>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="row g-2">
          {previews.map((preview, idx) => (
            <div key={idx} className="col-md-3 col-sm-4 col-6">
              <div className="position-relative">
                <img src={preview} alt={`Preview ${idx}`} className="img-fluid rounded" />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0"
                  onClick={() => removePreview(idx)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <small className="text-muted">
        {previews.length} / {maxImages} images uploaded
      </small>
    </div>
  );
}
