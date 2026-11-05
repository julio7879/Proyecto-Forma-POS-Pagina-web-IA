import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Package } from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(() => ({
    token: localStorage.getItem('token'),
    usuario: (() => {
      try {
        const raw = localStorage.getItem('usuario');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })(),
  }));

  // Sincronizar reactivamente la sesión al cambiar de ruta o en evento storage entre pestañas
  useEffect(() => {
    const syncSession = () => {
      try {
        const raw = localStorage.getItem('usuario');
        setSession({
          token: localStorage.getItem('token'),
          usuario: raw ? JSON.parse(raw) : null,
        });
      } catch {
        setSession({ token: null, usuario: null });
      }
    };

    window.addEventListener('storage', syncSession);
    syncSession();
    return () => window.removeEventListener('storage', syncSession);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setSession({ token: null, usuario: null });
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/10 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500"
        >
          Forma Store
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium hover:text-indigo-600 transition-colors"
          >
            Catálogo
          </Link>

          {/* Mis Pedidos: solo visible con sesión activa (SP4-07) */}
          {session.token && (
            <Link
              to="/mis-pedidos"
              className="text-sm font-medium hover:text-indigo-600 transition-colors flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              Mis Pedidos
            </Link>
          )}

          <Link
            to="/carrito"
            aria-label="Ver carrito de compras"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
          >
            <ShoppingBag className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-950"></span>
          </Link>

          {session.token ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {session.usuario?.nombreCompleto || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Iniciar sesión"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};