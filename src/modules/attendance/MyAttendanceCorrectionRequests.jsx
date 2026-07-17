import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getEmployeeCorrectionRequests } from "../../services/attendanceCorrectionService";
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
    Card,
    CardContent,
    Grid,
} from "@mui/material";
import { AccessTime as AccessTimeIcon } from "@mui/icons-material";

const MyAttendanceCorrectionRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const fetchRequests = async () => {
        if (!user?.EmployeeID) return;
        setLoading(true);
        try {
            const response = await getEmployeeCorrectionRequests(user.EmployeeID);
            setRequests(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch requests");
        } finally {
            setLoading(false);
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

    // Stats
    const totalRequests = requests.length;
    const pendingRequests = requests.filter(r => r.Status === 'Pending').length;
    const approvedRequests = requests.filter(r => r.Status === 'Approved').length;
    const rejectedRequests = requests.filter(r => r.Status === 'Rejected').length;

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                My Attendance Correction Requests
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total
                            </Typography>
                            <Typography variant="h4">{totalRequests}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Pending
                            </Typography>
                            <Typography variant="h4" color="warning.main">{pendingRequests}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Approved
                            </Typography>
                            <Typography variant="h4" color="success.main">{approvedRequests}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Rejected
                            </Typography>
                            <Typography variant="h4" color="error.main">{rejectedRequests}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {requests.length === 0 ? (
                <Alert severity="info">
                    No attendance correction requests found. 
                    <a href="/attendance-correction/apply" style={{ marginLeft: 8 }}>
                        Apply for correction
                    </a>
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                <TableCell>Request ID</TableCell>
                                <TableCell>Punch Date/Time</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Device</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Applied Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.RequestID}>
                                    <TableCell>#{req.RequestID}</TableCell>
                                    <TableCell>{formatDateTime(req.PunchTime)}</TableCell>
                                    <TableCell>{getPunchTypeChip(req.PunchType)}</TableCell>
                                    <TableCell>{req.DeviceName || "Web"}</TableCell>
                                    <TableCell>{getStatusChip(req.Status)}</TableCell>
                                    <TableCell>{formatDateTime(req.AppliedDate)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Container>
    );
};

export default MyAttendanceCorrectionRequests;