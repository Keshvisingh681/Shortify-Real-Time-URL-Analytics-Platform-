import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Link2, Calendar, Clipboard, Trash2, ArrowUpRight, BarChart3, 
  Search, SlidersHorizontal, Activity, Clock, Layers, ShieldAlert,
  Edit2, Check, X, QrCode, Download, DownloadCloud
} from 'lucide-react';

interface UrlData {
  id: string;
  longUrl: string;
  shortCode: string;
  isEnabled: boolean;
  expiresAt: string | null;
  createdAt: string;
  clickCount: number;
}

interface DashboardStats {
  totalClicks: number;
  todayClicks: number;
  activeUrls: number;
  expiredUrls: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const titleVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  };

  const subtitleVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.2, duration: 0.5 } }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
  };
  
  // URL creation form state
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  // List of URLs state
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [totalUrls, setTotalUrls] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    totalClicks: 0,
    todayClicks: 0,
    activeUrls: 0,
    expiredUrls: 0
  });

  // Query filter states
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'longUrl' | 'shortCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLongUrl, setEditLongUrl] = useState('');
  const [editExpiry, setEditExpiry] = useState('');

  // QR Modal State
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeCode, setQrCodeCode] = useState('');

  // Export URLs to CSV
  const exportUrlsCSV = () => {
    if (urls.length === 0) return;
    const data = urls.map(u => ({
      shortCode: u.shortCode,
      longUrl: u.longUrl,
      clicks: u.clickCount,
      isEnabled: u.isEnabled,
      expiresAt: u.expiresAt || 'Never',
      createdAt: u.createdAt
    }));
    
    const headers = ['Short Code', 'Destination URL', 'Clicks', 'Enabled', 'Expires At', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.shortCode}"`,
        `"${row.longUrl.replace(/"/g, '""')}"`,
        row.clicks,
        row.isEnabled,
        `"${row.expiresAt}"`,
        `"${row.createdAt}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', 'shortify-urls.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download QR Code image blob
  const downloadQRCode = async (shortCode: string, url: string) => {
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(url)}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qrcode-${shortCode}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    }
  };

  // Fetch URLs & Stats
  const fetchData = useCallback(async () => {
    try {
      const urlsResponse = await api.listUrls({
        search,
        sortBy,
        sortOrder,
        page,
        limit: 8
      });
      setUrls(urlsResponse.urls);
      setTotalUrls(urlsResponse.total);
      setTotalPages(urlsResponse.totalPages);

      const statsResponse = await api.getDashboardStats();
      setStats(statsResponse);
    } catch (err: any) {
      if (err.message.includes('Unauthorized') || err.message.includes('Invalid token')) {
        api.logout();
        navigate('/login');
      }
    }
  }, [search, sortBy, sortOrder, page, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket Live Updates
  const handleWebSocketMessage = useCallback((event: string, payload: any) => {
    if (event === 'analytics_update') {
      setStats(payload.dashboardStats);
      
      setUrls(prevUrls => 
        prevUrls.map(url => 
          url.id === payload.shortUrlId 
            ? { ...url, clickCount: payload.stats.totalClicks } 
            : url
        )
      );
    }
  }, []);

  const isConnected = useWebSocket(handleWebSocketMessage);

  // Handle URL shortener creation submission
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setCreating(true);

    try {
      const expiresAt = expiryDate ? new Date(expiryDate).toISOString() : null;
      const created = await api.createUrl(longUrl, customAlias || undefined, expiresAt);
      
      setFormSuccess(`http://localhost:5000/${created.shortCode}`);
      setLongUrl('');
      setCustomAlias('');
      setExpiryDate('');
      
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create short URL');
    } finally {
      setCreating(false);
    }
  };

  // Toggle url enable/disable
  const handleToggleEnabled = async (url: UrlData) => {
    try {
      await api.updateUrl(url.id, { isEnabled: !url.isEnabled });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  // Inline edit submission
  const handleSaveEdit = async (id: string) => {
    try {
      const expiresAt = editExpiry ? new Date(editExpiry).toISOString() : null;
      await api.updateUrl(id, { longUrl: editLongUrl, expiresAt });
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update URL details');
    }
  };

  // Delete short url
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this short URL? All metrics will be lost permanently.')) return;
    try {
      await api.deleteUrl(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete URL');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in -mt-[30px]">
      {/* Header and Sync Status Container */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-4">
          <div className="relative inline-block">
            <motion.h1 
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              className="text-[40px] font-extrabold tracking-tight text-white leading-none"
              style={{ 
                fontWeight: 800,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(250, 204, 21, 0.1)'
              }}
            >
              Dashboard
            </motion.h1>
            <motion.div 
              className="absolute bottom-[-8px] left-0 h-[4px] bg-[#FACC15] rounded-full shadow-[0_0_12px_#FACC15]"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeInOut' }}
            />
          </div>
          <motion.p 
            variants={subtitleVariants}
            initial="hidden"
            animate="visible"
            className="text-white/90 mt-3 max-w-[700px] text-lg font-medium"
            style={{ lineHeight: 1.6 }}
          >
            Create, manage, and track your shortened URLs with real-time analytics.
          </motion.p>
        </div>

        <div className="flex items-center space-x-2.5 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-inner h-fit">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`}></span>
          </span>
          <span className={isConnected ? 'text-emerald-400' : 'text-yellow-400'}>
            {isConnected ? 'Live WebSocket Active' : 'Connecting to Live Feed...'}
          </span>
        </div>
      </div>

      {/* Analytics Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <motion.div 
          variants={cardVariants}
          whileHover={shouldReduceMotion ? {} : { y: -4, boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
          className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Activity className="h-10 w-10" /></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Clicks</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.totalClicks}</p>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={shouldReduceMotion ? {} : { y: -4, boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
          className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Clock className="h-10 w-10" /></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Clicks</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.todayClicks}</p>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={shouldReduceMotion ? {} : { y: -4, boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
          className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Layers className="h-10 w-10" /></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active URLs</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.activeUrls}</p>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={shouldReduceMotion ? {} : { y: -4, boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
          className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><ShieldAlert className="h-10 w-10" /></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expired URLs</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{stats.expiredUrls}</p>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Short URL Form */}
        <div className="lg:col-span-1 glass-card bg-white p-6 rounded-2xl border border-slate-200 h-fit space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-yellow-500" />
              <span>Shorten a URL</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1 font-medium">Shorten long links with optional expirations</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destination URL</label>
              <input
                type="url"
                required
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://example.com/very-long-destination-url"
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Custom Alias (Optional)</label>
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="e.g. promo2026"
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date (Optional)</label>
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-sm outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full flex items-center justify-center space-x-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition shadow-md active:scale-[0.98] cursor-pointer"
            >
              <span>{creating ? 'Creating...' : 'Shorten'}</span>
            </button>
          </form>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-medium">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs space-y-2">
              <p className="font-semibold">Short URL Generated:</p>
              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-mono flex-1 select-all break-all text-slate-800">{formSuccess}</span>
                <button
                  onClick={() => copyToClipboard(formSuccess)}
                  className="p-1 hover:bg-slate-100 rounded transition text-yellow-600 cursor-pointer"
                >
                  <Clipboard className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* URLs Management List */}
        <div className="lg:col-span-2 glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-yellow-500" />
              <span>URL Registry ({totalUrls})</span>
            </h3>
            
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search URLs..."
                  className="w-full sm:w-48 bg-white border border-slate-200 focus:border-yellow-500 rounded-xl py-2 pl-9 pr-4 text-slate-900 placeholder-slate-400 text-xs outline-none transition"
                />
              </div>

              <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-450" />
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
                  className="bg-transparent text-slate-600 outline-none cursor-pointer font-medium"
                >
                  <option value="createdAt">Created</option>
                  <option value="longUrl">Destination</option>
                  <option value="shortCode">Short Code</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => { setSortOrder(e.target.value as any); setPage(1); }}
                  className="bg-transparent text-slate-600 outline-none cursor-pointer font-medium"
                >
                  <option value="desc">DESC</option>
                  <option value="asc">ASC</option>
                </select>
              </div>

              <button
                onClick={exportUrlsCSV}
                className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition shadow-sm cursor-pointer"
                title="Export URL Registry to CSV"
              >
                <DownloadCloud className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {urls.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm font-medium">
              No shortened URLs found matching criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {urls.map((url) => {
                const shortLink = `http://localhost:5000/${url.shortCode}`;
                const isEditing = editingId === url.id;

                return (
                  <div key={url.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-200 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 font-mono text-base">{url.shortCode}</span>
                          <button
                            onClick={() => copyToClipboard(shortLink)}
                            className="p-1 text-slate-400 hover:text-slate-900 transition rounded cursor-pointer"
                            title="Copy link"
                          >
                            <Clipboard className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={shortLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-yellow-600 transition"
                            title="Visit destination"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        </div>

                        {/* Inline Destination Edit */}
                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={editLongUrl}
                              onChange={(e) => setEditLongUrl(e.target.value)}
                              className="w-full sm:w-80 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 outline-none"
                            />
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-slate-500 font-medium">Expires:</span>
                              <input
                                type="datetime-local"
                                value={editExpiry}
                                onChange={(e) => setEditExpiry(e.target.value)}
                                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs break-all max-w-sm sm:max-w-md md:max-w-lg mt-1 font-medium">{url.longUrl}</p>
                        )}
                      </div>

                      {/* Controls and Actions */}
                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                        {/* Switch Trigger */}
                        <button
                          onClick={() => handleToggleEnabled(url)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 outline-none cursor-pointer ${
                            url.isEnabled ? 'bg-yellow-400' : 'bg-slate-250 bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                              url.isEnabled ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        <Link
                          to={`/analytics/${url.id}`}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-900 transition text-xs font-semibold shadow-sm"
                        >
                          <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-mono">{url.clickCount}</span>
                        </Link>

                        <button
                          onClick={() => {
                            setQrCodeUrl(shortLink);
                            setQrCodeCode(url.shortCode);
                            setQrCodeOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-yellow-600 transition rounded cursor-pointer"
                          title="Generate QR Code"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>

                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(url.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-250 rounded cursor-pointer"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(url.id);
                              setEditLongUrl(url.longUrl);
                              setEditExpiry(url.expiresAt ? new Date(url.expiresAt).toISOString().slice(0, 16) : '');
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 transition rounded cursor-pointer"
                            title="Edit URL"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(url.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition rounded cursor-pointer"
                          title="Delete URL"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-200 text-2xs text-slate-400 font-mono">
                      <span>Created: {new Date(url.createdAt).toLocaleDateString()}</span>
                      {url.expiresAt && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>Expires: {new Date(url.expiresAt).toLocaleString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs font-semibold">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg disabled:opacity-50 transition cursor-pointer"
              >
                Previous
              </button>
              <span className="text-slate-500 font-medium">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg disabled:opacity-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {qrCodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-slate-250 bg-white shadow-2xl space-y-6 relative">
            <button
              onClick={() => setQrCodeOpen(false)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-800 transition font-bold cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">QR Code Preview</h3>
              <p className="text-slate-500 text-xs font-mono">{qrCodeCode}</p>
            </div>
            
            <div className="flex justify-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeUrl)}`}
                alt="Short link QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => downloadQRCode(qrCodeCode, qrCodeUrl)}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs shadow-sm cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download High-Res</span>
              </button>
              <button
                onClick={() => setQrCodeOpen(false)}
                className="flex-1 bg-white hover:bg-[#F3F4F6] border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#374151] font-semibold py-2.5 rounded-xl transition text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
