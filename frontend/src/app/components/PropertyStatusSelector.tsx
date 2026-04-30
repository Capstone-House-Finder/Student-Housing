// frontend/src/components/PropertyStatusSelector.tsx
'use client';

import { useState } from 'react';
import { PropertyStatus, updatePropertyStatus } from '@/services/listingService';

interface PropertyStatusSelectorProps {
  listingId: string;
  currentStatus: PropertyStatus;
  onStatusChange: (newStatus: PropertyStatus) => void;
  disabled?: boolean;
}

const statusOptions = [
  { value: 'available', label: 'Available', color: '#002A22' },      // Evergreen
  { value: 'rented', label: 'Rented', color: '#EA638C' },            // Blush Rose
  { value: 'under_negotiation', label: 'Under Negotiation', color: '#B33C86' }, // Raspberry Plum
];

export default function PropertyStatusSelector({
  listingId,
  currentStatus,
  onStatusChange,
  disabled = false,
}: PropertyStatusSelectorProps) {
  const [status, setStatus] = useState<PropertyStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (statusValue: PropertyStatus) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option?.color || '#6B7280';
  };

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    if (newStatus === status) return;
    
    // Save previous status for rollback
    const previousStatus = status;
    
    // OPTIMISTIC UI UPDATE - Update immediately without waiting
    setStatus(newStatus);
    onStatusChange(newStatus);
    setError(null);
    setIsUpdating(true);

    try {
      // Make API call
      await updatePropertyStatus(listingId, newStatus);
    } catch (err) {
      // ROLLBACK on error
      setStatus(previousStatus);
      onStatusChange(previousStatus);
      setError(err instanceof Error ? err.message : 'Update failed');
      
      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as PropertyStatus)}
        disabled={disabled || isUpdating}
        className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
        style={{ 
          backgroundColor: 'white',
          color: getStatusColor(status),
          borderColor: getStatusColor(status) + '40',
          fontWeight: 500,
        }}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value} style={{ color: option.color }}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Loading indicator */}
      {isUpdating && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#EA638C] rounded-full animate-spin" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap bg-white px-2 py-1 rounded shadow z-10">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}