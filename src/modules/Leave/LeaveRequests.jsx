import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Tooltip,
    Snackbar,
    useTheme,
    alpha
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Cancel as CancelIcon,
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { 
    getEmployeeLeaveRequests, 
    cancelLeaveRequest, 
    updateLeaveStatus, 
    getLeaveBalances 
} from '../../services/leaveService';

const LeaveRequests = () => {
    const theme = useTheme();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ status: '' });
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: null,
        leaveType: ''
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    const [cancelDialog, setCancelDialog] = useState({ 
        open: false, 
        requestId: null, 
        requestCode: '' 
    });
    
    const [actionDialog, setActionDialog] = useState({
        open: false,
        requestId: null,
        action: null,
        requestData: null
    });

    // ✅ Wait for auth to load before fetching
    useEffect(() => {
        if (!authLoading) {
            if (isAuthenticated && user && user.EmployeeID) {
                fetchRequests();
            } else if (!isAuthenticated) {
                setLoading(false);
                setError("Please login to view your leave requests");
            }
        }
    }, [user, isAuthenticated, authLoading]);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!user || !user.EmployeeID) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }

            console.log("📋 Fetching leave requests for employee:", user.EmployeeID);
            
            const response = await getEmployeeLeaveRequests(user.EmployeeID);
            console.log("📋 Leave requests response:", response);
            
            let data = [];
            if (response.data?.data) {
                data = response.data.data;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data) {
                data = [response.data];
            }
            
            setRequests(data);
        } catch (err) {
            console.error("❌ Error fetching requests:", err);
            
            if (err.response?.status === 403) {
                setError("You don't have permission to view these leave records");
            } else if (err.response?.status === 401) {
                setError("Session expired. Please login again.");
            } else {
                setError(err.response?.data?.message || "Failed to load leave requests");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveBalances = async (employeeId) => {
        try {
            const response = await getLeaveBalances(employeeId);
            console.log('📊 Balances updated:', response.data);
            setSnackbar({
                open: true,
                message: 'Leave balances updated successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('❌ Error fetching balances:', error);
            setSnackbar({
                open: true,
                message: 'Failed to fetch leave balances',
                severity: 'error'
            });
        }
    };

    const handleApprove = async (requestId) => {
        setLoading(true);
        try {
            const response = await updateLeaveStatus(requestId, 'Approved');
            console.log('✅ Leave approved:', response.data);
            
            setSnackbar({
                open: true,
                message: 'Leave approved successfully! Balance updated.',
                severity: 'success'
            });
            
            await fetchRequests();
            
            if (selectedEmployeeId) {
                await fetchLeaveBalances(selectedEmployeeId);
            }
            
            if (formData?.employeeId) {
                await fetchLeaveBalances(formData.employeeId);
            }
            
            setActionDialog({ open: false, requestId: null, action: null, requestData: null });
            
        } catch (error) {
            console.error('❌ Error approving leave:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to approve leave',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        setLoading(true);
        try {
            const response = await updateLeaveStatus(requestId, 'Rejected');
            console.log('✅ Leave rejected:', response.data);
            
            setSnackbar({
                open: true,
                message: 'Leave rejected successfully',
                severity: 'info'
            });
            
            await fetchRequests();
            setActionDialog({ open: false, requestId: null, action: null, requestData: null });
            
        } catch (error) {
            console.error('❌ Error rejecting leave:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to reject leave',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            await cancelLeaveRequest(cancelDialog.requestId);
            setCancelDialog({ open: false, requestId: null, requestCode: '' });
            setSnackbar({
                open: true,
                message: 'Leave request cancelled successfully',
                severity: 'success'
            });
            await fetchRequests();
        } catch (err) {
            console.error("❌ Error cancelling request:", err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || "Failed to cancel leave request",
                severity: 'error'
            });
        }
    };

    const getStatusChip = (status) => {
        const colors = {
            'Pending': 'warning',
            'Approved': 'success',
            'Rejected': 'error',
            'Cancelled': 'default'
        };
        return <Chip label={status} color={colors[status] || 'default'} size="small" />;
    };

    const filteredRequests = requests.filter(req => {
        if (!filter.status) return true;
        return req.Status === filter.status;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.Status === 'Pending').length,
        approved: requests.filter(r => r.Status === 'Approved').length,
        rejected: requests.filter(r => r.Status === 'Rejected').length,
        cancelled: requests.filter(r => r.Status === 'Cancelled').length
    };

    if (authLoading || loading) {
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
                        <Button color="inherit" size="small" onClick={fetchRequests}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!user || !isAuthenticated) {
        return (
            <Box sx={{ m: 3 }}>
                <Alert severity="warning">
                    Please login to view your leave requests
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Header Section - Matches Receipts Component */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.1
                    )} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            My Leave Requests
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {user?.Name || 'Employee'} • Manage your leave applications
                        </Typography>
                    </Grid>
                    <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: { md: 'flex-end' },
                            flexWrap: 'wrap',
                        }}
                    >
                        <Tooltip title="Refresh">
                            <IconButton
                                onClick={fetchRequests}
                                sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Paper>

            {/* Statistics Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.total}</Typography>
                        <Typography variant="caption" color="textSecondary">Total</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#fff3e0' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ed6c02' }}>{stats.pending}</Typography>
                        <Typography variant="caption" color="textSecondary">Pending</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#e8f5e9' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>{stats.approved}</Typography>
                        <Typography variant="caption" color="textSecondary">Approved</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#ffebee' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>{stats.rejected}</Typography>
                        <Typography variant="caption" color="textSecondary">Rejected</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#757575' }}>{stats.cancelled}</Typography>
                        <Typography variant="caption" color="textSecondary">Cancelled</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Filter Section - Matches Receipts Component */}
            <Paper
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: { xs: 2, sm: 3 },
                    borderRadius: 2,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Filter by Status</InputLabel>
                            <Select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                label="Filter by Status"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Approved">Approved</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' }, flexWrap: 'wrap' }}>
                            {filter.status && (
                                <Button
                                    variant="outlined"
                                    startIcon={<FilterIcon />}
                                    onClick={() => setFilter({ status: '' })}
                                    size="small"
                                >
                                    Clear Filter
                                </Button>
                            )}
                            <Typography variant="caption" color="textSecondary" sx={{ alignSelf: 'center' }}>
                                Showing {filteredRequests.length} of {requests.length} requests
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Requests Table */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                {filteredRequests.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                            {requests.length === 0 ? 'No leave requests found' : 'No requests match the filter'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Request ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Days</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRequests.map((req) => (
                                    <TableRow key={req.RequestID} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {req.AppliedDate ? new Date(req.AppliedDate).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{req.LeaveName || req.LeaveType || 'N/A'}</TableCell>
                                        <TableCell>{req.StartDate ? new Date(req.StartDate).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>{req.EndDate ? new Date(req.EndDate).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={req.TotalDays || 0} 
                                                size="small" 
                                                color="primary" 
                                                variant="outlined"
                                                sx={{ minWidth: 30 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {getStatusChip(req.Status)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <Tooltip title="View Details">
                                                    <IconButton 
                                                        size="small" 
                                                        color="info"
                                                        onClick={() => {
                                                            alert(`Request ID: ${req.RequestCode || req.RequestID}\nLeave Type: ${req.LeaveName}\nFrom: ${req.StartDate ? new Date(req.StartDate).toLocaleDateString() : 'N/A'}\nTo: ${req.EndDate ? new Date(req.EndDate).toLocaleDateString() : 'N/A'}\nDays: ${req.TotalDays || 0}\nReason: ${req.Reason || 'N/A'}\nStatus: ${req.Status}`);
                                                        }}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                
                                                {req.Status === 'Pending' && (user?.Role === 'HR' || user?.Role === 'admin') && (
                                                    <Tooltip title="Approve Leave">
                                                        <IconButton 
                                                            size="small" 
                                                            color="success"
                                                            onClick={() => setActionDialog({
                                                                open: true,
                                                                requestId: req.RequestID,
                                                                action: 'approve',
                                                                requestData: req
                                                            })}
                                                            disabled={loading}
                                                        >
                                                            <ApproveIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                
                                                {req.Status === 'Pending' && (user?.Role === 'HR' || user?.Role === 'admin') && (
                                                    <Tooltip title="Reject Leave">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => setActionDialog({
                                                                open: true,
                                                                requestId: req.RequestID,
                                                                action: 'reject',
                                                                requestData: req
                                                            })}
                                                            disabled={loading}
                                                        >
                                                            <RejectIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                
                                                {req.Status === 'Pending' && (user?.Role === 'employee' || user?.Role === 'custodian') && (
                                                    <Tooltip title="Cancel Request">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => setCancelDialog({
                                                                open: true,
                                                                requestId: req.RequestID,
                                                                requestCode: req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`
                                                            })}
                                                        >
                                                            <CancelIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Cancel Confirmation Dialog */}
            <Dialog 
                open={cancelDialog.open} 
                onClose={() => setCancelDialog({ open: false, requestId: null, requestCode: '' })}
            >
                <DialogTitle sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}>
                    Cancel Leave Request
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to cancel this leave request?
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        <strong>Request ID:</strong> {cancelDialog.requestCode}
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2, fontStyle: 'italic' }}>
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialog({ open: false, requestId: null, requestCode: '' })}>
                        No, Keep
                    </Button>
                    <Button onClick={handleCancel} color="error" variant="contained">
                        Yes, Cancel Request
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Approve/Reject Action Dialog */}
            <Dialog 
                open={actionDialog.open} 
                onClose={() => setActionDialog({ open: false, requestId: null, action: null, requestData: null })}
            >
                <DialogTitle sx={{ 
                    bgcolor: actionDialog.action === 'approve' ? '#e8f5e9' : '#ffebee',
                    color: actionDialog.action === 'approve' ? '#2e7d32' : '#d32f2f'
                }}>
                    {actionDialog.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {actionDialog.requestData && (
                        <>
                            <Typography>
                                {actionDialog.action === 'approve' 
                                    ? 'Are you sure you want to approve this leave request?' 
                                    : 'Are you sure you want to reject this leave request?'}
                            </Typography>
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    <strong>Employee:</strong> {actionDialog.requestData.EmployeeName || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Leave Type:</strong> {actionDialog.requestData.LeaveName || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>From:</strong> {actionDialog.requestData.StartDate ? new Date(actionDialog.requestData.StartDate).toLocaleDateString() : 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>To:</strong> {actionDialog.requestData.EndDate ? new Date(actionDialog.requestData.EndDate).toLocaleDateString() : 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Total Days:</strong> {actionDialog.requestData.TotalDays || 0}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Reason:</strong> {actionDialog.requestData.Reason || 'N/A'}
                                </Typography>
                            </Box>
                            {actionDialog.action === 'approve' && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    ⚠️ This will deduct {actionDialog.requestData.TotalDays || 0} day(s) from the employee's leave balance.
                                </Alert>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setActionDialog({ open: false, requestId: null, action: null, requestData: null })}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => {
                            if (actionDialog.action === 'approve') {
                                handleApprove(actionDialog.requestId);
                            } else {
                                handleReject(actionDialog.requestId);
                            }
                        }}
                        color={actionDialog.action === 'approve' ? 'success' : 'error'}
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (actionDialog.action === 'approve' ? 'Approve' : 'Reject')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveRequests;