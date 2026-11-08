import React from 'react';

export interface LoadingStateProps {
  rows?: number;
  cards?: number;
  title?: string;
  testId?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 6,
  cards = 0,
  title,
  testId,
  className = '',
}) => {
  return (
    <div data-testid={testId} className={`space-y-4 ${className}`} role="status" aria-live="polite">
      {title && (
        <span className="sr-only">{title}</span>
      )}
      {cards > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={`card-skel-${i}`}
              className="rounded-[14px] bg-[#FFFFFF] border border-[#E7E0D8] p-5 space-y-3 animate-pulse"
            >
              <div className="h-3.5 w-28 bg-[#E7E0D8] rounded" />
              <div className="h-7 w-36 bg-[#E7E0D8]/80 rounded" />
              <div className="h-3 w-24 bg-[#F5F3EF] rounded" />
            </div>
          ))}
        </div>
      )}
      <div className="rounded-[14px] bg-[#FFFFFF] border border-[#E7E0D8] p-5 space-y-3 shadow-2xs">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={`row-skel-${idx}`}
            className="h-[52px] rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8]/60 animate-pulse px-4 flex items-center justify-between gap-4"
          >
            <div className="h-3.5 bg-[#E7E0D8] rounded w-1/4" />
            <div className="h-3.5 bg-[#E7E0D8]/70 rounded w-1/3" />
            <div className="h-3.5 bg-[#E7E0D8]/60 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
