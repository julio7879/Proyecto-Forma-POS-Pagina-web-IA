import { Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';

export const StorefrontLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="pt-24 px-4 flex justify-center items-center min-h-[calc(100vh-6rem)]">
        <Outlet />
      </main>
    </div>
  );
};