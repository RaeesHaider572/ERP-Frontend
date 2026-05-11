import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box, Button, Container, Paper, Typography, TextField, IconButton,
  Tooltip, Chip, Alert, CircularProgress, MenuItem, Grid, useTheme,
  alpha, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TableSortLabel,
  InputAdornment, Divider, Card, CardContent, Tabs, Tab,
  Avatar, Badge, LinearProgress, Select, FormControl, InputLabel,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon,
  Person as PersonIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  CalendarMonth as CalendarIcon,
  FilterList as FilterIcon,
  Sync as SyncIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  WorkHistory as WorkHistoryIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  getAttendance,
  getAttendanceStats,
  getEmployees,
  getRawLogs,
  syncAttendance,
} from "../../services/attendanceService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0];

// Improved time formatter with better error handling
const fmtTime = (val) => {
  if (!val) return "—";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("en-PK", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  } catch {
    return "—";
  }
};

const fmtDate = (val) => {
  if (!val) return "—";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-PK", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  } catch { 
    return "—"; 
  }
};

const fmtMinutes = (mins) => {
  if (mins == null || mins === 0) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const statusColor = (status) => {
  switch (status) {
    case "Present":  return "success";
    case "Half-day": return "warning";
    case "Short":    return "error";
    default:         return "default";
  }
};

const punchTypeLabel = (type) => {
  if (type === 0) return { label: "Check In",  color: "success", icon: <LoginIcon  sx={{ fontSize: 13 }} /> };
  if (type === 1) return { label: "Check Out", color: "error",   icon: <LogoutIcon sx={{ fontSize: 13 }} /> };
  return { label: "Other", color: "default", icon: null };
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, sub, loading }) {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{
      borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      background: `linear-gradient(135deg, ${alpha(color || theme.palette.primary.main, 0.08)} 0%, ${alpha(color || theme.palette.primary.main, 0.03)} 100%)`,
      height: "100%",
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
      '&:hover': {
        transform: "translateY(-4px)",
        boxShadow: theme.shadows[4],
      }
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>{label}</Typography>
            {loading
              ? <CircularProgress size={20} />
              : <Typography variant="h4" sx={{ fontWeight: 700, color: color || "text.primary" }}>{value ?? "—"}</Typography>
            }
            {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>{sub}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: alpha(color || theme.palette.primary.main, 0.12), width: 44, height: 44 }}>
            {React.cloneElement(icon, { sx: { color: color || theme.palette.primary.main, fontSize: 22 } })}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Attendance() {
  const theme = useTheme();

  // ── State ──
  const [tab, setTab]               = useState(0); // 0=Daily Summary, 1=Raw Logs
  const [attendance, setAttendance] = useState([]);
  const [rawLogs, setRawLogs]       = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [error, setError]           = useState(null);
  const [logsError, setLogsError]   = useState(null);

  // ── Filters ──
  const [date, setDate]             = useState(todayStr());
  const [empFilter, setEmpFilter]   = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [searchTerm, setSearch]     = useState("");

  // ── Table ──
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRpp]       = useState(10);
  const [sortConfig, setSort]       = useState({ key: "Name", direction: "asc" });

  const [logsPage, setLogsPage]     = useState(0);
  const [logsRpp, setLogsRpp]       = useState(25);

  const [snackbar, setSnackbar]     = useState({ open: false, message: "", severity: "success" });

  const showMsg = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  // ─── Fetch Functions ────────────────────────────────────────────────────────

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [attRes, statsRes] = await Promise.all([
        getAttendance({ date }),
        getAttendanceStats({ date }),
      ]);
      const attData = Array.isArray(attRes.data?.data) ? attRes.data.data
        : Array.isArray(attRes.data) ? attRes.data : [];
      setAttendance(attData);
      setStats(statsRes.data?.data || statsRes.data || null);
    } catch (err) {
      const msg = err.response?.data?.message || "Error fetching attendance.";
      setError(msg);
      showMsg(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const fetchRawLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      const params = { date };
      if (empFilter) params.employeeId = empFilter;
      const res = await getRawLogs(params);
      const data = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
      setRawLogs(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Error fetching logs.";
      setLogsError(msg);
      showMsg(msg, "error");
    } finally {
      setLogsLoading(false);
    }
  }, [date, empFilter]);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      const res = await getEmployees();
      const data = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
      setEmployees(data);
    } catch (err) { 
      console.error("Error fetching employees:", err);
      showMsg("Error fetching employees list", "error");
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => { 
    fetchAttendance(); 
  }, [fetchAttendance]);
  
  useEffect(() => { 
    if (tab === 1) fetchRawLogs(); 
  }, [tab, fetchRawLogs]);
  
  useEffect(() => { 
    fetchEmployees(); 
  }, [fetchEmployees]);

  // ─── Sync Handler ───────────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncAttendance();
      const message = res.data?.message || `Sync complete — ${res.data?.inserted ?? 0} new records`;
      showMsg(message, "success");
      await fetchAttendance();
      if (tab === 1) await fetchRawLogs();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Sync failed";
      showMsg(errorMsg, "error");
    } finally {
      setSyncing(false);
    }
  };

  // ─── Filter & Sort (Memoized for performance) ───────────────────────────────

  const filtered = useMemo(() => {
    return attendance.filter((row) => {
      if (statusFilter && row.Status !== statusFilter) return false;
      if (empFilter && String(row.EmployeeId) !== String(empFilter)) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          (row.Name || "").toLowerCase().includes(q) ||
          String(row.EmployeeId).includes(q)
        );
      }
      return true;
    });
  }, [attendance, statusFilter, empFilter, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortConfig.key] ?? "";
      let bv = b[sortConfig.key] ?? "";
      
      // Handle numeric sorting for EmployeeId and WorkMinutes
      if (sortConfig.key === "EmployeeId" || sortConfig.key === "WorkMinutes") {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      }
      
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  const paginated = useMemo(() => {
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const paginatedLogs = useMemo(() => {
    return rawLogs.slice(logsPage * logsRpp, logsPage * logsRpp + logsRpp);
  }, [rawLogs, logsPage, logsRpp]);

  const handleSort = (key) => setSort((p) => ({ 
    key, 
    direction: p.key === key && p.direction === "asc" ? "desc" : "asc" 
  }));

  // ─── Filter Reset Handlers ──────────────────────────────────────────────────

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setPage(0);
    setLogsPage(0);
  };

  const handleEmployeeFilterChange = (value) => {
    setEmpFilter(value);
    setPage(0);
    setLogsPage(0);
  };

  const handleStatusFilterChange = (value) => {
    setStatus(value);
    setPage(0);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleRefresh = () => {
    fetchAttendance();
    if (tab === 1) fetchRawLogs();
    showMsg("Data refreshed", "info");
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open} 
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))} 
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Header ── */}
      <Paper elevation={0} sx={{
        p: { xs: 2, sm: 3 }, 
        mb: 3, 
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), width: 48, height: 48 }}>
                <AccessTimeIcon sx={{ color: theme.palette.primary.main, fontSize: 26 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Attendance Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  {fmtDate(date)} · {attendance.length} employee records
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", gap: 1, justifyContent: { md: "flex-end" }, flexWrap: "wrap" }}>
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={handleRefresh}
                sx={{ border: `1px solid ${theme.palette.divider}` }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained" 
              startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              onClick={handleSync} 
              disabled={syncing}
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, 
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                '&:hover': {
                  boxShadow: "0 6px 16px rgba(99,102,241,0.4)",
                }
              }}
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Stats Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard 
            icon={<GroupsIcon />}         
            label="Total Employees"    
            value={stats?.total}   
            color={theme.palette.primary.main}  
            loading={loading} 
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            icon={<CheckCircleIcon />}    
            label="Present"  
            value={stats?.present} 
            color={theme.palette.success.main}  
            loading={loading} 
            sub="Full day (≥8h)" 
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            icon={<HourglassIcon />}      
            label="Half-Day" 
            value={stats?.halfDay} 
            color={theme.palette.warning.main}  
            loading={loading} 
            sub="4–8 hours" 
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard 
            icon={<WarningIcon />}        
            label="Short"    
            value={stats?.shortDay}
            color={theme.palette.error.main}    
            loading={loading} 
            sub="Under 4h" 
          />
        </Grid>
      </Grid>

      {/* ── Filters Row ── */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Date picker */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth 
              type="date" 
              size="small" 
              label="Select Date"
              value={date} 
              onChange={(e) => handleDateChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ 
                startAdornment: <InputAdornment position="start">
                  <CalendarIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                </InputAdornment>
              }}
            />
          </Grid>

          {/* Employee filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Employee</InputLabel>
              <Select
                value={empFilter} 
                label="Filter by Employee"
                onChange={(e) => handleEmployeeFilterChange(e.target.value)}
                startAdornment={<InputAdornment position="start">
                  <PersonIcon sx={{ color: "text.secondary", fontSize: 18, ml: 1 }} />
                </InputAdornment>}
              >
                <MenuItem value="">
                  <em>All Employees</em>
                </MenuItem>
                {employees.map((e) => (
                  <MenuItem key={e.EmployeeId} value={String(e.EmployeeId)}>
                    {e.Name} 
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      #{e.EmployeeId}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select 
                value={statusFilter} 
                label="Status" 
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <MenuItem value=""><em>All Status</em></MenuItem>
                <MenuItem value="Present">Present</MenuItem>
                <MenuItem value="Half-day">Half-Day</MenuItem>
                <MenuItem value="Short">Short</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Search */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth 
              size="small" 
              placeholder="Search by name or employee ID..."
              value={searchTerm} 
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{ 
                startAdornment: <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary" }} />
                </InputAdornment>
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Tabs ── */}
      <Paper elevation={0} sx={{ 
        borderRadius: 2, 
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, 
        overflow: "hidden" 
      }}>
        <Tabs 
          value={tab} 
          onChange={(_, v) => {
            setTab(v);
            setLogsPage(0);
          }} 
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`, 
            px: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.6)
          }}
        >
          <Tab 
            label="Daily Summary" 
            icon={<WorkHistoryIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
          />
          <Tab 
            label="Raw Punch Logs" 
            icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
          />
        </Tabs>

        {/* ── Tab 0: Daily Summary ── */}
        {tab === 0 && (
          <>
            {loading && <LinearProgress />}
            <TableContainer sx={{ maxHeight: "65vh" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      { id: "EmployeeId", label: "ID",        minWidth: 65 },
                      { id: "Name",       label: "Employee",  minWidth: 160 },
                      { id: "CheckIn",    label: "Check In",  minWidth: 110 },
                      { id: "CheckOut",   label: "Check Out", minWidth: 110 },
                      { id: "WorkMinutes",label: "Hours",     minWidth: 90 },
                      { id: "Status",     label: "Status",    minWidth: 100 },
                    ].map((col) => (
                      <TableCell 
                        key={col.id} 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: "0.8125rem", 
                          minWidth: col.minWidth, 
                          backgroundColor: theme.palette.background.paper 
                        }}
                      >
                        <TableSortLabel
                          active={sortConfig.key === col.id}
                          direction={sortConfig.key === col.id ? sortConfig.direction : "asc"}
                          onClick={() => handleSort(col.id)}
                        >
                          {col.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!loading && paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <AccessTimeIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.3, display: "block", mx: "auto", mb: 1 }} />
                        <Typography color="text.secondary">No attendance records found for this date</Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={handleSync}
                          sx={{ mt: 2 }}
                        >
                          Sync Attendance Data
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((row) => (
                      <TableRow 
                        key={row.EmployeeId} 
                        hover 
                        sx={{ 
                          "&:nth-of-type(even)": { 
                            backgroundColor: alpha(theme.palette.action.hover, 0.02) 
                          } 
                        }}
                      >
                        {/* ID */}
                        <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                          {row.EmployeeId}
                        </TableCell>

                        {/* Employee Name */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ 
                              width: 28, 
                              height: 28, 
                              fontSize: "0.75rem", 
                              bgcolor: alpha(theme.palette.primary.main, 0.15), 
                              color: theme.palette.primary.main 
                            }}>
                              {(row.Name || "?")[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {row.Name}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Check In */}
                        <TableCell>
                          {row.CheckIn ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <LoginIcon sx={{ fontSize: 14, color: "success.main" }} />
                              <Typography variant="body2" sx={{ fontWeight: 500, color: "success.main" }}>
                                {fmtTime(row.CheckIn)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.disabled">—</Typography>
                          )}
                        </TableCell>

                        {/* Check Out */}
                        <TableCell>
                          {row.CheckOut ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <LogoutIcon sx={{ fontSize: 14, color: "error.main" }} />
                              <Typography variant="body2" sx={{ fontWeight: 500, color: "error.main" }}>
                                {fmtTime(row.CheckOut)}
                              </Typography>
                            </Box>
                          ) : (
                            <Chip 
                              label="Still Inside" 
                              size="small" 
                              color="info" 
                              variant="outlined" 
                              sx={{ fontSize: "0.7rem" }} 
                            />
                          )}
                        </TableCell>

                        {/* Hours */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <TrendingUpIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                            <Typography variant="body2">
                              {fmtMinutes(row.WorkMinutes)}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={row.Status || "—"}
                            size="small"
                            color={statusColor(row.Status)}
                            variant="outlined"
                            sx={{ fontSize: "0.72rem", fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" 
              count={sorted.length} 
              page={page}
              onPageChange={(_, p) => setPage(p)} 
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { 
                setRpp(parseInt(e.target.value, 10)); 
                setPage(0); 
              }}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Records per page"
            />
          </>
        )}

        {/* ── Tab 1: Raw Punch Logs ── */}
        {tab === 1 && (
          <>
            {logsLoading && <LinearProgress />}
            {logsError && (
              <Alert severity="error" sx={{ m: 2 }} onClose={() => setLogsError(null)}>
                {logsError}
              </Alert>
            )}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.info.main, 0.03) }}>
              <Typography variant="body2" color="text.secondary">
                <strong>📊 Information:</strong> Every individual punch from the biometric device.
                Multiple Check In/Out on the same day all appear here.
                Daily Summary uses the <strong>earliest Check In</strong> and <strong>latest Check Out</strong>.
              </Typography>
            </Box>
            <TableContainer sx={{ maxHeight: "55vh" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["Employee", "Punch Time (PKT)", "Type", "Verify Method", "Sync Source"].map((label) => (
                      <TableCell 
                        key={label} 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: "0.8125rem", 
                          backgroundColor: theme.palette.background.paper 
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!logsLoading && paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <AccessTimeIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.3, display: "block", mx: "auto", mb: 1 }} />
                        <Typography color="text.secondary">No punch logs found for the selected criteria</Typography>
                        {empFilter && (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleEmployeeFilterChange("")}
                            sx={{ mt: 2 }}
                          >
                            Clear Employee Filter
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log, idx) => {
                      const pt = punchTypeLabel(log.PunchType);
                      return (
                        <TableRow key={log.LogId || idx} hover>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ 
                                width: 26, 
                                height: 26, 
                                fontSize: "0.7rem", 
                                bgcolor: alpha(theme.palette.secondary.main, 0.12), 
                                color: theme.palette.secondary.main 
                              }}>
                                {(log.Name || "?")[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                                  {log.Name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {log.EmployeeId}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                              {log.PunchTimePKT
                                ? new Date(log.PunchTimePKT).toLocaleString("en-PK", { 
                                    dateStyle: "medium", 
                                    timeStyle: "medium" 
                                  })
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={pt.label}
                              size="small"
                              color={pt.color}
                              icon={pt.icon}
                              variant="outlined"
                              sx={{ fontSize: "0.72rem", fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {log.VerifyType || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.IsAutoSynced ? "🤖 Auto Sync" : "👤 Manual"} 
                              size="small" 
                              variant="outlined"
                              color={log.IsAutoSynced ? "default" : "primary"} 
                              sx={{ fontSize: "0.7rem" }} 
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" 
              count={rawLogs.length} 
              page={logsPage}
              onPageChange={(_, p) => setLogsPage(p)} 
              rowsPerPage={logsRpp}
              onRowsPerPageChange={(e) => { 
                setLogsRpp(parseInt(e.target.value, 10)); 
                setLogsPage(0); 
              }}
              rowsPerPageOptions={[10, 25, 50, 100, 200]}
              labelRowsPerPage="Logs per page"
            />
          </>
        )}
      </Paper>

      {/* Footer Note */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleString()} | Data syncs automatically every hour
        </Typography>
      </Box>
    </Container>
  );
}