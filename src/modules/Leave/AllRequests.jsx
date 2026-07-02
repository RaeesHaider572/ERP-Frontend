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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getAllLeaveRequests, updateLeaveStatus } from '../../services/leaveService';

const AllRequests = () => {
    const { user, isHR } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ status: 'Pending' });
    const [approveDialog, setApproveDialog] = useState({
        open: false,
        requestId: null,
        requestCode: '',
        comments: '',
        action: ''
    });

    useEffect(() => {
        if (user && isHR()) {
            fetchRequests();
        }
    }, [user, filter]);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("📋 Fetching all leave requests for HR...");
            const response = await getAllLeaveRequests(filter);
            console.log("📋 All requests response:", response);
            
            let data = [];
            if (response.data?.data) {
                data = response.data.data;
            } else if (Array.isArray(response.data)) {
                data = response.data;
            }
            
            setRequests(data);
        } catch (err) {
            console.error("❌ Error fetching requests:", err);
            setError(err.response?.data?.message || "Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await updateLeaveStatus(approveDialog.requestId, {
                status: approveDialog.action,
                comments: approveDialog.comments
            });
            setApproveDialog({ open: false, requestId: null, requestCode: '', comments: '', action: '' });
            await fetchRequests();
        } catch (err) {
            console.error("❌ Error updating request:", err);
            alert(err.response?.data?.message || "Failed to update leave request");
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

    // Calculate statistics
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.Status === 'Pending').length,
        approved: requests.filter(r => r.Status === 'Approved').length,
        rejected: requests.filter(r => r.Status === 'Rejected').length,
        cancelled: requests.filter(r => r.Status === 'Cancelled').length
    };

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

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    All Leave Requests
                </Typography>
                <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />}
                    onClick={fetchRequests}
                    size="small"
                >
                    Refresh
                </Button>
            </Box>

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

            {/* Filter */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Filter by Status</InputLabel>
                        <Select
                            value={filter.status || ''}
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
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Department</InputLabel>
                        <Select
                            value={filter.department || ''}
                            onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                            label="Department"
                        >
                            <MenuItem value="">All Departments</MenuItem>
                            <MenuItem value="IT">IT</MenuItem>
                            <MenuItem value="HR">HR</MenuItem>
                            <MenuItem value="Finance">Finance</MenuItem>
                            <MenuItem value="Marketing">Marketing</MenuItem>
                        </Select>
                    </FormControl>
                    {filter.status && (
                        <Button size="small" onClick={() => setFilter({ status: '' })}>
                            Clear Filter
                        </Button>
                    )}
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 'auto' }}>
                        Showing {requests.length} requests
                    </Typography>
                </Box>
            </Paper>

            {/* Requests Table */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                {requests.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                            No leave requests found
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Request ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Days</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.RequestID} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {req.AppliedDate ? new Date(req.AppliedDate).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {req.EmployeeName || req.Name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {req.EmployeeCode || req.Code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{req.Department || 'N/A'}</TableCell>
                                        <TableCell>{req.LeaveName || req.LeaveType}</TableCell>
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
                                            {req.Status === 'Pending' && (
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Tooltip title="Approve">
                                                        <IconButton 
                                                            size="small" 
                                                            color="success"
                                                            onClick={() => setApproveDialog({
                                                                open: true,
                                                                requestId: req.RequestID,
                                                                requestCode: req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`,
                                                                comments: '',
                                                                action: 'Approved'
                                                            })}
                                                        >
                                                            <ApproveIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reject">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => setApproveDialog({
                                                                open: true,
                                                                requestId: req.RequestID,
                                                                requestCode: req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`,
                                                                comments: '',
                                                                action: 'Rejected'
                                                            })}
                                                        >
                                                            <RejectIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Approve/Reject Dialog */}
            <Dialog
                open={approveDialog.open}
                onClose={() => setApproveDialog({ open: false, requestId: null, requestCode: '', comments: '', action: '' })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {approveDialog.action === 'Approved' ? 'Approve' : 'Reject'} Leave Request
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Request ID: {approveDialog.requestCode}
                    </Typography>
                    <TextField
                        fullWidth
                        label="Comments (Optional)"
                        multiline
                        rows={3}
                        value={approveDialog.comments}
                        onChange={(e) => setApproveDialog({ ...approveDialog, comments: e.target.value })}
                        placeholder="Add any comments..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setApproveDialog({ open: false, requestId: null, requestCode: '', comments: '', action: '' })}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApprove}
                        color={approveDialog.action === 'Approved' ? 'success' : 'error'}
                        variant="contained"
                    >
                        {approveDialog.action === 'Approved' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AllRequests;