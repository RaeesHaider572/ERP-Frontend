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
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { getAllLeaveRequests, updateLeaveStatus } from '../../services/leaveService';

const TeamRequests = () => {
    const { user, isHR, isCustodian } = useAuth();
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
        if (user && (isHR() || isCustodian())) {
            fetchRequests();
        }
    }, [user, filter]);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            // For custodian, filter by their team
            const params = { ...filter };
            if (isCustodian() && !isHR()) {
                // Only show their team members
            }
            const response = await getAllLeaveRequests(params);
            console.log("📋 Team requests:", response.data);
            const data = response.data?.data || response.data || [];
            setRequests(data);
        } catch (err) {
            console.error("❌ Error fetching requests:", err);
            setError("Failed to load team leave requests");
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
            alert("Failed to update leave request");
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
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                {isHR() ? 'All Leave Requests' : 'Team Leave Requests'}
            </Typography>

            {/* Filter Bar */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filter.status || ''}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            label="Status"
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={fetchRequests} size="small">
                        Refresh
                    </Button>
                </Box>
            </Paper>

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
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Request ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Days</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                                    {isHR() && (
                                        <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.RequestID} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {req.EmployeeName || req.Name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {req.EmployeeCode || req.Code}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{req.LeaveName || req.LeaveType}</TableCell>
                                        <TableCell>{new Date(req.StartDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(req.EndDate).toLocaleDateString()}</TableCell>
                                        <TableCell align="center">{req.TotalDays}</TableCell>
                                        <TableCell align="center">{getStatusChip(req.Status)}</TableCell>
                                        {isHR() && req.Status === 'Pending' && (
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        color="success"
                                                        variant="contained"
                                                        onClick={() => setApproveDialog({
                                                            open: true,
                                                            requestId: req.RequestID,
                                                            requestCode: req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`,
                                                            comments: '',
                                                            action: 'Approved'
                                                        })}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        onClick={() => setApproveDialog({
                                                            open: true,
                                                            requestId: req.RequestID,
                                                            requestCode: req.RequestCode || `BGLA-${String(req.RequestID).padStart(6, '0')}`,
                                                            comments: '',
                                                            action: 'Rejected'
                                                        })}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        )}
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
                        label="Comments"
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

export default TeamRequests;