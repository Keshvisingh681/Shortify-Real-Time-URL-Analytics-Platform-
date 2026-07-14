import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Link2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devResetToken, setDevResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      setSuccess(true);
      if (res.devToken) {
        setDevResetToken(res.devToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-slate-200 bg-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-3">
            <Link2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Forgot Password</h2>
          <p className="text-slate-500 text-sm mt-1 text-center">We will generate reset instructions for your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center"><CheckCircle2 className="h-14 w-14 text-emerald-500" /></div>
            <p className="text-slate-600 text-sm">
              If an account is associated with that email, a password reset link has been dispatched!
            </p>
            {devResetToken && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left text-xs space-y-1.5">
                <span className="text-yellow-700 font-bold block">[DEV ONLY] SIMULATED EMAIL RESET LINK:</span>
                <Link to={`/reset-password?token=${devResetToken}`} className="text-slate-900 underline break-all font-mono font-medium">
                  Reset Password Link
                </Link>
              </div>
            )}
            <Link
              to="/login"
              className="w-full inline-block bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-3 px-4 rounded-xl text-center transition shadow-md hover:shadow-lg"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-3 px-4 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {loading ? <span>Requesting...</span> : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-center text-slate-500 text-sm mt-8">
            Remembered password?{' '}
            <Link to="/login" className="text-yellow-600 hover:text-yellow-700 font-bold hover:underline">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
}
