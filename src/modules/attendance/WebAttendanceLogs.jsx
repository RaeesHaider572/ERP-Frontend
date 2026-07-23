import React, {
    useState,
    useEffect,
    useCallback
} from "react";

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
    IconButton,
    Tooltip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Pagination,
    Stack,
    Avatar,
    Collapse
} from "@mui/material";

import {
    Refresh as RefreshIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    Print as PrintIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    FileDownload as FileDownloadIcon,
    Language as LanguageIcon
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext";

import {
    getWebAttendanceLogs,
    getWebAttendanceSummary,
    exportWebAttendanceReport
} from "../../services/webAttendanceLogsService";

import {
    formatDateTime,
    formatDate,
    formatTime
} from "../../utils/dateTimeUtils";

const WebAttendanceLogs = () => {
    const { user } = useAuth();

    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [totalLogs, setTotalLogs] = useState(0);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    const isEmployee =
        user?.Role?.toLowerCase() === "employee";

    const isCustodian =
        user?.Role?.toLowerCase() === "custodian";

    const isHR =
        user?.Role?.toLowerCase() === "hr";

    const today = new Date()
        .toISOString()
        .split("T")[0];

    const [filters, setFilters] = useState({
        startDate: today,
        endDate: today,
        employeeId: "",
        punchType: "",
        status: "",
        page: 1,
        limit: 50
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await getWebAttendanceLogs(filters);

            if (response.status === "success") {
                setLogs(response.data || []);

                setTotalLogs(
                    response.total ??
                    response.data?.length ??
                    0
                );
            } else {
                setError(
                    response.message ||
                    "Failed to fetch web attendance logs"
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to fetch web attendance logs"
            );
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchSummary = useCallback(async () => {
        try {
            const response =
                await getWebAttendanceSummary({
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    employeeId: filters.employeeId
                });

            if (response.status === "success") {
                setSummary(response.data);
            }
        } catch (err) {
            console.error(
                "Error fetching web attendance summary:",
                err
            );
        }
    }, [
        filters.startDate,
        filters.endDate,
        filters.employeeId
    ]);

    useEffect(() => {
        fetchLogs();
        fetchSummary();
    }, [fetchLogs, fetchSummary]);

    const handleFilterChange = event => {
        const { name, value } = event.target;

        setFilters(previous => ({
            ...previous,
            [name]: value,
            page: 1
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: today,
            endDate: today,
            employeeId: "",
            punchType: "",
            status: "",
            page: 1,
            limit: 50
        });
    };

    const handleRefresh = () => {
        fetchLogs();
        fetchSummary();
    };

    const handlePageChange = (event, value) => {
        setFilters(previous => ({
            ...previous,
            page: value
        }));
    };

    const handleRowExpand = requestId => {
        setExpandedRow(
            expandedRow === requestId
                ? null
                : requestId
        );
    };

    const getPunchTypeChip = type => {
        const numericType = Number(type);

        if (numericType === 0) {
            return (
                <Chip
                    label="Check In"
                    color="success"
                    size="small"
                    icon={<CheckIcon />}
                />
            );
        }

        if (numericType === 1) {
            return (
                <Chip
                    label="Check Out"
                    color="warning"
                    size="small"
                    icon={<CloseIcon />}
                />
            );
        }

        return (
            <Chip
                label="Unknown"
                size="small"
            />
        );
    };

    const getStatusChip = status => {
        const normalizedStatus =
            status?.toLowerCase();

        const statusMap = {
            pending: {
                label: "Pending",
                color: "warning"
            },
            approved: {
                label: "Approved",
                color: "success"
            },
            rejected: {
                label: "Rejected",
                color: "error"
            }
        };

        const statusInfo =
            statusMap[normalizedStatus] || {
                label: status || "Unknown",
                color: "default"
            };

        return (
            <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
            />
        );
    };

    const csvValue = value => {
        const cleanValue =
            value === null || value === undefined
                ? ""
                : String(value);

        return `"${cleanValue.replace(/"/g, '""')}"`;
    };

    const handleExport = async () => {
        setExporting(true);

        try {
            const response =
                await exportWebAttendanceReport(filters);

            if (response.status === "success") {
                const headers = [
                    "Request ID",
                    "Employee",
                    "Punch Time",
                    "Punch Type",
                    "Device",
                    "Reason",
                    "Status",
                    "Applied Date",
                    "Created At",
                    "Created By"
                ];

                const csvRows = [headers.join(",")];

                response.data.forEach(log => {
                    const row = [
                        log.RequestID,
                        csvValue(
                            log.employee_name ||
                            `Employee #${log.EmployeeId}`
                        ),
                        csvValue(
                            formatDateTime(log.PunchTime)
                        ),
                        csvValue(
                            Number(log.PunchType) === 0
                                ? "Check In"
                                : "Check Out"
                        ),
                        csvValue(log.DeviceName),
                        csvValue(log.Reason),
                        csvValue(log.Status),
                        csvValue(
                            formatDateTime(log.AppliedDate)
                        ),
                        csvValue(
                            formatDateTime(log.CreatedAt)
                        ),
                        log.CreatedBy
                    ];

                    csvRows.push(row.join(","));
                });

                const csvContent =
                    csvRows.join("\n");

                const blob = new Blob(
                    [csvContent],
                    {
                        type:
                            "text/csv;charset=utf-8;"
                    }
                );

                const url =
                    window.URL.createObjectURL(blob);

                const link =
                    document.createElement("a");

                link.href = url;

                link.download =
                    `web_attendance_logs_${filters.startDate}_to_${filters.endDate}.csv`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            setError(
                "Failed to export web attendance logs"
            );
        } finally {
            setExporting(false);
        }
    };

    const renderSummaryCards = () => {
        if (!summary) return null;

        const cards = [
            {
                label: "Total Requests",
                value: summary.totalRequests || 0
            },
            {
                label: "Check In",
                value: summary.checkInRequests || 0
            },
            {
                label: "Check Out",
                value: summary.checkOutRequests || 0
            },
            {
                label: "Pending",
                value: summary.pendingRequests || 0
            },
            {
                label: "Approved",
                value: summary.approvedRequests || 0
            },
            {
                label: "Rejected",
                value: summary.rejectedRequests || 0
            }
        ];

        return (
            <Grid
                container
                spacing={2}
                sx={{ mb: 3 }}
            >
                {cards.map(card => (
                    <Grid
                        item
                        xs={6}
                        sm={4}
                        md={2}
                        key={card.label}
                    >
                        <Paper
                            sx={{
                                p: 2,
                                textAlign: "center"
                            }}
                        >
                            <Typography variant="h4">
                                {card.value}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="textSecondary"
                            >
                                {card.label}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h4"
                gutterBottom
            >
                Web Attendance Logs
            </Typography>

            <Typography
                variant="subtitle1"
                color="textSecondary"
                gutterBottom
            >
                {isEmployee &&
                    "Your web attendance records"}

                {isCustodian &&
                    "Your team web attendance records"}

                {isHR &&
                    "All employees web attendance records"}
            </Typography>

            {renderSummaryCards()}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid
                    container
                    spacing={2}
                    alignItems="center"
                >
                    <Grid item xs={12} sm={2}>
                        <TextField
                            fullWidth
                            type="date"
                            name="startDate"
                            label="Start Date"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            InputLabelProps={{
                                shrink: true
                            }}
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
                            InputLabelProps={{
                                shrink: true
                            }}
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
                                    startAdornment: (
                                        <PersonIcon
                                            fontSize="small"
                                            sx={{
                                                mr: 1
                                            }}
                                        />
                                    )
                                }}
                            />
                        </Grid>
                    )}

                    <Grid item xs={12} sm={2}>
                        <FormControl
                            fullWidth
                            size="small"
                        >
                            <InputLabel>
                                Punch Type
                            </InputLabel>

                            <Select
                                name="punchType"
                                value={filters.punchType}
                                onChange={handleFilterChange}
                                label="Punch Type"
                            >
                                <MenuItem value="">
                                    All
                                </MenuItem>

                                <MenuItem value="0">
                                    Check In
                                </MenuItem>

                                <MenuItem value="1">
                                    Check Out
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={2}>
                        <FormControl
                            fullWidth
                            size="small"
                        >
                            <InputLabel>
                                Status
                            </InputLabel>

                            <Select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                label="Status"
                            >
                                <MenuItem value="">
                                    All
                                </MenuItem>

                                <MenuItem value="Pending">
                                    Pending
                                </MenuItem>

                                <MenuItem value="Approved">
                                    Approved
                                </MenuItem>

                                <MenuItem value="Rejected">
                                    Rejected
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={2}>
                        <Stack
                            direction="row"
                            spacing={1}
                        >
                            <Button
                                variant="contained"
                                startIcon={
                                    <RefreshIcon />
                                }
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                Refresh
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={
                                    exporting
                                        ? (
                                            <CircularProgress
                                                size={18}
                                            />
                                        )
                                        : (
                                            <FileDownloadIcon />
                                        )
                                }
                                onClick={handleExport}
                                disabled={
                                    logs.length === 0 ||
                                    exporting
                                }
                            >
                                Export
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={
                                    <PrintIcon />
                                }
                                onClick={() =>
                                    window.print()
                                }
                                disabled={
                                    logs.length === 0
                                }
                            >
                                Print
                            </Button>

                            <IconButton
                                onClick={
                                    handleClearFilters
                                }
                                title="Clear Filters"
                            >
                                <ClearIcon />
                            </IconButton>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Employee</TableCell>
                            <TableCell>Punch Time</TableCell>
                            <TableCell>Punch Type</TableCell>
                            <TableCell>Source</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Applied Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    align="center"
                                    sx={{ py: 4 }}
                                >
                                    <CircularProgress />

                                    <Typography sx={{ mt: 2 }}>
                                        Loading web attendance logs...
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    align="center"
                                    sx={{ py: 4 }}
                                >
                                    <Alert severity="error">
                                        {error}
                                    </Alert>
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    align="center"
                                    sx={{ py: 4 }}
                                >
                                    <Typography color="textSecondary">
                                        No web attendance logs found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, index) => (
                                <React.Fragment
                                    key={log.RequestID}
                                >
                                    <TableRow hover>
                                        <TableCell>
                                            {(
                                                (filters.page - 1) *
                                                filters.limit
                                            ) + index + 1}
                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32
                                                    }}
                                                >
                                                    {
                                                        log.employee_name
                                                            ?.charAt(0) ||
                                                        "E"
                                                    }
                                                </Avatar>

                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight="medium"
                                                    >
                                                        {
                                                            log.employee_name ||
                                                            `Employee #${log.EmployeeId}`
                                                        }
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                        display="block"
                                                    >
                                                        {
                                                            log.employee_designation ||
                                                            "No Designation"
                                                        }
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                        display="block"
                                                    >
                                                        {
                                                            log.employee_code ||
                                                            ""
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Tooltip
                                                title={
                                                    formatDateTime(
                                                        log.PunchTime
                                                    )
                                                }
                                            >
                                                <Box>
                                                    <Typography variant="body2">
                                                        {
                                                            formatDate(
                                                                log.PunchTime
                                                            )
                                                        }
                                                    </Typography>

                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                    >
                                                        {
                                                            formatTime(
                                                                log.PunchTime
                                                            )
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell>
                                            {
                                                getPunchTypeChip(
                                                    log.PunchType
                                                )
                                            }
                                        </TableCell>

                                        <TableCell>
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                gap={0.5}
                                            >
                                                <LanguageIcon
                                                    fontSize="small"
                                                />

                                                <Typography variant="body2">
                                                    {
                                                        log.DeviceName ||
                                                        "Web"
                                                    }
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            <Tooltip
                                                title={
                                                    log.Reason ||
                                                    "-"
                                                }
                                            >
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                    sx={{
                                                        maxWidth: 220
                                                    }}
                                                >
                                                    {
                                                        log.Reason ||
                                                        "-"
                                                    }
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell>
                                            {
                                                getStatusChip(
                                                    log.Status
                                                )
                                            }
                                        </TableCell>

                                        <TableCell>
                                            {
                                                log.AppliedDate
                                                    ? formatDateTime(
                                                        log.AppliedDate
                                                    )
                                                    : "-"
                                            }
                                        </TableCell>

                                        <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleRowExpand(
                                                            log.RequestID
                                                        )
                                                    }
                                                >
                                                    {
                                                        expandedRow ===
                                                        log.RequestID
                                                            ? (
                                                                <CancelIcon />
                                                            )
                                                            : (
                                                                <SearchIcon />
                                                            )
                                                    }
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>

                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            sx={{ py: 0 }}
                                        >
                                            <Collapse
                                                in={
                                                    expandedRow ===
                                                    log.RequestID
                                                }
                                                timeout="auto"
                                                unmountOnExit
                                            >
                                                <Box
                                                    sx={{
                                                        p: 2
                                                    }}
                                                >
                                                    <Grid
                                                        container
                                                        spacing={2}
                                                    >
                                                        <Grid
                                                            item
                                                            xs={12}
                                                            sm={3}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                            >
                                                                Request ID
                                                            </Typography>

                                                            <Typography variant="body2">
                                                                {
                                                                    log.RequestID
                                                                }
                                                            </Typography>
                                                        </Grid>

                                                        <Grid
                                                            item
                                                            xs={12}
                                                            sm={3}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                            >
                                                                Employee ID
                                                            </Typography>

                                                            <Typography variant="body2">
                                                                {
                                                                    log.EmployeeId
                                                                }
                                                            </Typography>
                                                        </Grid>

                                                        <Grid
                                                            item
                                                            xs={12}
                                                            sm={3}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                            >
                                                                Created By
                                                            </Typography>

                                                            <Typography variant="body2">
                                                                {
                                                                    log.CreatedBy ||
                                                                    "-"
                                                                }
                                                            </Typography>
                                                        </Grid>

                                                        <Grid
                                                            item
                                                            xs={12}
                                                            sm={3}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                            >
                                                                Created At
                                                            </Typography>

                                                            <Typography variant="body2">
                                                                {
                                                                    formatDateTime(
                                                                        log.CreatedAt
                                                                    )
                                                                }
                                                            </Typography>
                                                        </Grid>

                                                        <Grid
                                                            item
                                                            xs={12}
                                                            sm={3}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                            >
                                                                Updated At
                                                            </Typography>

                                                            <Typography variant="body2">
                                                                {
                                                                    formatDateTime(
                                                                        log.UpdatedAt
                                                                    )
                                                                }
                                                            </Typography>
                                                        </Grid>

                                                        <Grid
                                                            item
                                                            xs={12}
                                                            sm={9}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                            >
                                                                Full Reason
                                                            </Typography>

                                                            <Typography variant="body2">
                                                                {
                                                                    log.Reason ||
                                                                    "-"
                                                                }
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
                <Box
                    sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "center"
                    }}
                >
                    <Pagination
                        count={Math.ceil(
                            totalLogs / filters.limit
                        )}
                        page={filters.page}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Box>
    );
};

export default WebAttendanceLogs;