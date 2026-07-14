import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Link2, LogOut, ShieldAlert } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
      <div className="flex items-center space-x-2">
        <Link to="/" className="flex items-center space-x-2 text-slate-900 font-extrabold text-2xl tracking-tight">
          <div className="h-9 w-9 bg-yellow-400 text-slate-950 rounded-xl flex items-center justify-center shadow-sm shadow-yellow-500/20">
            <Link2 className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-slate-900">Shortify</span>
        </Link>
      </div>

      {isLoggedIn && (
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-slate-600 hover:text-slate-900 transition font-semibold text-sm">Dashboard</Link>
          <Link to="/profile" className="text-slate-600 hover:text-slate-900 transition font-semibold text-sm">Profile</Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center space-x-1.5 text-yellow-600 hover:text-yellow-700 transition font-semibold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-xl transition text-sm font-semibold shadow-sm cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}
