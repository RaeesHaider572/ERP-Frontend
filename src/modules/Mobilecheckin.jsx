/**
 * MobileCheckIn.jsx
 * Full-screen mobile check-in / check-out page
 * Employee selects their name → taps Check In or Check Out
 * 
 * Usage: Add route /mobile-checkin in your React router
 * Works on any phone browser — no app install needed
 * 
 * WiFi restriction note:
 * To restrict to office WiFi only, uncomment the IP check section below
 * and add your office WiFi public IP to ALLOWED_IPS
 */

import { useState, useEffect, useCallback } from 'react';

const _RAW = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API  = _RAW.replace(/\/api\/?$/, '');

// ── Helpers ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 56 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const hue = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue},60%,55%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900, fontSize: size * 0.33,
      flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>{initials}</div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', letterSpacing: -2, lineHeight: 1 }}>
        {time.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
      </div>
      <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
        {time.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MobileCheckIn() {
  const [step,        setStep]        = useState('select');    // select | confirm | success | error
  const [employees,   setEmployees]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [deptFilter,  setDeptFilter]  = useState('');
  const [selected,    setSelected]    = useState(null);
  const [punchType,   setPunchType]   = useState(null);  // 0=IN, 1=OUT
  const [punching,    setPunching]    = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search)     params.set('search',     search);
      if (deptFilter) params.set('department', deptFilter);

      const [empRes, deptRes] = await Promise.all([
        fetch(`${API}/api/mobile/employees?${params}`),
        fetch(`${API}/api/mobile/departments`),
      ]);
      const [empData, deptData] = await Promise.all([empRes.json(), deptRes.json()]);

      // Handle WiFi restriction
      if (empData.code === 'WIFI_RESTRICTED') {
        setError({ type: 'wifi', message: empData.error, ip: empData.yourIP });
        setLoading(false);
        return;
      }

      if (empData.success)  setEmployees(empData.data);
      if (deptData.success) setDepartments(deptData.data);
      setError(null);
    } catch (e) {
      setError({ type: 'network', message: 'Cannot reach server. Check your connection.' });
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // Select employee and determine punch type
  const handleSelectEmployee = async (emp) => {
    setSelected(emp);

    // Determine next action based on today's last punch
    try {
      const res  = await fetch(`${API}/api/mobile/status/${emp.EmployeeId}`);
      const data = await res.json();
      if (data.success) {
        // If last punch was CHECK IN → next is CHECK OUT, and vice versa
        const next = data.data.isCheckedIn ? 1 : 0;
        setPunchType(next);
      } else {
        setPunchType(0); // Default to CHECK IN
      }
    } catch {
      setPunchType(0);
    }

    setStep('confirm');
  };

  // Submit punch
  const handlePunch = async () => {
    if (!selected || punchType === null) return;
    setPunching(true);

    try {
      const res  = await fetch(`${API}/api/mobile/punch`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ employeeId: selected.EmployeeId, punchType }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data);
        setStep('success');
        // Auto-reset after 4 seconds
        setTimeout(() => {
          setStep('select');
          setSelected(null);
          setPunchType(null);
          setResult(null);
          fetchEmployees(); // Refresh status
        }, 4000);
      } else {
        setError(data.error || 'Punch failed');
        setStep('error');
      }
    } catch (e) {
      setError('Network error — ' + e.message);
      setStep('error');
    } finally {
      setPunching(false);
    }
  };

  const reset = () => {
    setStep('select');
    setSelected(null);
    setPunchType(null);
    setResult(null);
    setError(null);
  };

  // ── STEP: Select Employee ───────────────────────────────────────────────────
  if (step === 'select') return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: '#f8fafc', minHeight: '100vh',
      maxWidth: 480, margin: '0 auto', padding: '0 0 80px',
    }}>
      <style>{`* { box-sizing: border-box; } input:focus { outline: none; border-color: #6366f1 !important; }`}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '28px 24px 24px', color: '#fff' }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>📱 Mobile Attendance</div>
        <Clock />
      </div>

      {/* Search & Filter */}
      <div style={{ padding: '16px 16px 8px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <input
          placeholder="🔍 Search employee name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            border: '1.5px solid #e2e8f0', fontSize: 15, marginBottom: 8,
          }}
        />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setDeptFilter('')}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
              borderColor: deptFilter === '' ? '#6366f1' : '#e2e8f0',
              background: deptFilter === '' ? '#6366f1' : '#fff',
              color: deptFilter === '' ? '#fff' : '#64748b',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>All</button>
          {departments.map(d => (
            <button key={d} onClick={() => setDeptFilter(d)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
              borderColor: deptFilter === d ? '#6366f1' : '#e2e8f0',
              background: deptFilter === d ? '#6366f1' : '#fff',
              color: deptFilter === d ? '#fff' : '#64748b',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{d}</button>
          ))}
        </div>
      </div>

      {/* Employee list */}
      <div style={{ padding: '8px 12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            Loading employees…
          </div>
        ) : error?.type === 'wifi' ? (
          <div style={{ margin: 24, background: '#fef2f2', borderRadius: 16, padding: 28, textAlign: 'center', border: '1px solid #fca5a5' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📵</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#dc2626', marginBottom: 8 }}>
              Office WiFi Required
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              Mobile check-in is only available when connected to your office WiFi network.
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              Your IP: <strong>{error.ip}</strong>
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Please connect to your office WiFi and try again.
            </div>
            <button onClick={fetchEmployees} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 10,
              background: '#6366f1', color: '#fff', border: 'none',
              fontWeight: 700, cursor: 'pointer',
            }}>Try Again</button>
          </div>
        ) : error?.type === 'network' ? (
          <div style={{ margin: 24, textAlign: 'center', color: '#94a3b8', padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            {error.message}
          </div>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
            No employees found
          </div>
        ) : employees.map(emp => {
          const isIn  = emp.TodayLastPunch === 'CHECK IN';
          const isOut = emp.TodayLastPunch === 'CHECK OUT';
          return (
            <button key={emp.EmployeeId} onClick={() => handleSelectEmployee(emp)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', background: '#fff', borderRadius: 12,
              border: '1.5px solid #f1f5f9', marginBottom: 8, cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,.05)',
              textAlign: 'left',
            }}>
              <Avatar name={emp.Name} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{emp.Name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {emp.Designation || emp.Department || `UID: ${emp.DeviceUid}`}
                </div>
              </div>
              {/* Today status */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {isIn && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', background: '#f0fdf4', padding: '2px 8px', borderRadius: 10 }}>IN ✓</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{emp.TodayCheckIn}</div>
                  </div>
                )}
                {isOut && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', background: '#fff7ed', padding: '2px 8px', borderRadius: 10 }}>OUT ✓</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{emp.TodayCheckOut}</div>
                  </div>
                )}
                {!isIn && !isOut && (
                  <div style={{ fontSize: 11, color: '#cbd5e1' }}>Not punched</div>
                )}
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 18 }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── STEP: Confirm Punch ────────────────────────────────────────────────────
  if (step === 'confirm') return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: '#f8fafc', minHeight: '100vh',
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Back */}
      <div style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <button onClick={reset} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, fontSize: 15, cursor: 'pointer', padding: 0 }}>
          ← Back
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Avatar name={selected?.Name} size={80} />

        <div style={{ fontWeight: 900, fontSize: 26, color: '#0f172a', marginTop: 20, textAlign: 'center' }}>
          {selected?.Name}
        </div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>
          {selected?.Designation || selected?.Department || `Employee #${selected?.EmployeeId}`}
        </div>

        {/* Today summary */}
        {(selected?.TodayCheckIn || selected?.TodayCheckOut) && (
          <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '12px 20px', marginBottom: 24, textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Today</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Check In</div>
                <div style={{ fontWeight: 700, color: '#22c55e' }}>{selected?.TodayCheckIn || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Check Out</div>
                <div style={{ fontWeight: 700, color: '#f97316' }}>{selected?.TodayCheckOut || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Check In / Check Out */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, width: '100%' }}>
          <button onClick={() => setPunchType(0)} style={{
            flex: 1, padding: '14px', borderRadius: 12, border: '2px solid',
            borderColor: punchType === 0 ? '#22c55e' : '#e2e8f0',
            background: punchType === 0 ? '#f0fdf4' : '#fff',
            color: punchType === 0 ? '#15803d' : '#94a3b8',
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            🔵 Check In
          </button>
          <button onClick={() => setPunchType(1)} style={{
            flex: 1, padding: '14px', borderRadius: 12, border: '2px solid',
            borderColor: punchType === 1 ? '#f97316' : '#e2e8f0',
            background: punchType === 1 ? '#fff7ed' : '#fff',
            color: punchType === 1 ? '#c2410c' : '#94a3b8',
            fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>
            🟢 Check Out
          </button>
        </div>

        {/* Big punch button */}
        <button
          onClick={handlePunch}
          disabled={punching || punchType === null}
          style={{
            width: '100%', padding: '20px',
            borderRadius: 16, border: 'none',
            background: punching ? '#a5b4fc'
              : punchType === 0 ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : punchType === 1 ? 'linear-gradient(135deg, #f97316, #ea580c)'
              : '#e2e8f0',
            color: '#fff', fontWeight: 900, fontSize: 20,
            cursor: punching ? 'not-allowed' : 'pointer',
            boxShadow: punchType !== null && !punching ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
            transition: 'all 0.2s',
          }}>
          {punching ? '⏳ Recording…'
            : punchType === 0 ? '🔵 Confirm Check In'
            : punchType === 1 ? '🟢 Confirm Check Out'
            : 'Select Check In or Out'}
        </button>

        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          Current time: {new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>
    </div>
  );

  // ── STEP: Success ─────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: result?.data?.punchType === 0
        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
        : 'linear-gradient(135deg, #f97316, #ea580c)',
      minHeight: '100vh', maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 32, color: '#fff',
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>
        {result?.data?.punchType === 0 ? '✅' : '👋'}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>
        {result?.data?.punchType === 0 ? 'Checked In!' : 'Checked Out!'}
      </div>
      <Avatar name={result?.data?.employeeName} size={64} />
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>
        {result?.data?.employeeName}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, marginTop: 8, opacity: 0.9 }}>
        {result?.data?.punchTimeFormatted}
      </div>
      <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
        {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      {result?.warning && (
        <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '10px 16px', fontSize: 13, textAlign: 'center' }}>
          ⚠️ {result.warning}
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 13, opacity: 0.7 }}>
        Returning to home in a few seconds…
      </div>

      <button onClick={reset} style={{
        marginTop: 20, padding: '12px 28px', borderRadius: 12,
        background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
        color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
      }}>
        Done
      </button>
    </div>
  );

  // ── STEP: Error ───────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: '#fef2f2', minHeight: '100vh',
      maxWidth: 480, margin: '0 auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 32,
    }}>
      <div style={{ fontSize: 64 }}>❌</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginTop: 16, marginBottom: 8 }}>
        Punch Failed
      </div>
      <div style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32 }}>
        {error}
      </div>
      <button onClick={reset} style={{
        padding: '14px 32px', borderRadius: 12, border: 'none',
        background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
      }}>
        Try Again
      </button>
    </div>
  );

  return null;
}