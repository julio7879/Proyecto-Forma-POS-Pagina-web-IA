// Se elimina la importación de React porque el plugin de Vite (jsx: react-jsx) ya no lo requiere
import { Link } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/10 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">
          Forma Store
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/catalogo" className="text-sm font-medium hover:text-indigo-600 transition-colors">Catálogo</Link>
          <Link to="/login" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Link>
          <Link to="/cart" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
            <ShoppingBag className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-950"></span>
          </Link>
        </div>
      </div>
    </nav>
  );
};