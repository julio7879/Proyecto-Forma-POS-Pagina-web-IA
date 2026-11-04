// frontend/src/features/storefront/components/ProductGridSkeleton.tsx
export const ProductGridSkeleton = () => {
  return (
    <div
      aria-label="Cargando productos"
      aria-busy="true"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 animate-pulse flex flex-col gap-4"
        >
          <div className="w-full h-56 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="mt-auto h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
        </div>
      ))}
    </div>
  );
};