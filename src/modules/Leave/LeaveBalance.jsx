import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Button
} from '@mui/material';
import {
    EventNote,
    BeachAccess,
    CalendarToday,
    MedicalServices,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getLeaveBalances } from '../../services/leaveService';

const LeaveBalance = () => {
    const { user } = useAuth();
    
    // ✅ ALL useState hooks must be at the TOP
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null); // ✅ Moved to top

    // ✅ ALL useEffect hooks must be at the TOP
    useEffect(() => {
        if (user && user.EmployeeID) {
            fetchBalances();
        }
    }, [user]);

    const fetchBalances = async () => {
        setLoading(true);
        setError(null);
        try {
            const employeeId = user?.EmployeeID;

            if (!employeeId) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }

            console.log("📊 Fetching leave balances for employee:", employeeId);
            const response = await getLeaveBalances(employeeId);
            console.log("📊 Leave balances response:", response);

            let data = [];
            if (response.data?.data) {
                data = response.data.data;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data) {
                data = [response.data];
            }

            console.log("📊 Processed balances:", data);
            setBalances(data);
        } catch (err) {
            console.error("❌ Error fetching balances:", err);
            if (err.response?.status === 403) {
                setError("You don't have permission to view these leave balances");
            } else {
                setError(err.response?.data?.message || "Failed to load leave balances");
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch balance for selected employee (team member)
    const fetchTeamMemberBalance = async (employeeId) => {
        setSelectedEmployeeId(employeeId);
        // ✅ Use the employeeId passed in, not user's ID
        setLoading(true);
        setError(null);
        try {
            console.log("📊 Fetching balances for team member:", employeeId);
            const response = await getLeaveBalances(employeeId);
            
            let data = [];
            if (response.data?.data) {
                data = response.data.data;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data) {
                data = [response.data];
            }

            setBalances(data);
        } catch (err) {
            console.error("❌ Error fetching team member balances:", err);
            setError(err.response?.data?.message || "Failed to load team member balances");
        } finally {
            setLoading(false);
        }
    };

    const getLeaveIcon = (name) => {
        const lower = name?.toLowerCase() || '';
        if (lower.includes('sick')) return <MedicalServices />;
        if (lower.includes('casual')) return <BeachAccess />;
        if (lower.includes('annual')) return <CalendarToday />;
        return <EventNote />;
    };

    const getColor = (name) => {
        const lower = name?.toLowerCase() || '';
        if (lower.includes('sick')) return '#ef5350';
        if (lower.includes('casual')) return '#ff9800';
        if (lower.includes('annual')) return '#2196f3';
        return '#9e9e9e';
    };

    const getStatusColor = (remaining, total) => {
        if (total === 0) return 'default';
        const percentage = (remaining / total) * 100;
        if (percentage <= 20) return 'error';
        if (percentage <= 50) return 'warning';
        return 'success';
    };

    // ✅ Conditional returns AFTER all hooks
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ m: 3 }}>
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={fetchBalances}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    // Calculate total summary
    const totalAllowed = balances.reduce((sum, b) => sum + (b.TotalAllowed || 0), 0);
    const totalUsed = balances.reduce((sum, b) => sum + (b.UsedDays || 0), 0);
    const totalRemaining = balances.reduce((sum, b) => sum + (b.RemainingDays || 0), 0);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        My Leave Balance
                    </Typography>
                    {selectedEmployeeId && (
                        <Typography variant="body2" color="textSecondary">
                            Viewing balance for team member
                        </Typography>
                    )}
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchBalances}
                    size="small"
                >
                    Refresh
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 3, bgcolor: '#e3f2fd' }}>
                        <CardContent>
                            <Typography variant="body2" color="textSecondary">Total Allowed</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                {totalAllowed}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Days per year</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 3, bgcolor: '#fff3e0' }}>
                        <CardContent>
                            <Typography variant="body2" color="textSecondary">Used</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                                {totalUsed}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Days used</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 3, bgcolor: '#e8f5e9' }}>
                        <CardContent>
                            <Typography variant="body2" color="textSecondary">Remaining</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                                {totalRemaining}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Days remaining</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Balance Cards */}
            {balances.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                        No leave balances found
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {balances.map((balance, index) => {
                        const remaining = balance.RemainingDays || 0;
                        const total = balance.TotalAllowed || 0;
                        const used = balance.UsedDays || 0;
                        const percentage = total > 0 ? (remaining / total) * 100 : 0;
                        const color = getColor(balance.LeaveName);

                        return (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card sx={{
                                    height: '100%',
                                    borderRadius: 3,
                                    border: `1px solid ${color}20`,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Box sx={{
                                                bgcolor: `${color}20`,
                                                borderRadius: 2,
                                                p: 1,
                                                mr: 2,
                                                color: color
                                            }}>
                                                {getLeaveIcon(balance.LeaveName)}
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {balance.LeaveName || 'Unknown'}
                                            </Typography>
                                        </Box>

                                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: color }}>
                                            {remaining}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={`Total: ${total}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`Used: ${used}`}
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`${Math.round(percentage)}% remaining`}
                                                size="small"
                                                color={getStatusColor(remaining, total)}
                                            />
                                        </Box>

                                        {/* Progress Bar */}
                                        <Box sx={{
                                            width: '100%',
                                            height: 8,
                                            bgcolor: '#e0e0e0',
                                            borderRadius: 4,
                                            overflow: 'hidden'
                                        }}>
                                            <Box sx={{
                                                width: `${Math.min(percentage, 100)}%`,
                                                height: '100%',
                                                bgcolor: color,
                                                borderRadius: 4,
                                                transition: 'width 0.3s'
                                            }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Year Info */}
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                Leave balances for year {new Date().getFullYear()}
            </Typography>
        </Box>
    );
};

export default LeaveBalance;