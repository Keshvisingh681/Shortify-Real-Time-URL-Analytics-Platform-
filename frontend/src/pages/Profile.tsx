import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  User, ShieldCheck, ShieldAlert, Key, 
  Upload, CheckCircle2, ArrowLeft, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileData {
  id: string;
  email: string;
  isVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Avatar upload state
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  async function fetchProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;
      setAvatarLoading(true);
      setAvatarSuccess(false);

      try {
        await api.updateProfile({ avatarUrl: base64String });
        setAvatarSuccess(true);
        fetchProfile();
      } catch (err: any) {
        alert(err.message || 'Failed to update avatar image');
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.onerror = (error) => {
      console.error('File reader error: ', error);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-slate-500 font-semibold font-medium">
        Fetching profile details...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-red-600 font-semibold">{error || 'Failed to load profile'}</div>
        <Link to="/" className="inline-flex items-center text-yellow-600 hover:underline gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Back button */}
      <div>
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 font-semibold gap-2 group transition">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card & Avatar */}
        <div className="md:col-span-1 glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-6 h-fit relative">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt="User avatar" 
                  className="h-24 w-24 rounded-2xl object-cover border border-slate-200 bg-slate-50"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-yellow-50 border border-yellow-250 text-yellow-600 flex items-center justify-center">
                  <User className="h-10 w-10" />
                </div>
              )}

              {/* Upload Overlay */}
              <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition duration-200">
                <Upload className="h-5 w-5 text-yellow-400" />
                <span className="text-3xs font-semibold text-slate-200 mt-1">Upload</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarFile} 
                  className="hidden" 
                />
              </label>
            </div>

            {avatarLoading && (
              <div className="flex items-center space-x-1 text-xs text-yellow-655 text-yellow-600 font-semibold">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}

            {avatarSuccess && (
              <span className="text-2xs text-emerald-600 font-semibold">Avatar updated!</span>
            )}

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg break-all">{profile.email.split('@')[0]}</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>

            {profile.isVerified ? (
              <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Account</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-700 border border-amber-250 px-3 py-1 rounded-full text-xs font-semibold">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Unverified Account</span>
              </div>
            )}
          </div>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400 rounded-b-2xl"></div>
        </div>

        {/* Edit Password & Details */}
        <div className="md:col-span-2 glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-6 relative">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-yellow-500" />
              <span>Security Settings</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1 font-medium">Manage credentials and protect security parameters</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-405 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-405 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-405 text-sm outline-none transition"
              />
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-medium">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-2.5 px-6 rounded-xl transition shadow-md hover:shadow-lg text-sm cursor-pointer active:scale-[0.98]"
            >
              {passwordLoading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400 rounded-b-2xl"></div>
        </div>
      </div>
    </div>
  );
}
