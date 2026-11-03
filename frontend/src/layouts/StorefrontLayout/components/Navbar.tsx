import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut } from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuarioRaw = localStorage.getItem('usuario');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/10 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">
          Forma Store
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-indigo-600 transition-colors">Catálogo</Link>
          <Link to="/carrito" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
            <ShoppingBag className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-950"></span>
          </Link>
          {token ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {usuario?.nombreCompleto || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};