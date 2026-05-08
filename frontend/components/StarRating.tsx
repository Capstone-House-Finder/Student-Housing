'use client';

interface StarRatingProps {
  rating?: number;
  value?: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  value,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const currentRating = rating ?? value ?? 0;
  const sizeClass = {
    sm: 14,
    md: 20,
    lg: 28,
  }[size];

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="star-rating d-inline-flex">
      {Array.from({ length: maxRating }, (_, index) => (
        <svg
          key={index}
          xmlns="http://www.w3.org/2000/svg"
          width={sizeClass}
          height={sizeClass}
          fill="currentColor"
          className={`${index < currentRating ? '' : 'empty'} ${interactive ? 'cursor-pointer' : ''}`}
          viewBox="0 0 16 16"
          onClick={() => handleClick(index)}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg>
      ))}
    </div>
  );
}
