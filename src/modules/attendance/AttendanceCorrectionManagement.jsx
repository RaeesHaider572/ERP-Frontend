import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
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
    Card,
    CardContent,
} from "@mui/material";
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import {
    getAllCorrectionRequests,
    updateCorrectionStatus,
    getCorrectionStats,
} from "../../services/attendanceCorrectionService";

const AttendanceCorrectionManagement = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [actionType, setActionType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    useEffect(() => {
        fetchRequests();
        fetchStats();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (filterStatus) filters.status = filterStatus;
            const response = await getAllCorrectionRequests(filters);
            setRequests(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await getCorrectionStats();
            setStats(response.data || {});
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const handleAction = (request, action) => {
        setSelectedRequest(request);
        setActionType(action);
        setDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedRequest) return;
        
        try {
            await updateCorrectionStatus(selectedRequest.RequestID, actionType);
            setDialogOpen(false);
            setSelectedRequest(null);
            fetchRequests();
            fetchStats();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update status");
        }
    };

    const getStatusChip = (status) => {
        const colors = {
            Pending: "warning",
            Approved: "success",
            Rejected: "error",
        };
        return <Chip label={status} color={colors[status] || "default"} size="small" />;
    };

    const getPunchTypeChip = (type) => {
        return (
            <Chip 
                label={type === 0 ? "IN" : "OUT"} 
                size="small"
                color={type === 0 ? "primary" : "secondary"}
            />
        );
    };

    const formatDateTime = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Attendance Correction Management
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Requests
                            </Typography>
                            <Typography variant="h4">{stats.totalRequests || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Pending
                            </Typography>
                            <Typography variant="h4" color="warning.main">{stats.pendingRequests || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Approved
                            </Typography>
                            <Typography variant="h4" color="success.main">{stats.approvedRequests || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Rejected
                            </Typography>
                            <Typography variant="h4" color="error.main">{stats.rejectedRequests || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filter and Refresh */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Filter by Status</InputLabel>
                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        label="Filter by Status"
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Approved">Approved</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => { fetchRequests(); fetchStats(); }}
                >
                    Refresh
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {requests.length === 0 ? (
                <Alert severity="info">No attendance correction requests found.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                <TableCell>Request ID</TableCell>
                                <TableCell>Employee</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Punch Date/Time</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Device</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Applied Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.RequestID}>
                                    <TableCell>#{req.RequestID}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {req.EmployeeName}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {req.EmployeeCode}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{req.Department}</TableCell>
                                    <TableCell>{formatDateTime(req.PunchTime)}</TableCell>
                                    <TableCell>{getPunchTypeChip(req.PunchType)}</TableCell>
                                    <TableCell>{req.DeviceName || "Web"}</TableCell>
                                    <TableCell>{getStatusChip(req.Status)}</TableCell>
                                    <TableCell>{formatDateTime(req.AppliedDate)}</TableCell>
                                    <TableCell>
                                        {req.Status === "Pending" && (
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    color="success"
                                                    variant="contained"
                                                    startIcon={<ApproveIcon />}
                                                    onClick={() => handleAction(req, "Approved")}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    variant="contained"
                                                    startIcon={<RejectIcon />}
                                                    onClick={() => handleAction(req, "Rejected")}
                                                >
                                                    Reject
                                                </Button>
                                            </Box>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Confirm Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>
                    Confirm {actionType === "Approved" ? "Approval" : "Rejection"}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to {actionType.toLowerCase()} this attendance correction request?
                    </Typography>
                    {selectedRequest && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>Employee:</strong> {selectedRequest.EmployeeName}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Date/Time:</strong> {formatDateTime(selectedRequest.PunchTime)}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Type:</strong> {selectedRequest.PunchType === 0 ? "IN" : "OUT"}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Reason:</strong> {selectedRequest.Reason || "—"}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleConfirmAction}
                        variant="contained"
                        color={actionType === "Approved" ? "success" : "error"}
                    >
                        Confirm {actionType === "Approved" ? "Approval" : "Rejection"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AttendanceCorrectionManagement;