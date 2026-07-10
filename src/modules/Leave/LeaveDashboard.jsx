import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    useTheme,
    alpha,
    CircularProgress,
    Alert,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Divider,
    LinearProgress,
    Avatar,
} from '@mui/material';
import {
    EventNote,
    PendingActions,
    CheckCircle,
    Cancel,
    People,
    Add,
    List,
    CalendarToday,
    BeachAccess,
    MedicalServices,
    FlightTakeoff,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getLeaveStats, getLeaveRequests, getLeaveBalances, getEmployeeLeaveRequests } from '../../services/leaveService';
import { useNavigate } from 'react-router-dom';

// ============================================
// STAT CARD — themed
// ============================================
const StatCard = ({ title, value, icon, colorKey, subtitle }) => {
    const theme = useTheme();
    const color = theme.palette[colorKey]?.main || theme.palette.primary.main;

    return (
        <Card
            sx={{
                height: '100%',
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: theme.palette.background.paper,
                boxShadow: theme.shadows[1],
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            color="textSecondary"
                            variant="body2"
                            gutterBottom
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}
                        >
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.75rem', sm: '2rem' } }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="textSecondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            bgcolor: alpha(color, 0.12),
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            ml: 1,
                        }}
                    >
                        {React.cloneElement(icon, { sx: { fontSize: '1.5rem', color } })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// ============================================
// QUICK ACTION BUTTON
// ============================================
const QuickActionButton = ({ icon, label, onClick, color = 'primary' }) => (
    <Button
        variant="contained"
        color={color}
        startIcon={icon}
        onClick={onClick}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3, py: 1.5 }}
    >
        {label}
    </Button>
);

// ============================================
// LEAVE BALANCE MINI CARD — themed
// ============================================
const getLeaveIcon = (name) => {
    const lower = name?.toLowerCase() || '';
    if (lower.includes('sick')) return <MedicalServices fontSize="small" />;
    if (lower.includes('casual')) return <BeachAccess fontSize="small" />;
    if (lower.includes('annual')) return <FlightTakeoff fontSize="small" />;
    return <EventNote fontSize="small" />;
};

const getLeaveColorKey = (name) => {
    const lower = name?.toLowerCase() || '';
    if (lower.includes('sick')) return 'error';
    if (lower.includes('casual')) return 'warning';
    if (lower.includes('annual')) return 'info';
    return 'secondary';
};

const BalanceMiniCard = ({ balance }) => {
    const theme = useTheme();
    const colorKey = getLeaveColorKey(balance.LeaveName);
    const color = theme.palette[colorKey]?.main || theme.palette.primary.main;

    const total = parseFloat(balance.TotalAllowed) || 0;
    const remaining = parseFloat(balance.Balance) || 0;
    const used = parseFloat(balance.Leaves) || 0;
    const percentage = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 2,
                borderColor: alpha(color, 0.3),
                bgcolor: alpha(color, 0.04),
                height: '100%',
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ bgcolor: alpha(color, 0.15), color, width: 32, height: 32 }}>
                    {getLeaveIcon(balance.LeaveName)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                        {balance.LeaveName || 'Leave'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {used} used of {total}
                    </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color }}>
                    {remaining}
                </Typography>
            </Stack>
            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(color, 0.15),
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
                }}
            />
        </Paper>
    );
};

// ============================================
// MAIN DASHBOARD
// ============================================
function LeaveDashboard() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, isCustodian, isHR, getRoleDisplay } = useAuth();

    const [stats, setStats] = useState(null);
    const [recentRequests, setRecentRequests] = useState([]);
    const [myBalances, setMyBalances] = useState([]);
    const [myUpcoming, setMyUpcoming] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // ---- Stats ----
            let statsData = {
                totalRequests: 0,
                pendingRequests: 0,
                approvedRequests: 0,
                rejectedRequests: 0,
                cancelledRequests: 0,
                totalEmployees: 0,
                totalLeaveDays: 0,
            };
            try {
                const statsResponse = await getLeaveStats();
                statsData = statsResponse.data?.data || statsResponse.data || statsData;
            } catch (statsErr) {
                console.warn('⚠️ Stats fetch failed, using defaults:', statsErr);
            }

            // ---- HR / Custodian: recent pending requests across team ----
            let requestsData = [];
            if (isHR() || isCustodian()) {
                try {
                    const requestsResponse = await getLeaveRequests({ status: 'Pending', limit: 5 });
                    requestsData = requestsResponse.data?.data || requestsResponse.data || [];
                } catch (reqErr) {
                    console.warn('⚠️ Requests fetch failed:', reqErr);
                }
            }

            // ---- Everyone: my own balances ----
            let balancesData = [];
            if (user?.EmployeeID) {
                try {
                    const balResponse = await getLeaveBalances(user.EmployeeID);
                    balancesData = balResponse.data?.data || balResponse.data || [];
                } catch (balErr) {
                    console.warn('⚠️ My balances fetch failed:', balErr);
                }
            }

            // ---- Everyone: my own upcoming approved leave ----
            let upcomingData = [];
            if (user?.EmployeeID) {
                try {
                    const myReqResponse = await getEmployeeLeaveRequests(user.EmployeeID);
                    const myReqs = myReqResponse.data?.data || myReqResponse.data || [];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    upcomingData = myReqs
                        .filter((r) => r.Status === 'Approved' && new Date(r.EndDate) >= today)
                        .sort((a, b) => new Date(a.StartDate) - new Date(b.StartDate))
                        .slice(0, 5);
                } catch (myReqErr) {
                    console.warn('⚠️ My requests fetch failed:', myReqErr);
                }
            }

            setStats(statsData);
            setRecentRequests(requestsData.slice(0, 5));
            setMyBalances(balancesData);
            setMyUpcoming(upcomingData);
        } catch (err) {
            console.error('❌ Error fetching dashboard data:', err);
            if (err.response?.status === 401) {
                setError('Your session has expired. Please login again.');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError('Unable to load dashboard. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApplyLeave = () => navigate('/LeaveApply');
    const handleLeaveTypes = () => navigate('/LeaveTypes');
    const handleAllRequests = () => navigate('/LeaveRequests');
    const handleMyBalance = () => navigate('/LeaveBalance');
    const handleViewRequest = (id) => navigate(`/LeaveRequests/${id}`);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: 2 }}>
                <CircularProgress size={48} />
                <Typography variant="body2" color="textSecondary">
                    Loading dashboard...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ m: 3 }}>
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={fetchDashboardData}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    // ---- Stat cards, theme-driven colors ----
    const statCards = [
        { title: 'Total Requests', value: stats?.totalRequests || 0, icon: <EventNote />, colorKey: 'primary', subtitle: 'Last 30 days' },
        { title: 'Pending', value: stats?.pendingRequests || 0, icon: <PendingActions />, colorKey: 'warning', subtitle: 'Awaiting approval' },
        { title: 'Approved', value: stats?.approvedRequests || 0, icon: <CheckCircle />, colorKey: 'success', subtitle: 'Approved requests' },
        { title: 'Rejected', value: stats?.rejectedRequests || 0, icon: <Cancel />, colorKey: 'error', subtitle: 'Rejected requests' },
    ];

    if (isCustodian() || isHR()) {
        statCards.push({
            title: 'Team Members',
            value: stats?.totalEmployees || 0,
            icon: <People />,
            colorKey: 'secondary',
            subtitle: 'Under supervision',
        });
    }

    const getQuickActions = () => {
        const actions = [{ icon: <Add />, label: 'Apply for Leave', color: 'primary', onClick: handleApplyLeave }];
        actions.push({ icon: <EventNote />, label: 'My Leave Balance', color: 'success', onClick: handleMyBalance });
        if (isHR() || isCustodian()) {
            actions.push({ icon: <List />, label: 'View All Requests', color: 'info', onClick: handleAllRequests });
        }
        if (isHR()) {
            actions.push({ icon: <CalendarToday />, label: 'Manage Leave Types', color: 'warning', onClick: handleLeaveTypes });
        }
        return actions;
    };

    const quickActions = getQuickActions();

    const getStatusChipColor = (status) => {
        const map = { Pending: 'warning', Approved: 'success', Rejected: 'error', Cancelled: 'default' };
        return map[status] || 'default';
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 4,
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Leave Dashboard
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Welcome back, {user?.Name || 'User'}!
                        <Chip label={getRoleDisplay()} size="small" color="primary" sx={{ ml: 1, fontWeight: 500 }} />
                    </Typography>
                </Box>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDashboardData} size="small">
                    Refresh
                </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <StatCard {...stat} />
                    </Grid>
                ))}
            </Grid>

            {/* Quick Actions */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Quick Actions
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
                    {quickActions.map((action, index) => (
                        <QuickActionButton key={index} {...action} />
                    ))}
                </Stack>
            </Paper>

            {/* My Leave Balance */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        My Leave Balance
                    </Typography>
                    <Button variant="text" size="small" onClick={handleMyBalance}>
                        View Details
                    </Button>
                </Box>
                {myBalances.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                        No leave balance found for your account yet.
                    </Typography>
                ) : (
                    <Grid container spacing={2}>
                        {myBalances.map((bal, i) => (
                            <Grid item xs={12} sm={6} md={3} key={bal.BalanceID || i}>
                                <BalanceMiniCard balance={bal} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            <Grid container spacing={3}>
                {/* My Upcoming Leave */}
                <Grid item xs={12} md={isHR() || isCustodian() ? 5 : 12}>
                    <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            My Upcoming Leave
                        </Typography>
                        {myUpcoming.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <FlightTakeoff sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" color="textSecondary">
                                    No upcoming approved leave
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={1.5} divider={<Divider flexItem />}>
                                {myUpcoming.map((req) => (
                                    <Box key={req.RequestID} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {req.LeaveName || req.LeaveType}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(req.StartDate).toLocaleDateString()} – {new Date(req.EndDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Chip label={`${req.TotalDays}d`} size="small" color="success" variant="outlined" />
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Pending Requests (HR / Custodian only) */}
                {(isHR() || isCustodian()) && (
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Recent Pending Requests
                                </Typography>
                                <Button variant="outlined" size="small" onClick={handleAllRequests}>
                                    View All
                                </Button>
                            </Box>

                            {recentRequests.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <EventNote sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        No pending leave requests
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="center">Days</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {recentRequests.map((req) => (
                                                <TableRow key={req.RequestID} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {req.EmployeeName || req.Name || 'Unknown'}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {req.EmployeeCode || req.Code || 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{req.LeaveName || req.LeaveType || 'N/A'}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip label={req.TotalDays || 0} size="small" color="primary" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip label={req.Status} size="small" color={getStatusChipColor(req.Status)} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Button size="small" variant="outlined" onClick={() => handleViewRequest(req.RequestID)} sx={{ textTransform: 'none' }}>
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}

export default LeaveDashboard;