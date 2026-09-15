import React, { useState } from 'react';
import { Star } from 'lucide-react';

const RATING_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent'
};

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = false,
  labelPrefix = ''
}) {
  const [hovered, setHovered] = useState(0);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const currentVal = hovered || value;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentVal;
          return (
            <button
              type="button"
              key={star}
              disabled={readOnly}
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHovered(star)}
              onMouseLeave={() => !readOnly && setHovered(0)}
              className={`transition-transform ${!readOnly ? 'hover:scale-110 cursor-pointer focus:outline-none' : 'cursor-default'}`}
              title={`${star} Star - ${RATING_LABELS[star]}`}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'text-slate-300 hover:text-amber-200'
                } transition-colors`}
              />
            </button>
          );
        })}
        {readOnly && (
          <span className="ml-1.5 text-xs font-semibold text-slate-700">
            {Number(value).toFixed(1)}
          </span>
        )}
      </div>
      {showLabel && currentVal > 0 && (
        <span className="text-xs font-medium text-amber-700">
          {labelPrefix} {currentVal} ⭐ ({RATING_LABELS[currentVal]})
        </span>
      )}
    </div>
  );
}
