// frontend/src/app/components/student/EmptyState.tsx
'use client';

interface EmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, message, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🎓</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-md text-white transition-colors"
          style={{ backgroundColor: '#EA638C' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}