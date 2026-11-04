import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div 
      className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-glass animate-pulse flex flex-col justify-between"
      aria-hidden="true"
    >
      <div>
        <div className="w-full h-56 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl mb-4" />
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 bg-slate-200/80 dark:bg-slate-800/80 rounded w-1/3" />
          <div className="h-4 bg-slate-200/80 dark:bg-slate-800/80 rounded-full w-16" />
        </div>
        <div className="h-5 bg-slate-200/80 dark:bg-slate-800/80 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200/80 dark:bg-slate-800/80 rounded w-1/2 mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
          <div className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
          <div className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
        </div>
      </div>
      <div>
        <div className="h-6 bg-slate-200/80 dark:bg-slate-800/80 rounded w-1/2 mb-3" />
        <div className="h-10 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl w-full" />
      </div>
    </div>
  );
};
