'use client';

interface EmptyStateProps {
  onReset: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h3>
      <p className="text-gray-500 mb-4">
        Try adjusting your filters or removing some criteria
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-md text-white transition-colors"
        style={{ backgroundColor: '#EA638C' }}
      >
        Clear all filters
      </button>
    </div>
  );
}