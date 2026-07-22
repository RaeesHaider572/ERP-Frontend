import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
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
    Button,
    Tooltip,
    IconButton,
    useTheme,
} from "@mui/material";
import {
    AccessTime as AccessTimeIcon,
    Print as PrintIcon,
} from "@mui/icons-material";
import logo from "../../assets/BodlaGroupLogo.svg";

// Import the date/time utilities
import { formatDateTime, formatDate, formatTime } from "../../utils/dateTimeUtils";

const MyAttendanceCorrectionRequests = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [printing, setPrinting] = useState(null);

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

    const getPunchTypeLabel = (type) => {
        return type === 0 ? "IN" : "OUT";
    };

    // ✅ PRINT FUNCTION USING UTILITIES
    const handlePrintRequest = (request) => {
        setPrinting(request.RequestID);
        
        const applicationIdDisplay = request.RequestID || "Pending";

        // Use the utility functions
        const punchDateStr = formatDate(request.PunchTime);
        const punchTimeStr = formatTime(request.PunchTime);
        const appliedDateStr = formatDate(request.AppliedDate);

        // Get the absolute URL
        const baseUrl = window.location.origin;
        const fullLogoUrl = logo.startsWith('http') ? logo : `${baseUrl}${logo}`;

        const printHTML = `
<!DOCTYPE html>
<html>
    <head>
        <title>Attendance Correction - ${applicationIdDisplay}</title>
        <meta charset="utf-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Arial, sans-serif; 
                background: #f0f2f5; 
                padding: 20px; 
                color: #333; 
            }
            @media print {
                @page {
                    margin: 0;
                    size: auto;
                }
                body { 
                    background: white; 
                    margin: 0;
                }
                .print-container { 
                    box-shadow: none; 
                    border-radius: 0; 
                    padding: 40px;
                    margin: 0;
                }
                .no-print { display: none !important; }
                .print-button-container { display: none !important; }
            }
            .print-container { 
                max-width: 210mm; 
                margin: 0 auto; 
                background: white; 
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
                margin-bottom: 16px; 
                padding-bottom: 16px; 
                border-bottom: 1px solid #333; 
                display: flex; 
                flex-wrap: wrap; 
                flex-direction: row; 
            }
            .header .header-logo { width: 100px; height: auto; }
            .header .header-logo img { width: 100%; height: auto; border:0; }
            .header .header-company { 
                width: auto; 
                height: auto; 
                margin: 0 auto; 
                text-align: center; 
                padding-right: 15%; 
            }
            .header .header-company .company-name { 
                font-size: 1rem;
                line-height: 1.5;
                font-weight: 800;
                margin-top: 4px; 
                letter-spacing: 2px; 
            }
            .form-title { 
                font-size: 1.25rem;
                line-height: 1.4;
                color: #1e293b;
                font-weight: 600;
                margin-top: 4px;
            }
            .header .app-info { 
                display: flex; 
                flex-wrap: wrap; 
                flex-direction: row; 
                align-items: center; 
                justify-content: space-between; 
                width: 100%; 
                margin-top: 0.5rem; 
                font-size: 0.875rem; 
                gap: 1rem; 
            }
            .section { margin-bottom: 10px; display: flex; flex-wrap: wrap; flex-direction: row; }
            .section-title { 
                font-size: 16px; 
                font-weight: 700; 
                margin-bottom: 15px; 
                padding-bottom: 8px; 
                border-bottom: 1px solid #ddd; 
                width: 100%; 
            }
            .info-grid { 
                display: flex; 
                gap: 16px; 
                margin-bottom: 20px; 
                width: 100%; 
            }
            .info-item { margin-bottom: 8px; flex: 1; min-width: 0; }
            .info-label { font-size: 11px; color: #777; margin-bottom: 4px; }
            .info-value { 
                font-size: 14px; 
                font-weight: 400; 
                padding-bottom: 6px; 
                border-bottom: 1px solid #eee; 
            }
            .info-value.highlight { font-weight: 700; }
            .details-grid { 
                display: flex; 
                gap: 16px; 
                width: 100%; 
                flex-wrap: wrap; 
            }
            .details-grid .info-item{ flex: 1; min-width: 0; }
            .reason-box { 
                padding: 12px; 
                border: 1px solid #eee; 
                border-radius: 4px; 
                min-height: 80px; 
                line-height: 1.6; 
                width: 100%; 
                background: #ffffff; 
                margin-top: 4px;
            }
            .approval-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 16px; 
                margin-top: 200px; 
                padding-bottom: 16px; 
                border-bottom: 2px solid #ddd; 
            }
            .approval-title { font-size: 16px; font-weight: 700; }
            .prepared-by { font-size: 16px;}
            .signature-header { 
                display: flex; 
                justify-content: space-between; 
                margin-top: 150px; 
                width: 100%;
            }
            .signature-box { 
                text-align: center; 
                flex: 1;
                margin: 0 10px;
            }
            .signature-line { 
                border-top: 1px solid #000; 
                padding-top: 8px; 
                margin-top: 4px; 
                font-size: 12px; 
            }
            .print-button-container {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
            .print-btn {
                background: linear-gradient(135deg, #475569 0%, #475569 100%);
                color: white;
                border: none;
                padding: 12px 40px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 0 10px;
            }
            .print-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }
            .close-btn {
                background: rgba(71, 85, 105, 0.5);
                color: #475569;
                border: 1px solid rgba(71, 85, 105, 0.5);
                border: none;
                padding: 12px 40px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 0 10px;
            }
            .close-btn:hover {
                background: #cbd5e1;
            }
        </style>
    </head>
    <body>
        <div class="print-container">
            <div class="header">
                <div class="header-logo">
                    <img src="${fullLogoUrl}" alt="Bodla Group" style="width:100px;height:auto;" />
                </div>
                <div class="header-company">
                    <div class="company-name">BODLA GROUP</div>
                    <div class="form-title">Attendance Correction Request</div>
                </div>
                <div class="app-info">
                    <span><strong>Request ID:</strong>  BGAC-${applicationIdDisplay}</span>
                    <span><strong>Application Date:</strong> ${appliedDateStr}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Employee Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Employee Code</div>
                        <div class="info-value">${request.EmployeeCode || "—"}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Employee Name</div>
                        <div class="info-value">${request.EmployeeName || "—"}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Designation</div>
                        <div class="info-value">${request.Designation || "—"}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Department</div>
                        <div class="info-value">${request.Department || "—"}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Correction Details</div>
                <div class="details-grid">
                    <div class="info-item">
                        <div class="info-label">Punch Date</div>
                        <div class="info-value highlight">${punchDateStr}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Punch Time</div>
                        <div class="info-value highlight">${punchTimeStr}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Punch Type</div>
                        <div class="info-value highlight">${getPunchTypeLabel(request.PunchType)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Device Name</div>
                        <div class="info-value">${request.DeviceName || "Web"}</div>
                    </div>
                </div>
                <div style="width: 100%; margin-top: 12px;">
                    <div class="info-label">Reason for Correction</div>
                    <div class="reason-box">${request.Reason || "—"}</div>
                </div>
            </div>

            <div class="approval-header">
                <div class="approval-title">Approval Information</div>
                <div class="prepared-by"><strong>Prepared By:</strong> ${request.EmployeeName || "—"}</div>
            </div>

            <div class="signature-header">
                <div class="signature-box">
                    <div class="signature-line">Employee</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Reporting Manager</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Department Head</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">HR</div>
                </div>
            </div>
            
            <div class="print-button-container no-print">
                <button class="close-btn" onclick="window.close()">✕ Close</button>
                <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            </div>
        </div>
        
        <script>    
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                    e.preventDefault();
                    window.print();
                }
            });
        <\/script>
    </body>
</html>`;

        const printBlob = new Blob([printHTML], {
            type: "text/html;charset=utf-8"
        });

        const printUrl = URL.createObjectURL(printBlob);

        const printLink = document.createElement("a");
        printLink.href = printUrl;
        printLink.target = "_blank";
        printLink.rel = "noopener noreferrer";
        printLink.style.display = "none";

        document.body.appendChild(printLink);
        printLink.click();
        printLink.remove();

        window.setTimeout(() => {
            URL.revokeObjectURL(printUrl);
        }, 5 * 60 * 1000);

        setPrinting(null);
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
                                <TableCell align="center">Action</TableCell>
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
                                    <TableCell align="center">
                                        <Tooltip title="Print this request">
                                            <IconButton
                                                size="small"
                                                onClick={() => handlePrintRequest(req)}
                                                disabled={printing === req.RequestID}
                                                sx={{
                                                    color: theme.palette.primary.main,
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.primary.light,
                                                    }
                                                }}
                                            >
                                                {printing === req.RequestID ? (
                                                    <CircularProgress size={20} />
                                                ) : (
                                                    <PrintIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
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