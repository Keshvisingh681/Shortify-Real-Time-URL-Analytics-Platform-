import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { 
  Users, Layers, BarChart3, Shield, 
  Trash2, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  totalUrls: number;
  totalClicks: number;
  activeUsers: number;
}

interface UserListItem {
  id: string;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
  avatarUrl: string | null;
  createdAt: string;
  clickCount: number;
  _count: {
    shortUrls: number;
  };
}

export function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = useCallback(async () => {
    try {
      const [statsData, usersList] = await Promise.all([
        api.getAdminStats(),
        api.listAdminUsers()
      ]);
      setStats(statsData);
      setUsers(usersList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`Are you absolutely sure you want to delete user "${email}"? This will delete all their shortened links and metrics permanently.`)) return;

    try {
      await api.deleteAdminUser(id);
      alert('User deleted successfully.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-slate-500 font-semibold font-medium">
        Loading admin console metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-red-655 text-red-600 font-semibold">{error}</div>
        <Link to="/" className="inline-flex items-center text-yellow-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Console</h1>
        <p className="text-slate-500 mt-1 font-medium">Platform management and overall usage telemetry.</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Users className="h-10 w-10" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Members</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.totalUsers}</p>
            <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
          </div>

          <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Users className="h-10 w-10 animate-pulse" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Members</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.activeUsers}</p>
            <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
          </div>

          <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Layers className="h-10 w-10" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global URLs</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.totalUrls}</p>
            <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
          </div>

          <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><BarChart3 className="h-10 w-10" /></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Clicks</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.totalClicks}</p>
            <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-500" />
          <span>User Management Registry</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">URLs Created</th>
                <th className="py-3 px-4">Total Clicks</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {users.map((u, idx) => (
                <tr key={u.id} className={`transition ${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-100/50`}>
                  <td className="py-3.5 px-4 flex items-center space-x-3">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-250">
                        <Users className="h-4 w-4" />
                      </div>
                    )}
                    <span className="text-slate-900 font-semibold">{u.email}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isAdmin ? (
                      <span className="inline-flex items-center space-x-1 text-yellow-600 font-bold">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Member</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {u.isVerified ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-650">{u._count.shortUrls}</td>
                  <td className="py-3.5 px-4 text-yellow-600 font-bold">{u.clickCount}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="p-1.5 bg-red-50 text-red-650 border border-red-200 rounded hover:bg-red-100 transition cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
