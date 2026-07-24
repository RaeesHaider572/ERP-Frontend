// components/attendance/AttendanceLogs.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Pagination,
    Divider,
    Stack,
    Avatar,
    LinearProgress,
    Fade,
    Collapse,
    useTheme
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Today as TodayIcon,
    Person as PersonIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Group as GroupIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    AccessTime as AccessTimeIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
    getAttendanceLogs,
    getAttendanceSummary,
    getTodayAttendance,
    exportAttendanceReport
} from '../../services/attendanceLogsService';

import { formatDateTime, formatDate, formatTime } from '../../utils/dateTimeUtils';

const AttendanceLogs = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [totalLogs, setTotalLogs] = useState(0);
    const [expandedRow, setExpandedRow] = useState(null);
    const [exporting, setExporting] = useState(false);

    // User roles
    const isEmployee = user?.Role?.toLowerCase() === 'employee';
    const isCustodian = user?.Role?.toLowerCase() === 'custodian';
    const isHR = user?.Role?.toLowerCase() === 'hr';

    // Filters state
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        punchType: '',
        page: 1,
        limit: 50
    });

    // Fetch attendance logs
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAttendanceLogs(filters);
            // if (response.success)
                if (response.status === "success") {
                setLogs(response.data || []);
                setTotalLogs(response.data?.length || 0);
                if (response.todayAttendance) {
                    setTodayAttendance(response.todayAttendance);
                }
            } else {
                setError(response.message || 'Failed to fetch attendance logs');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch attendance logs');
            console.error('❌ Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Fetch summary
    const fetchSummary = useCallback(async () => {
        try {
            const response = await getAttendanceSummary(
                new Date().toISOString().split('T')[0]
            );
            // if (response.success)
            if (response.status === "success") {
                setSummary(response.data);
                if (response.todayAttendance) {
                    setTodayAttendance(response.todayAttendance);
                }
            }
        } catch (err) {
            console.error('❌ Error fetching summary:', err);
        }
    }, []);

    // Fetch today's attendance (for employees)
    const fetchTodayAttendance = useCallback(async () => {
        if (!isEmployee) return;
        try {
            const response = await getTodayAttendance();
            // if (response.success)
                if (response.status === "success") {
                setTodayAttendance(response.data);
            }
        } catch (err) {
            console.error('❌ Error fetching today attendance:', err);
        }
    }, [isEmployee]);

    // Initial fetch
    useEffect(() => {
        fetchLogs();
        fetchSummary();
        fetchTodayAttendance();
    }, [fetchLogs, fetchSummary, fetchTodayAttendance]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1 // Reset to first page when filter changes
        }));
    };

    // Clear filters
    const handleClearFilters = () => {
        setFilters({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            employeeId: '',
            punchType: '',
            page: 1,
            limit: 50
        });
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchLogs();
        fetchSummary();
        fetchTodayAttendance();
    };

    // Handle page change
    const handlePageChange = (event, value) => {
        setFilters(prev => ({ ...prev, page: value }));
    };

    // Handle row expansion
    const handleRowExpand = (logId) => {
        setExpandedRow(expandedRow === logId ? null : logId);
    };

    // Get punch type chip (0 = Check In, 1 = Check Out)
    const getPunchTypeChip = (type) => {
        const typeMap = {
            0: { label: 'Check In', color: 'success', icon: <CheckIcon /> },
            1: { label: 'Check Out', color: 'warning', icon: <CloseIcon /> }
        };
        const typeInfo = typeMap[type] || { label: 'Unknown', color: 'default', icon: null };
        return (
            <Chip
                label={typeInfo.label}
                color={typeInfo.color}
                size="small"
                icon={typeInfo.icon}
            />
        );
    };

    // Get status chip
    const getStatusChip = (status) => {
        const statusMap = {
            present: { label: 'Present', color: 'success' },
            absent: { label: 'Absent', color: 'error' },
            'half-day': { label: 'Half Day', color: 'warning' },
            'checked-in': { label: 'Checked In', color: 'info' },
            'checked-out': { label: 'Checked Out', color: 'secondary' }
        };
        const statusInfo = statusMap[status] || { label: status || 'Unknown', color: 'default' };
        return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
    };

    // Export report
    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await exportAttendanceReport({
                startDate: filters.startDate,
                endDate: filters.endDate
            });
            // if (response.success)
                if (response.status === "success") {
                // Create CSV download
                const headers = ['Log ID', 'Employee', 'Punch Time', 'Punch Type', 'Device', 'Location'];
                const csvRows = [headers.join(',')];

                response.data.forEach(log => {
                    const row = [
                        log.LogId,
                        `"${log.employee_name || `Emp #${log.EmployeeId}`}"`,
                        formatDateTime(log.PunchTime),
                        // ✅ FIXED: 0 = Check In, 1 = Check Out
                        log.PunchType === 0 ? 'Check In' : 'Check Out',
                        `"${log.DeviceName || '-'}"`,
                        `"${log.DeviceLocation || '-'}"`
                    ];
                    csvRows.push(row.join(','));
                });

                const csvContent = csvRows.join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance_report_${filters.startDate}_to_${filters.endDate}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('❌ Error exporting report:', err);
            setError('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    // Print report
    const handlePrint = () => {
        window.print();
    };

    // Render summary cards
    const renderSummaryCards = () => {
        if (!summary) return null;

        const cards = [
            { label: 'Total Employees', value: summary.total || 0, color: '#f0fdf4', textColor: 'success.main' },
            { label: 'Checked In', value: summary.checkedIn || 0, color: '#dcfce7', textColor: 'success.main' },
            { label: 'Absent', value: summary.absent || 0, color: '#fee2e2', textColor: 'error.main' },
            { label: 'Not Checked In', value: summary.notCheckedIn || 0, color: '#fef3c7', textColor: 'warning.main' },
            { label: 'Checked Out', value: summary.checkedOut || 0, color: '#e0f2fe', textColor: 'info.main' }
        ];

        return (
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {cards.map((card, index) => (
                    <Grid item xs={6} sm={4} md={2.4} key={index}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: card.color }}>
                            <Typography variant="h4" color={card.textColor}>
                                {card.value}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {card.label}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        );
    };

    // Render today's attendance card
    const renderTodayAttendance = () => {
        if (!isEmployee || !todayAttendance) return null;

        return (
            <Fade in={!!todayAttendance}>
                <Card sx={{ mb: 3, bgcolor: '#f8fafc' }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <TodayIcon color="primary" />
                            <Typography variant="h6">Today's Attendance</Typography>
                            <Box flex={1} />
                            <Chip
                                label={todayAttendance.status === 'present' ? 'Present' :
                                    todayAttendance.status === 'half-day' ? 'Half Day' : 'Absent'}
                                color={todayAttendance.status === 'present' ? 'success' :
                                    todayAttendance.status === 'half-day' ? 'warning' : 'error'}
                            />
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">Check In</Typography>
                                {todayAttendance.checkIn ? (
                                    <Box>
                                        <Typography variant="body1" fontWeight="bold">
                                            {formatTime(todayAttendance.checkIn.PunchTime)}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Device: {todayAttendance.checkIn.DeviceName || 'Unknown'}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Location: {todayAttendance.checkIn.DeviceLocation || 'Unknown'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Not checked in yet
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">Check Out</Typography>
                                {todayAttendance.checkOut ? (
                                    <Box>
                                        <Typography variant="body1" fontWeight="bold">
                                            {formatTime(todayAttendance.checkOut.PunchTime)}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Device: {todayAttendance.checkOut.DeviceName || 'Unknown'}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Location: {todayAttendance.checkOut.DeviceLocation || 'Unknown'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Not checked out yet
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Fade>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5">
                Attendance Device Logs
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {isEmployee && 'Your attendance records'}
                {isCustodian && 'Your team attendance records'}
                {isHR && 'All employees attendance records'}
            </Typography>

            {/* Today's Attendance */}
            {renderTodayAttendance()}

            {/* Summary Cards */}
            {renderSummaryCards()}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            type="date"
                            name="startDate"
                            label="Start Date"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            type="date"
                            name="endDate"
                            label="End Date"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                    </Grid>
                    {(isHR || isCustodian) && (
                        <Grid item xs={12} sm={2}>
                            <TextField
                                fullWidth
                                name="employeeId"
                                label="Employee ID"
                                value={filters.employeeId}
                                onChange={handleFilterChange}
                                placeholder="Filter by employee"
                                size="small"
                                InputProps={{
                                    startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        </Grid>
                    )}
                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Punch Type</InputLabel>
                            <Select
                                name="punchType"
                                value={filters.punchType}
                                onChange={handleFilterChange}
                                label="Punch Type"
                            >
                                <MenuItem value="">All</MenuItem>
                                {/* ✅ FIXED: 0 = Check In, 1 = Check Out */}
                                <MenuItem value="0">Check In</MenuItem>
                                <MenuItem value="1">Check Out</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={handleRefresh}
                                fullWidth
                                disabled={loading}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                                onClick={handleExport}
                                disabled={logs.length === 0 || exporting}
                            >
                                Export
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PrintIcon />}
                                onClick={handlePrint}
                                disabled={logs.length === 0}
                            >
                                Print
                            </Button>
                            <IconButton
                                onClick={handleClearFilters}
                                color="primary"
                                title="Clear Filters"
                            >
                                <ClearIcon />
                            </IconButton>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Employee</TableCell>
                            <TableCell>Punch Time</TableCell>
                            <TableCell>Punch Type</TableCell>
                            <TableCell>Device</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Verified</TableCell>
                            <TableCell>Synced</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <CircularProgress />
                                        <Typography sx={{ mt: 2 }}>Loading attendance logs...</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Alert severity="error" action={
                                        <Button color="inherit" size="small" onClick={handleRefresh}>
                                            Retry
                                        </Button>
                                    }>
                                        {error}
                                    </Alert>
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">
                                        No attendance logs found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, index) => (
                                <React.Fragment key={log.LogId}>
                                    <TableRow hover>
                                        <TableCell>{((filters.page - 1) * filters.limit) + index + 1}</TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                                    {log.employee_name?.charAt(0) || 'E'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {log.employee_name || `Employee #${log.EmployeeId}`}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {log.employee_designation || 'No Designation'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {log.employee_code || ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={formatDateTime(log.PunchTime)}>
                                                <Box>
                                                    <Typography variant="body2">
                                                        {formatDate(log.PunchTime)}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatTime(log.PunchTime)}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{getPunchTypeChip(log.PunchType)}</TableCell>
                                        <TableCell>
                                            <Tooltip title={log.DeviceName || 'Unknown'}>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <BusinessIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {log.DeviceName || '-'}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={log.DeviceLocation || 'Unknown'}>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <LocationIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {log.DeviceLocation || '-'}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.VerifyType === 1 ? 'Yes' : 'No'}
                                                color={log.VerifyType === 1 ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.IsAutoSynced === 1 ? 'Yes' : 'No'}
                                                color={log.IsAutoSynced === 1 ? 'success' : 'warning'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRowExpand(log.LogId)}
                                                >
                                                    {expandedRow === log.LogId ? <CancelIcon /> : <SearchIcon />}
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                    {/* Expanded Row */}
                                    <TableRow>
                                        <TableCell colSpan={9} sx={{ py: 0 }}>
                                            <Collapse in={expandedRow === log.LogId} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} sm={6} md={3}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Log ID
                                                            </Typography>
                                                            <Typography variant="body2">{log.LogId}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={3}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Employee ID
                                                            </Typography>
                                                            <Typography variant="body2">{log.EmployeeId}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={3}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Device UID
                                                            </Typography>
                                                            <Typography variant="body2">{log.DeviceUid || '-'}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={3}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Created At
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {formatDateTime(log.CreatedAt)}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Employee Details
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {log.employee_name || `Employee #${log.EmployeeId}`} -
                                                                {log.employee_designation || 'No Designation'} -
                                                                {log.employee_department || 'No Department'}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalLogs > 0 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={Math.ceil(totalLogs / filters.limit)}
                        page={filters.page}
                        onChange={handlePageChange}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Box>
    );
};

export default AttendanceLogs;