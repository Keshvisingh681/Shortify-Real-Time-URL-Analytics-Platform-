import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Loader2, Link2 } from 'lucide-react';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }

      try {
        await api.verifyEmail(token);
        setStatus('success');
        setMessage('Your email address has been verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The token may be invalid or expired.');
      }
    }
    verify();
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-slate-200 bg-white shadow-xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>

        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-3">
            <Link2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Email Verification</h2>
        </div>

        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-yellow-500 animate-spin" />
            <p className="text-slate-500 text-sm">Verifying your token, please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 space-y-6">
            <div className="flex justify-center"><CheckCircle2 className="h-16 w-16 text-emerald-500" /></div>
            <p className="text-slate-600 text-sm">{message}</p>
            <Link
              to="/login"
              className="w-full inline-block bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-3 px-4 rounded-xl transition shadow-md hover:shadow-lg"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 space-y-6">
            <div className="flex justify-center"><XCircle className="h-16 w-16 text-red-500" /></div>
            <p className="text-red-600 text-sm">{message}</p>
            <Link
              to="/"
              className="w-full inline-block bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition"
            >
              Return Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
