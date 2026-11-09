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
              className="rounded-3xl backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] p-5 space-y-3 animate-pulse shadow-[0_12px_30px_rgba(0,0,0,0.3)]"
            >
              <div className="h-3.5 w-28 bg-white/20 rounded" />
              <div className="h-7 w-36 bg-white/30 rounded" />
              <div className="h-3 w-24 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}
      <div className="rounded-3xl backdrop-blur-2xl bg-white/[0.07] border border-white/[0.14] p-5 space-y-3 shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={`row-skel-${idx}`}
            className="h-[52px] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse px-4 flex items-center justify-between gap-4"
          >
            <div className="h-3.5 bg-white/20 rounded w-1/4" />
            <div className="h-3.5 bg-white/15 rounded w-1/3" />
            <div className="h-3.5 bg-white/10 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
