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
    Divider
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
    TrendingUp,
    TrendingDown
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getLeaveStats, getLeaveRequests } from '../../services/leaveService';
import { useNavigate } from 'react-router-dom';

// Stat Card Component
const StatCard = ({ title, value, icon, color, subtitle }) => {
    const theme = useTheme();
    
    return (
        <Card sx={{ 
            height: '100%',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: theme.palette.background.paper,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
            }
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                            color="textSecondary" 
                            variant="body2" 
                            gutterBottom
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 500,
                            }}
                        >
                            {title}
                        </Typography>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 700, 
                                mb: 1,
                                fontSize: { xs: '1.75rem', sm: '2rem' },
                            }}
                        >
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="textSecondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{
                        bgcolor: alpha(color, 0.1),
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        ml: 1,
                    }}>
                        {React.cloneElement(icon, {
                            sx: { 
                                fontSize: '1.5rem',
                                color: color,
                            }
                        })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// Quick Action Button Component
const QuickActionButton = ({ icon, label, onClick, color = 'primary' }) => (
    <Button
        variant="contained"
        color={color}
        startIcon={icon}
        onClick={onClick}
        sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
        }}
    >
        {label}
    </Button>
);

function LeaveDashboard() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, isEmployee, isCustodian, isHR, getRoleDisplay } = useAuth();
    
    const [stats, setStats] = useState(null);
    const [recentRequests, setRecentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // ✅ Only fetch if user is authenticated
        if (!user) {
            setLoading(false);
            return;
        }
        fetchDashboardData();
    }, [user]);

    // ============================================
// FETCH DASHBOARD DATA - FIXED
// ============================================
const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
        console.log("📡 Fetching dashboard data...");
        console.log("🔐 Current user:", user);
        
        // ✅ Fetch stats with safe error handling
        let statsData = {
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            rejectedRequests: 0,
            cancelledRequests: 0,
            totalEmployees: 0,
            totalLeaveDays: 0
        };
        
        try {
            const statsResponse = await getLeaveStats();
            console.log("📊 Stats response:", statsResponse);
            
            if (statsResponse.data?.data) {
                statsData = statsResponse.data.data;
            } else if (statsResponse.data) {
                statsData = statsResponse.data;
            }
        } catch (statsErr) {
            console.warn("⚠️ Stats fetch failed, using defaults:", statsErr);
            // Keep default values
        }
        
        // ✅ Fetch recent requests with safe error handling
        let requestsData = [];
        if (isHR() || isCustodian()) {
            try {
                const requestsResponse = await getLeaveRequests({ status: 'Pending', limit: 5 });
                console.log("📋 Recent requests:", requestsResponse);
                requestsData = requestsResponse.data?.data || requestsResponse.data || [];
            } catch (reqErr) {
                console.warn("⚠️ Requests fetch failed:", reqErr);
                // Keep empty array
            }
        }
        
        setStats(statsData);
        setRecentRequests(requestsData.slice(0, 5));
        
    } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        // ✅ Show user-friendly error message
        if (error.response?.status === 401) {
            setError("Your session has expired. Please login again.");
            setTimeout(() => navigate('/login'), 2000);
        } else {
            setError("Unable to load dashboard. Please try again later.");
        }
    } finally {
        setLoading(false);
    }
};

    // Handle navigation
    const handleApplyLeave = () => navigate('/LeaveApply');
    const handleLeaveTypes = () => navigate('/LeaveTypes');
    const handleAllRequests = () => navigate('/LeaveRequests');
    const handleViewRequest = (id) => navigate(`/LeaveRequests/${id}`);

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh',
                gap: 2
            }}>
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

    // Build stats based on role
    const statCards = [
        {
            title: 'Total Requests',
            value: stats?.totalRequests || 0,
            icon: <EventNote />,
            color: '#6366f1',
            subtitle: 'All time'
        },
        {
            title: 'Pending',
            value: stats?.pendingRequests || 0,
            icon: <PendingActions />,
            color: '#f59e0b',
            subtitle: 'Awaiting approval'
        },
        {
            title: 'Approved',
            value: stats?.approvedRequests || 0,
            icon: <CheckCircle />,
            color: '#10b981',
            subtitle: 'Approved requests'
        },
        {
            title: 'Rejected',
            value: stats?.rejectedRequests || 0,
            icon: <Cancel />,
            color: '#ef4444',
            subtitle: 'Rejected requests'
        },
    ];

    // Add role-specific stats
    if (isCustodian() || isHR()) {
        statCards.push({
            title: 'Team Members',
            value: user?.teamMembers?.length || 0,
            icon: <People />,
            color: '#8b5cf6',
            subtitle: 'Under supervision'
        });
    }

    // Determine quick actions based on role
    const getQuickActions = () => {
        const actions = [];
        
        // All roles can apply for leave
        actions.push({
            icon: <Add />,
            label: 'Apply for Leave',
            color: 'primary',
            onClick: handleApplyLeave
        });
        
        // HR and Custodian can view all requests
        if (isHR() || isCustodian()) {
            actions.push({
                icon: <List />,
                label: 'View All Requests',
                color: 'info',
                onClick: handleAllRequests
            });
        }
        
        // HR can manage leave types
        if (isHR()) {
            actions.push({
                icon: <CalendarToday />,
                label: 'Manage Leave Types',
                color: 'warning',
                onClick: handleLeaveTypes
            });
        }
        
        return actions;
    };

    const quickActions = getQuickActions();

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 4,
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Leave Dashboard
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Welcome back, {user?.Name || 'User'}! 
                        <Chip 
                            label={getRoleDisplay()} 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1, fontWeight: 500 }}
                        />
                    </Typography>
                </Box>
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
            <Paper 
                sx={{ 
                    p: 3, 
                    mb: 4, 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Quick Actions
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {quickActions.map((action, index) => (
                        <QuickActionButton key={index} {...action} />
                    ))}
                </Stack>
            </Paper>

            {/* Recent Pending Requests */}
            {recentRequests.length > 0 && (
                <Paper 
                    sx={{ 
                        p: 3, 
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                >
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Recent Pending Requests
                        </Typography>
                        {isHR() && (
                            <Button 
                                variant="outlined" 
                                size="small" 
                                onClick={handleAllRequests}
                            >
                                View All
                            </Button>
                        )}
                    </Box>
                    
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Days</TableCell>
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
                                        <TableCell>
                                            {req.StartDate && req.EndDate ? (
                                                <>
                                                    {new Date(req.StartDate).toLocaleDateString()} 
                                                    {' - '}
                                                    {new Date(req.EndDate).toLocaleDateString()}
                                                </>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={req.TotalDays || 0} 
                                                size="small" 
                                                color="primary" 
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleViewRequest(req.RequestID)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Empty State */}
            {recentRequests.length === 0 && isHR() && (
                <Paper 
                    sx={{ 
                        p: 4, 
                        borderRadius: 3,
                        textAlign: 'center',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                >
                    <EventNote sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="textSecondary">
                        No pending leave requests
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        All leave requests have been processed
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}

export default LeaveDashboard;