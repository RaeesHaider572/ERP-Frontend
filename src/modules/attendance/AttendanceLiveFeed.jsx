import { useState, useEffect, useCallback, useRef } from 'react';

const _RAW_API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API = _RAW_API.replace(/\/api\/?$/, '');

// ── Small helpers ─────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
}

const VERIFY_ICONS = { Password: '🔑', Fingerprint: '👆', 'RFID Card': '💳', Face: '😊' };
const PUNCH_COLORS = {
  'CHECK IN':  { bg: '#e8faf0', border: '#22c55e', text: '#15803d', dot: '#22c55e' },
  'CHECK OUT': { bg: '#fff7ed', border: '#f97316', text: '#c2410c', dot: '#f97316' },
  'OTHER':     { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', dot: '#94a3b8' },
};

const STATUS_COLORS = {
  Online:           '#22c55e',
  Idle:             '#f59e0b',
  Offline:          '#ef4444',
  'Never Connected':'#94a3b8',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = '#6366f1' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,.08)', flex: 1, minWidth: 140,
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function DeviceBadge({ device }) {
  const color = STATUS_COLORS[device.LiveStatus] || '#94a3b8';
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '14px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,.08)', display: 'flex',
      alignItems: 'center', gap: 12, minWidth: 220,
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0,
        boxShadow: device.LiveStatus === 'Online' ? `0 0 0 4px ${color}30` : 'none',
        animation: device.LiveStatus === 'Online' ? 'pulse 2s infinite' : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {device.DeviceName}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          {device.Location || 'No location'} · {device.TodayLogs ?? 0} today
        </div>
        <div style={{ fontSize: 11, color }}>
          {device.LiveStatus}
          {device.MinutesSinceLastSeen != null && device.LiveStatus !== 'Online'
            ? ` · ${device.MinutesSinceLastSeen}m ago` : ''}
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
        👥 {device.TotalEmployees ?? 0}
      </div>
    </div>
  );
}

function PunchRow({ log, isNew }) {
  const colors = PUNCH_COLORS[log.PunchTypeLabel] || PUNCH_COLORS.OTHER;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
      background: isNew ? colors.bg : '#fff',
      borderLeft: `4px solid ${isNew ? colors.border : '#e2e8f0'}`,
      borderRadius: 10, marginBottom: 6,
      transition: 'background 0.6s ease, border-color 0.6s ease',
      boxShadow: isNew ? `0 2px 8px ${colors.border}25` : '0 1px 2px rgba(0,0,0,.04)',
    }}>
      {/* Dot */}
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />

      {/* Name + device */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {log.EmployeeName}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          📍 {log.DeviceName}{log.DeviceLocation ? ` · ${log.DeviceLocation}` : ''}
        </div>
      </div>

      {/* Punch type badge */}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
        background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
        whiteSpace: 'nowrap',
      }}>
        {log.PunchTypeLabel}
      </span>

      {/* Verify method */}
      <span style={{ fontSize: 16, flexShrink: 0, title: log.VerifyMethod }}>
        {VERIFY_ICONS[log.VerifyMethod] || '❓'}
      </span>

      {/* Time */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
          {log.PunchTimeFormatted || formatTime(log.PunchTime)}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          {timeAgo(log.PunchTime)}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AttendanceLiveFeed() {
  const [logs,       setLogs]       = useState([]);
  const [devices,    setDevices]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [summary,    setSummary]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newLogIds,  setNewLogIds]  = useState(new Set());
  const [filter,     setFilter]     = useState({ device: 'All', type: 'All', search: '' });
  const [autoRefresh,setAutoRefresh]= useState(true);
  const prevLogIds = useRef(new Set());
  const intervalRef = useRef(null);

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [logsRes, devicesRes, healthRes, summaryRes] = await Promise.all([
        fetch(`${API}/api/adms/attendance/recent?limit=100&minutes=480`),
        fetch(`${API}/api/adms/devices`),
        fetch(`${API}/api/adms/health`),
        fetch(`${API}/api/adms/attendance/today-summary`),
      ]);

      const [logsData, devicesData, healthData, summaryData] = await Promise.all([
        logsRes.json(), devicesRes.json(), healthRes.json(), summaryRes.json(),
      ]);

      if (logsData.success) {
        const newIds = new Set(logsData.data.map(l => l.LogId));
        const fresh  = new Set([...newIds].filter(id => !prevLogIds.current.has(id)));
        prevLogIds.current = newIds;

        setLogs(logsData.data);
        if (fresh.size > 0) setNewLogIds(fresh);
        // Clear highlight after 4 seconds
        if (fresh.size > 0) setTimeout(() => setNewLogIds(new Set()), 4000);
      }

      if (devicesData.success)  setDevices(devicesData.data);
      if (healthData.success)   setStats(healthData.stats);
      if (summaryData.success)  setSummary(summaryData.data);

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Cannot reach server — ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-refresh every 10 seconds ──────────────────────────────────────────
  useEffect(() => {
    fetchAll();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAll, 10000);
    }
    return () => clearInterval(intervalRef.current);
  }, [fetchAll, autoRefresh]);

  // ── Filtered logs ───────────────────────────────────────────────────────────
  const filteredLogs = logs.filter(log => {
    if (filter.device !== 'All' && log.DeviceName !== filter.device) return false;
    if (filter.type   !== 'All' && log.PunchTypeLabel !== filter.type) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!log.EmployeeName?.toLowerCase().includes(q) &&
          !log.DeviceName?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const deviceNames = ['All', ...new Set(logs.map(l => l.DeviceName))];
  const onlineCount = devices.filter(d => d.LiveStatus === 'Online').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <div style={{ width: 24, height: 24, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#64748b', fontSize: 16 }}>Loading attendance data…</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#f8fafc', minHeight: '100vh', padding: 24 }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
            🕐 Attendance Live Feed
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            ZKTeco uFace800 · Multi-location · ADMS Push
            {lastUpdate && ` · Updated ${timeAgo(lastUpdate)}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setAutoRefresh(p => !p)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1.5px solid',
              borderColor: autoRefresh ? '#22c55e' : '#e2e8f0',
              background: autoRefresh ? '#e8faf0' : '#fff',
              color: autoRefresh ? '#15803d' : '#475569',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
            {autoRefresh ? '⏸ Auto-Refresh ON' : '▶ Auto-Refresh OFF'}
          </button>
          <button
            onClick={fetchAll}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 18px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard icon="📋" label="Today's Punches"  value={stats?.TodayRecords}   color="#6366f1" />
        <StatCard icon="👥" label="Total Employees"  value={stats?.TotalEmployees} color="#0ea5e9" />
        <StatCard icon="📱" label="Total Devices"    value={stats?.TotalDevices}   color="#8b5cf6" />
        <StatCard icon="🟢" label="Online Now"       value={onlineCount}           color="#22c55e" />
        <StatCard icon="📂" label="All-time Records" value={stats?.TotalRecords}   color="#f59e0b" />
      </div>

      {/* ── Devices row ──────────────────────────────────────────────────────── */}
      {devices.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>
            📡 Connected Devices
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {devices.map(d => <DeviceBadge key={d.DeviceName} device={d} />)}
          </div>
        </div>
      )}

      {/* ── Today summary by device ───────────────────────────────────────────── */}
      {summary.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>
            📊 Today's Summary by Location
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {summary.map(s => (
              <div key={s.DeviceName} style={{
                background: '#fff', borderRadius: 12, padding: '14px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,.08)', minWidth: 200,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 8 }}>
                  {s.DeviceName}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{s.Present}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Present</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{s.HalfDay}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Half-day</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{s.Short}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Short</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{s.Total}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Live feed ────────────────────────────────────────────────────────── */}
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: 0, flex: '0 0 auto' }}>
            🔴 Live Feed
          </h2>
          <input
            placeholder="Search name or device…"
            value={filter.search}
            onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', width: 220 }}
          />
          <select
            value={filter.device}
            onChange={e => setFilter(p => ({ ...p, device: e.target.value }))}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, cursor: 'pointer' }}>
            {deviceNames.map(d => <option key={d} value={d}>{d === 'All' ? '📱 All Devices' : d}</option>)}
          </select>
          <select
            value={filter.type}
            onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, cursor: 'pointer' }}>
            <option value="All">All Types</option>
            <option value="CHECK IN">✅ Check In</option>
            <option value="CHECK OUT">🚪 Check Out</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
            {filteredLogs.length} records
          </span>
        </div>

        {/* Log rows */}
        <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 4 }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <div>No attendance records in last 8 hours</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Records appear here automatically when devices push data</div>
            </div>
          ) : (
            filteredLogs.map(log => (
              <PunchRow
                key={log.LogId}
                log={log}
                isNew={newLogIds.has(log.LogId)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Footer hint ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24, padding: '14px 18px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 13, color: '#1d4ed8' }}>
        💡 <strong>Device Setup:</strong> On each ZKTeco uFace800, set <em>Server Mode = ADMS</em>, 
        Server Address = <strong>{process.env.REACT_APP_PUBLIC_IP || 'your-server.com'}</strong>, 
        Port = <strong>{process.env.REACT_APP_PORT || '5000'}</strong>. 
        Devices at any location will automatically push attendance over the internet.
      </div>
    </div>
  );
}