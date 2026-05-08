'use client';

import { useState } from 'react';

interface FiltersSidebarProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  bedrooms: number | null;
  onBedroomChange: (num: number | null) => void;
  furnished: boolean | null;
  onFurnishedChange: (val: boolean | null) => void;
  onApplyFilters: () => void;
}

export default function FiltersSidebar({
  priceRange,
  onPriceChange,
  bedrooms,
  onBedroomChange,
  furnished,
  onFurnishedChange,
  onApplyFilters,
}: FiltersSidebarProps) {
  const [localPrice, setLocalPrice] = useState(priceRange);

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h6 className="mb-0">Filters</h6>
      </div>
      <div className="card-body">
        {/* Price Range */}
        <div className="mb-4">
          <label className="form-label fw-bold">
            Price Range: ${localPrice[0]} - ${localPrice[1]}
          </label>
          <div className="d-flex gap-2 align-items-center">
            <input
              type="range"
              className="form-range flex-grow-1"
              min="0"
              max="2000"
              step="50"
              value={localPrice[0]}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val <= localPrice[1]) {
                  setLocalPrice([val, localPrice[1]]);
                }
              }}
            />
          </div>
          <div className="d-flex gap-2 align-items-center mt-2">
            <input
              type="range"
              className="form-range flex-grow-1"
              min="0"
              max="2000"
              step="50"
              value={localPrice[1]}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= localPrice[0]) {
                  setLocalPrice([localPrice[0], val]);
                }
              }}
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div className="mb-4">
          <label className="form-label fw-bold">Bedrooms</label>
          <div className="d-flex gap-2">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                className={`btn btn-sm ${bedrooms === num ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => onBedroomChange(bedrooms === num ? null : num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Furnished */}
        <div className="mb-4">
          <label className="form-label fw-bold">Furnished</label>
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm flex-grow-1 ${furnished === true ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onFurnishedChange(furnished === true ? null : true)}
            >
              Yes
            </button>
            <button
              className={`btn btn-sm flex-grow-1 ${furnished === false ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => onFurnishedChange(furnished === false ? null : false)}
            >
              No
            </button>
          </div>
        </div>

        {/* Apply Filters */}
        <button
          className="btn btn-primary w-100"
          onClick={() => {
            onPriceChange(localPrice);
            onApplyFilters();
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
