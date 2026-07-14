import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { LineChart, DoughnutChart, BarChart } from '../charts/AnalyticsCharts';
import { ArrowLeft, Activity, Clock, Globe, DownloadCloud } from 'lucide-react';

interface ClickEvent {
  id: string;
  timestamp: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  referrer: string | null;
}

interface AnalyticsData {
  totalClicks: number;
  todayClicks: number;
  devices: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  countries: { name: string; value: number }[];
  referrers: { name: string; value: number }[];
  clicksOverTime: { date: string; count: number }[];
  recentClicks: ClickEvent[];
}

export function UrlAnalytics() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [data, setData] = useState<AnalyticsData | null>(null);

  const exportLogsCSV = () => {
    if (!data || data.recentClicks.length === 0) return;
    const csvContent = [
      ['Timestamp', 'IP Address', 'Location', 'Device', 'OS', 'Browser', 'Referrer'].join(','),
      ...data.recentClicks.map(click => [
        `"${new Date(click.timestamp).toLocaleString()}"`,
        `"${click.ip || '127.0.0.1'}"`,
        `"${click.city ? `${click.city}, ` : ''}${click.country || 'Unknown'}"`,
        `"${click.device || 'Desktop'}"`,
        `"${click.os || 'Unknown'}"`,
        `"${click.browser || 'Unknown'}"`,
        `"${(click.referrer || 'Direct').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', `analytics-logs-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch URL Analytics
  const fetchAnalytics = useCallback(async () => {
    if (!id) return;
    try {
      const stats = await api.getUrlAnalytics(id);
      setData(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Live real-time WebSocket updater
  const handleWebSocketMessage = useCallback((event: string, payload: any) => {
    if (event === 'analytics_update' && payload.shortUrlId === id) {
      console.log('⚡ Live WS Analytics Update received:', payload);
      setData(payload.stats);
    }
  }, [id]);

  const isConnected = useWebSocket(handleWebSocketMessage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-slate-550 font-semibold font-medium">
        Analyzing link records...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-red-600 font-semibold">{error || 'Failed to load analytics'}</div>
        <Link to="/" className="inline-flex items-center text-yellow-600 hover:underline gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Back to Dashboard and Connection Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 font-semibold gap-2 group transition">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-2.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-yellow-500 animate-pulse'}`}></span>
          <span className={isConnected ? 'text-emerald-600' : 'text-yellow-600'}>
            {isConnected ? 'Live WebSocket Active' : 'Connecting WebSocket...'}
          </span>
        </div>
      </div>

      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Activity className="h-10 w-10" /></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Link Clicks</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{data.totalClicks}</p>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
        </div>

        <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Clock className="h-10 w-10" /></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clicks Today</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{data.todayClicks}</p>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
        </div>

        <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 text-yellow-400/25"><Globe className="h-10 w-10" /></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Reach</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{data.countries.length} Countries</p>
          <div className="absolute left-0 bottom-0 w-full h-1 bg-yellow-400"></div>
        </div>
      </div>

      {/* Clicks Over Time (Line Chart) */}
      <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <h4 className="text-base font-bold text-slate-950 uppercase tracking-wider">Clicks Over Time (Last 30 Days)</h4>
        {data.clicksOverTime.length === 0 ? (
          <p className="text-slate-400 text-xs py-8 text-center font-medium">No click event history registered.</p>
        ) : (
          <div className="w-full h-80">
            <LineChart data={data.clicksOverTime} />
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-base font-bold text-slate-950 uppercase tracking-wider">Device Distribution</h4>
          {data.devices.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center font-medium">No data available.</p>
          ) : (
            <DoughnutChart data={data.devices} title="Devices" />
          )}
        </div>

        {/* Browser Distribution */}
        <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-base font-bold text-slate-950 uppercase tracking-wider">Browser Distribution</h4>
          {data.browsers.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center font-medium">No data available.</p>
          ) : (
            <DoughnutChart data={data.browsers} title="Browsers" />
          )}
        </div>

        {/* Countries */}
        <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-base font-bold text-slate-950 uppercase tracking-wider">Top Countries</h4>
          {data.countries.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center font-medium">No data available.</p>
          ) : (
            <div className="h-64">
              <BarChart data={data.countries} label="Country Clicks" />
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h4 className="text-base font-bold text-slate-950 uppercase tracking-wider">Top Referrers</h4>
          {data.referrers.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center font-medium">No data available.</p>
          ) : (
            <div className="h-64">
              <BarChart data={data.referrers} label="Referrers" />
            </div>
          )}
        </div>
      </div>

      {/* Recent Clicks Table */}
      <div className="glass-card bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-base font-bold text-slate-950 uppercase tracking-wider">Recent Redirect Logs (Last 10 Clicks)</h4>
          {data.recentClicks.length > 0 && (
            <button
              onClick={exportLogsCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-650 hover:text-slate-900 transition shadow-sm cursor-pointer"
              title="Export Redirect Logs to CSV"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
        
        {data.recentClicks.length === 0 ? (
          <p className="text-slate-400 text-xs py-8 text-center font-medium">No redirect events logged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">User Agent / OS / Browser</th>
                  <th className="py-3 px-4">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {data.recentClicks.map((click, idx) => (
                  <tr key={click.id} className={`transition ${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-100/50`}>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{new Date(click.timestamp).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-medium">{click.ip || '127.0.0.1'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{click.city ? `${click.city}, ` : ''}{click.country || 'Unknown'}</td>
                    <td className="py-3.5 px-4 text-slate-600 break-words max-w-[280px]">
                      <span className="text-yellow-600 font-bold">{click.device || 'Desktop'}</span> • {click.os || 'Unknown OS'} • <span className="text-slate-800 font-semibold">{click.browser || 'Unknown'}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-600" title={click.referrer || 'Direct'}>
                      {click.referrer || 'Direct'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
