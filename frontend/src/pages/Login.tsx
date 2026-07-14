import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Link2, Lock, Mail, ArrowRight } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      localStorage.setItem('isAdmin', String(data.user.isAdmin));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-slate-200 bg-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-3">
            <Link2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-1">Enter credentials to access your short links</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 text-sm transition outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-yellow-600 hover:text-yellow-700 font-semibold hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 text-sm transition outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-3 px-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {loading ? <span>Connecting...</span> : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-yellow-600 hover:text-yellow-700 font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
