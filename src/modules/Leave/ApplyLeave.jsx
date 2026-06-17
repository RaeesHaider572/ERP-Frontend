import React, { useState, useEffect, useRef, useCallback } from "react";
import { applyLeave } from "../../services/leaveService";
import api from "../../services/authService";
import {
    Container, Typography, TextField, Button, Grid, Stack, Box,
    Alert, Snackbar, FormControl, InputLabel, Select, MenuItem,
    Divider, Paper, useTheme, Table, TableBody, TableCell,
    TableContainer, TableRow, TableHead, CircularProgress,
    Autocomplete,
} from "@mui/material";
import {
    EventNote as EventNoteIcon, Send as SendIcon,
    RestartAlt as RestartAltIcon, Print as PrintIcon,
} from "@mui/icons-material";
import logo from "../../assets/BodlaGroupLogo.svg";

const LeaveApplicationForm = () => {
    const theme = useTheme();
    const printRef = useRef();
    const debounceTimer = useRef(null);

    const generateAppId = () => `LVE-${Date.now().toString().slice(-8)}`;
    const getTodayDate = () => new Date().toISOString().split("T")[0];

    // ── Dynamic leave types loaded from DB ──────────────────────
    const [leaveTypeOptions, setLeaveTypeOptions] = useState([]);

    // ── Employee search autocomplete ─────────────────────────────
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // ── Leave balances keyed by LeaveTypeID ──────────────────────
    // { [LeaveTypeID]: { opening, used, remaining } }
    const [leaveBalances, setLeaveBalances] = useState({});

    const initialState = {
        employeeCode: "",
        employeeName: "",
        designation: "",
        department: "",
        preparedBy: "",
        applicationId: generateAppId(),
        applicationDate: getTodayDate(),
        leaveTypeId: "",          // numeric ID from DB
        leaveTypeName: "",        // display name
        paidStatus: "Paid",
        startDate: "",
        endDate: "",
        totalDays: "",
        reason: "",
    };

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingEmployee, setFetchingEmployee] = useState(false);

    // ============================================================
    // LOAD LEAVE TYPES FROM DB ON MOUNT
    // ============================================================
    useEffect(() => {
        const loadLeaveTypes = async () => {
            try {
                const res = await api.get("/leave/types");
                const types = res.data?.data || res.data || [];
                setLeaveTypeOptions(types.filter((t) => t.IsActive));
                // Set default leaveTypeId to first active type
                if (types.length > 0) {
                    const first = types.find((t) => t.IsActive) || types[0];
                    setFormData((prev) => ({
                        ...prev,
                        leaveTypeId: first.LeaveTypeID,
                        leaveTypeName: first.LeaveName,
                        paidStatus: first.IsPaid ? "Paid" : "Unpaid",
                    }));
                }
            } catch (err) {
                console.error("Failed to load leave types:", err);
            }
        };
        loadLeaveTypes();
    }, []);

    // ============================================================
    // CALCULATE TOTAL DAYS
    // ============================================================
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end >= start) {
                const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
                setFormData((prev) => ({ ...prev, totalDays: diff.toString() }));
            } else {
                setFormData((prev) => ({ ...prev, totalDays: "" }));
            }
        } else {
            setFormData((prev) => ({ ...prev, totalDays: "" }));
        }
    }, [formData.startDate, formData.endDate]);

    // ============================================================
    // FETCH LEAVE BALANCES FOR EMPLOYEE
    // ============================================================
    const fetchLeaveBalances = async (employeeId) => {
        try {
            const res = await api.get(`/leave/balances/employee/${employeeId}`);
            const balances = res.data?.data || res.data || [];
            console.log("Raw balances from API:", balances);

            // Key by LeaveTypeID for fast lookup
            const map = {};
            balances.forEach((b) => {
                map[b.LeaveTypeID] = {
                    opening: b.TotalAllowed ?? 0,
                    used: b.UsedDays ?? 0,
                    remaining: b.RemainingDays ?? (b.TotalAllowed - b.UsedDays) ?? 0,
                    leaveName: b.LeaveName || "",
                };
            });
            console.log("Balance map by LeaveTypeID:", map);
            setLeaveBalances(map);
        } catch (err) {
            console.error("Error fetching leave balances:", err);
            setLeaveBalances({});
        }
    };

    // ============================================================
    // POPULATE FORM FROM EMPLOYEE OBJECT
    // ============================================================
    const populateEmployee = useCallback(async (emp) => {
        if (!emp) {
            setSelectedEmployee(null);
            setLeaveBalances({});
            setFormData((prev) => ({
                ...prev,
                employeeCode: "",
                employeeName: "",
                designation: "",
                department: "",
            }));
            return;
        }
        setSelectedEmployee(emp);
        setFormData((prev) => ({
            ...prev,
            employeeCode: emp.EmployeeCode || "",
            employeeName: emp.Name || "",
            designation: emp.Designation || "",
            department: emp.Department || "",
        }));
        if (emp.EmployeeID) {
            await fetchLeaveBalances(emp.EmployeeID);
        }
        setSnackbar({
            open: true,
            message: `Employee "${emp.Name}" loaded`,
            severity: "success",
        });
    }, []);

    // ============================================================
    // SEARCH EMPLOYEES (by code OR name)
    // ============================================================
    const searchEmployees = useCallback(async (query) => {
        const q = query?.trim();
        if (!q || q.length < 2) {
            setEmployeeOptions([]);
            return;
        }
        setEmployeeSearchLoading(true);
        try {
            // Search endpoint returns matches by name OR code
            const res = await api.get(`/employees/search?q=${encodeURIComponent(q)}`);
            const list = res.data?.data || res.data || [];
            setEmployeeOptions(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Employee search error:", err);
            setEmployeeOptions([]);
        } finally {
            setEmployeeSearchLoading(false);
        }
    }, []);

    // ============================================================
    // FETCH EMPLOYEE BY EXACT CODE (on blur / direct entry)
    // ============================================================
    const fetchByCode = useCallback(async (code) => {
        const trimmed = code?.trim();
        if (!trimmed) return;
        setFetchingEmployee(true);
        try {
            const res = await api.get(`/employees/code/${encodeURIComponent(trimmed)}`);
            const emp = res.data?.data ?? res.data;
            if (emp && emp.EmployeeID) {
                await populateEmployee(emp);
            } else {
                setSnackbar({ open: true, message: `No employee found for code "${trimmed}"`, severity: "error" });
            }
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || "Employee not found",
                severity: "error",
            });
        } finally {
            setFetchingEmployee(false);
        }
    }, [populateEmployee]);

    // ============================================================
    // HANDLE LEAVE TYPE CHANGE
    // ============================================================
    const handleLeaveTypeChange = (e) => {
        const id = Number(e.target.value);
        const lt = leaveTypeOptions.find((t) => t.LeaveTypeID === id);
        setFormData((prev) => ({
            ...prev,
            leaveTypeId: id,
            leaveTypeName: lt?.LeaveName || "",
            paidStatus: lt ? (lt.IsPaid ? "Paid" : "Unpaid") : prev.paidStatus,
        }));
    };

    // ============================================================
    // HELPERS: get balance for the currently selected leave type
    // ============================================================
    const getBalanceForType = (leaveTypeId) => {
        return leaveBalances[leaveTypeId] || { opening: 0, used: 0, remaining: 0 };
    };

    // For the selected leave type only – closing = remaining - appliedDays
    const selectedBalance = getBalanceForType(formData.leaveTypeId);
    const appliedDays = parseFloat(formData.totalDays) || 0;
    const closingBalance = Math.max(0, selectedBalance.remaining - appliedDays);

    // ============================================================
    // VALIDATE & SUBMIT
    // ============================================================
    const validateForm = () => {
        const e = {};
        if (!formData.employeeCode) e.employeeCode = "Required";
        if (!formData.employeeName) e.employeeName = "Required";
        if (!formData.designation) e.designation = "Required";
        if (!formData.department) e.department = "Required";
        if (!formData.preparedBy) e.preparedBy = "Required";
        if (!formData.leaveTypeId) e.leaveTypeId = "Select a leave type";
        if (!formData.startDate) e.startDate = "Required";
        if (!formData.endDate) e.endDate = "Required";
        if (!formData.reason) e.reason = "Required";
        if (formData.startDate && formData.endDate &&
            new Date(formData.startDate) > new Date(formData.endDate)) {
            e.endDate = "End date must be after start date";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setSnackbar({ open: true, message: "Please fill all required fields", severity: "error" });
            return;
        }
        if (!selectedEmployee?.EmployeeID) {
            setSnackbar({ open: true, message: "Please select a valid employee", severity: "error" });
            return;
        }

        setLoading(true);
        try {
            // Send numeric IDs that the backend expects
            const payload = {
                EmployeeID: selectedEmployee.EmployeeID,
                LeaveTypeID: formData.leaveTypeId,
                StartDate: formData.startDate,
                EndDate: formData.endDate,
                Reason: formData.reason,
                // Extra display fields (stored if backend supports)
                PreparedBy: formData.preparedBy,
                PaidStatus: formData.paidStatus,
                ApplicationID: formData.applicationId,
            };
            console.log("Submitting leave payload:", payload);
            await applyLeave(payload);

            setSnackbar({ open: true, message: "Leave application submitted successfully!", severity: "success" });
            setTimeout(() => setShowPrintPreview(true), 1000);
        } catch (err) {
            console.error("Submit error:", err);
            setSnackbar({
                open: true,
                message: err.response?.data?.message || "Failed to submit leave application",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // RESET
    // ============================================================
    const handleReset = () => {
        clearTimeout(debounceTimer.current);
        setSelectedEmployee(null);
        setLeaveBalances({});
        setEmployeeOptions([]);
        const first = leaveTypeOptions.find((t) => t.IsActive) || leaveTypeOptions[0];
        setFormData({
            ...initialState,
            applicationId: generateAppId(),
            applicationDate: getTodayDate(),
            leaveTypeId: first?.LeaveTypeID || "",
            leaveTypeName: first?.LeaveName || "",
            paidStatus: first?.IsPaid ? "Paid" : "Unpaid",
        });
        setErrors({});
        setShowPrintPreview(false);
    };

    // ============================================================
    // UTILS
    // ============================================================
    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    // ============================================================
    // SUB-COMPONENTS
    // ============================================================
    const SectionHeader = ({ title }) => (
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>
            {title}
        </Typography>
    );

    const SignatureBlock = () => (
        <Grid container spacing={3} sx={{ mt: 6 }}>
            {["Employee", "Reporting Manager", "Department Head", "HR"].map((role) => (
                <Grid item size={{ xs: 6, sm: 3 }} key={role}>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold", pt: 3, borderTop: "2px solid #ddd" }}>{role}</Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

    // ── Leave Balance Table – shows ALL leave types with their balances ──
    const LeaveBalanceTable = ({ editable = false }) => (
        <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "none" }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <TableCell><strong>Leave Type</strong></TableCell>
                        <TableCell align="right"><strong>Opening Balance</strong></TableCell>
                        <TableCell align="right"><strong>Applied Days</strong></TableCell>
                        <TableCell align="right"><strong>Closing Balance</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {leaveTypeOptions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 2 }}>
                                {selectedEmployee ? "No leave types configured" : "Enter employee code to load balances"}
                            </TableCell>
                        </TableRow>
                    ) : (
                        leaveTypeOptions.map((lt, i) => {
                            const bal = getBalanceForType(lt.LeaveTypeID);
                            const isActive = formData.leaveTypeId === lt.LeaveTypeID;
                            const rowApplied = isActive ? appliedDays : 0;
                            // closing = remaining - applied (only for the selected type row)
                            const rowClosing = isActive
                                ? Math.max(0, bal.remaining - rowApplied)
                                : bal.remaining;

                            return (
                                <TableRow
                                    key={lt.LeaveTypeID}
                                    sx={{
                                        bgcolor: i % 2 === 0 ? "#fff" : "#fafafa",
                                        ...(isActive && {
                                            bgcolor: `${theme.palette.primary.main}15`,
                                            "& td": { fontWeight: "bold" },
                                        }),
                                    }}
                                >
                                    <TableCell>{lt.LeaveName}</TableCell>
                                    <TableCell align="right">
                                        {/* Show fetched balance, or 0 if not loaded yet */}
                                        {selectedEmployee
                                            ? (bal.opening ?? 0)
                                            : <span style={{ color: "#bbb" }}>—</span>}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: isActive ? theme.palette.primary.main : "inherit" }}>
                                        {rowApplied}
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        fontWeight: "bold",
                                        color: rowClosing < 0
                                            ? "error.main"
                                            : isActive ? theme.palette.success.main : "inherit",
                                    }}>
                                        {selectedEmployee ? rowClosing : <span style={{ color: "#bbb" }}>—</span>}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    // ============================================================
    // PRINT
    // ============================================================
    const handlePrint = () => {
        const printWindow = window.open("", "_blank");

        const balanceRows = leaveTypeOptions.map((lt) => {
            const bal = getBalanceForType(lt.LeaveTypeID);
            const isActive = formData.leaveTypeId === lt.LeaveTypeID;
            const rowApplied = isActive ? appliedDays : 0;
            const rowClosing = isActive ? Math.max(0, bal.remaining - rowApplied) : bal.remaining;
            return `
                <tr class="${isActive ? "highlight" : ""}">
                    <td>${lt.LeaveName}</td>
                    <td class="right">${bal.opening ?? 0}</td>
                    <td class="right"><strong>${rowApplied}</strong></td>
                    <td class="right"><strong>${rowClosing}</strong></td>
                </tr>`;
        }).join("");

        const printHTML = `<!DOCTYPE html><html><head>
            <title>Leave Application - ${formData.applicationId}</title>
            <style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;padding:40px;color:#333}
                .print-container{max-width:210mm;margin:0 auto}
                .header{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #333;display:flex;flex-wrap:wrap}
                .header-logo{width:100px}.header-logo img{width:100%;border:0}
                .header-company{flex:1;text-align:center}
                .company-name{font-size:20px;font-weight:800;letter-spacing:2px}
                .form-title{font-size:24px;font-weight:600;margin-top:8px}
                .app-info{display:flex;justify-content:space-between;width:100%;margin-top:0.5rem;font-size:0.875rem}
                .section{margin-bottom:16px}
                .section-title{font-size:16px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #ddd}
                .info-grid{display:flex;gap:16px;margin-bottom:16px}
                .info-item{flex:1;min-width:0}
                .info-label{font-size:11px;color:#777;margin-bottom:4px}
                .info-value{font-size:14px;font-weight:500;padding-bottom:6px;border-bottom:1px solid #eee}
                .info-value.highlight{font-weight:700}
                .reason-box{padding:12px;border:1px solid #eee;border-radius:4px;min-height:80px;line-height:1.6}
                .balance-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}
                .balance-table th,.balance-table td{border:1px solid #ddd;padding:10px 12px;text-align:left}
                .balance-table th{background:#f5f5f5;font-weight:700}
                .balance-table td.right,.balance-table th.right{text-align:right}
                .balance-table tr.highlight{background:#e3f2fd}
                .balance-table tr.highlight td{font-weight:700}
                .approval-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:2px solid #ddd}
                .signature-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:120px}
                .signature-box{text-align:center}
                .signature-line{border-top:1px solid #000;padding-top:8px;margin-top:4px;font-size:12px}
                @media print{body{padding:15mm}@page{size:A4;margin:0}}
            </style></head><body>
            <div class="print-container">
                <div class="header">
                    <div class="header-logo"><img src="${logo}" alt="Bodla Group" /></div>
                    <div class="header-company">
                        <div class="company-name">BODLA GROUP</div>
                        <div class="form-title">Leave Application Form</div>
                    </div>
                    <div class="app-info">
                        <span><strong>Application ID:</strong> ${formData.applicationId}</span>
                        <span><strong>Date:</strong> ${formatDate(formData.applicationDate)}</span>
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Employee Information</div>
                    <div class="info-grid">
                        <div class="info-item"><div class="info-label">Employee Code</div><div class="info-value">${formData.employeeCode || "—"}</div></div>
                        <div class="info-item"><div class="info-label">Employee Name</div><div class="info-value">${formData.employeeName || "—"}</div></div>
                        <div class="info-item"><div class="info-label">Designation</div><div class="info-value">${formData.designation || "—"}</div></div>
                        <div class="info-item"><div class="info-label">Department</div><div class="info-value">${formData.department || "—"}</div></div>
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Leave Details</div>
                    <div class="info-grid">
                        <div class="info-item"><div class="info-label">Leave Type</div><div class="info-value highlight">${formData.leaveTypeName || "—"}</div></div>
                        <div class="info-item"><div class="info-label">Paid / Unpaid</div><div class="info-value">${formData.paidStatus}</div></div>
                        <div class="info-item"><div class="info-label">From</div><div class="info-value highlight">${formatDate(formData.startDate)}</div></div>
                        <div class="info-item"><div class="info-label">To</div><div class="info-value highlight">${formatDate(formData.endDate)}</div></div>
                        <div class="info-item"><div class="info-label">Total Days</div><div class="info-value highlight">${formData.totalDays || "0"} day${formData.totalDays !== "1" ? "s" : ""}</div></div>
                    </div>
                    <div style="margin-bottom:16px">
                        <div class="info-label">Reason for Leave</div>
                        <div class="reason-box">${formData.reason || "—"}</div>
                    </div>
                </div>
                <div class="section">
                    <div class="section-title">Leave Balance Summary</div>
                    <table class="balance-table">
                        <thead><tr><th>Leave Type</th><th class="right">Opening Balance</th><th class="right">Applied Days</th><th class="right">Closing Balance</th></tr></thead>
                        <tbody>${balanceRows}</tbody>
                    </table>
                </div>
                <div class="approval-header">
                    <div style="font-size:16px;font-weight:700">Approval Information</div>
                    <div><strong>Prepared By:</strong> ${formData.preparedBy || "—"}</div>
                </div>
                <div class="signature-grid">
                    <div class="signature-box"><div class="signature-line">Employee</div></div>
                    <div class="signature-box"><div class="signature-line">Reporting Manager</div></div>
                    <div class="signature-box"><div class="signature-line">Department Head</div></div>
                    <div class="signature-box"><div class="signature-line">HR</div></div>
                </div>
            </div>
            <script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}</script>
            </body></html>`;

        printWindow.document.write(printHTML);
        printWindow.document.close();
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header Banner */}
            <Paper elevation={0} sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                borderRadius: 2, p: 3, mb: 3, color: "white",
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <EventNoteIcon sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="bold">Leave Application Form</Typography>
                            <Typography sx={{ opacity: 0.9, fontSize: 14 }}>
                                Search by employee name or code to auto-fill
                            </Typography>
                        </Box>
                    </Stack>
                    {showPrintPreview && (
                        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}
                            sx={{ bgcolor: "white", color: theme.palette.primary.main, "&:hover": { bgcolor: "#f5f5f5" } }}>
                            Print Application
                        </Button>
                    )}
                </Stack>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>

            {!showPrintPreview ? (
                <Box sx={{ bgcolor: "white", p: { xs: 3, md: "72px" }, maxWidth: "21cm", mx: "auto", boxShadow: 3 }}>

                    {/* Company Header */}
                    <Box sx={{ mb: 4, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item size={{ xs: 12, md: 2 }}>
                                <Box component="img" src={logo} alt="Bodla Group"
                                    sx={{ height: 80, width: "auto", objectFit: "contain", display: "block", mx: { xs: "auto", md: 0 } }} />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 10 }}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>BODLA GROUP</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>Leave Application Form</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2"><strong>Application ID:</strong> {formData.applicationId}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
                                <Typography variant="body2"><strong>Application Date:</strong> {formatDate(formData.applicationDate)}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* ── EMPLOYEE INFORMATION ── */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Employee Information" />
                        <Grid container spacing={1.5}>

                            {/* Employee search – name OR code */}
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <Autocomplete
                                    freeSolo
                                    options={employeeOptions}
                                    getOptionLabel={(opt) =>
                                        typeof opt === "string" ? opt : `${opt.EmployeeCode} – ${opt.Name}`
                                    }
                                    loading={employeeSearchLoading}
                                    value={selectedEmployee}
                                    onChange={async (_, newVal) => {
                                        if (newVal && typeof newVal === "object") {
                                            setFetchingEmployee(true);
                                            await populateEmployee(newVal);
                                            setFetchingEmployee(false);
                                        } else if (!newVal) {
                                            populateEmployee(null);
                                        }
                                    }}
                                    onInputChange={(_, value, reason) => {
                                        if (reason === "input") {
                                            setFormData((prev) => ({ ...prev, employeeCode: value }));
                                            clearTimeout(debounceTimer.current);
                                            debounceTimer.current = setTimeout(() => {
                                                // If it looks like a full code, try direct lookup first
                                                if (/^EMP\d+$/i.test(value.trim())) {
                                                    fetchByCode(value.trim());
                                                } else {
                                                    searchEmployees(value);
                                                }
                                            }, 500);
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Employee Code / Name"
                                            required
                                            error={!!errors.employeeCode}
                                            helperText={
                                                errors.employeeCode ||
                                                (fetchingEmployee ? "Loading…" : "Type name or code")
                                            }
                                            size="small"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {(employeeSearchLoading || fetchingEmployee) &&
                                                            <CircularProgress size={14} sx={{ mr: 1 }} />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Read-only auto-filled fields */}
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField fullWidth label="Employee Name" value={formData.employeeName}
                                    required error={!!errors.employeeName} helperText={errors.employeeName}
                                    size="small" InputProps={{ readOnly: true }}
                                    sx={{ "& input": { bgcolor: "#f9f9f9" } }} />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField fullWidth label="Designation" value={formData.designation}
                                    required error={!!errors.designation} helperText={errors.designation}
                                    size="small" InputProps={{ readOnly: true }}
                                    sx={{ "& input": { bgcolor: "#f9f9f9" } }} />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField fullWidth label="Department" value={formData.department}
                                    required error={!!errors.department} helperText={errors.department}
                                    size="small" InputProps={{ readOnly: true }}
                                    sx={{ "& input": { bgcolor: "#f9f9f9" } }} />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* ── LEAVE DETAILS ── */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Details" />
                        <Grid container spacing={1.5}>
                            {/* Leave Type – dynamic from DB */}
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small" error={!!errors.leaveTypeId}>
                                    <InputLabel>Leave Type *</InputLabel>
                                    <Select value={formData.leaveTypeId || ""} onChange={handleLeaveTypeChange} label="Leave Type *">
                                        {leaveTypeOptions.map((lt) => (
                                            <MenuItem key={lt.LeaveTypeID} value={lt.LeaveTypeID}>
                                                {lt.LeaveName}
                                                {selectedEmployee && leaveBalances[lt.LeaveTypeID] !== undefined && (
                                                    <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
                                                        ({leaveBalances[lt.LeaveTypeID]?.remaining ?? 0} left)
                                                    </Typography>
                                                )}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.leaveTypeId && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {errors.leaveTypeId}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Paid/Unpaid</InputLabel>
                                    <Select value={formData.paidStatus}
                                        onChange={(e) => setFormData((p) => ({ ...p, paidStatus: e.target.value }))}
                                        label="Paid/Unpaid">
                                        <MenuItem value="Paid">Paid</MenuItem>
                                        <MenuItem value="Unpaid">Unpaid</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField fullWidth label="Start Date" type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                                    required error={!!errors.startDate} helperText={errors.startDate}
                                    size="small" InputLabelProps={{ shrink: true }} />
                            </Grid>

                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField fullWidth label="End Date" type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                                    required error={!!errors.endDate} helperText={errors.endDate}
                                    size="small" InputLabelProps={{ shrink: true }} />
                            </Grid>

                            <Grid item size={{ xs: 12, sm: 6, md: 1 }}>
                                <TextField fullWidth label="Days"
                                    value={formData.totalDays}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    sx={{ "& input": { bgcolor: "#f9f9f9", textAlign: "center", fontWeight: "bold" } }} />
                            </Grid>

                            <Grid item size={12}>
                                <TextField fullWidth label="Reason for Leave"
                                    value={formData.reason}
                                    onChange={(e) => {
                                        setFormData((p) => ({ ...p, reason: e.target.value }));
                                        if (errors.reason) setErrors((e) => { const n = { ...e }; delete n.reason; return n; });
                                    }}
                                    required error={!!errors.reason} helperText={errors.reason}
                                    multiline rows={3}
                                    placeholder="Please provide a detailed reason for leave..." />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* ── LEAVE BALANCE SUMMARY ── */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Balance Summary" />

                        {/* Quick summary card for selected leave type */}
                        {selectedEmployee && formData.leaveTypeId && (
                            <Box sx={{
                                display: "flex", gap: 2, mb: 2, p: 1.5,
                                bgcolor: `${theme.palette.primary.main}08`,
                                border: `1px solid ${theme.palette.primary.main}30`,
                                borderRadius: 1,
                            }}>
                                {[
                                    { label: "Available Balance", value: selectedBalance.remaining, color: theme.palette.info.main },
                                    { label: "Applied Days", value: appliedDays, color: theme.palette.warning.main },
                                    { label: "Closing Balance", value: closingBalance, color: closingBalance < 3 ? theme.palette.error.main : theme.palette.success.main },
                                ].map(({ label, value, color }) => (
                                    <Box key={label} sx={{ textAlign: "center", flex: 1 }}>
                                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                                        <Typography variant="h5" fontWeight="bold" sx={{ color }}>{value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {fetchingEmployee ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 3, color: "text.secondary" }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2">Loading leave balances…</Typography>
                            </Box>
                        ) : (
                            <LeaveBalanceTable />
                        )}
                    </Box>

                    {/* ── APPROVAL INFORMATION ── */}
                    <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                    Approval Information
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField fullWidth label="Prepared By"
                                    value={formData.preparedBy}
                                    onChange={(e) => {
                                        setFormData((p) => ({ ...p, preparedBy: e.target.value }));
                                        if (errors.preparedBy) setErrors((e) => { const n = { ...e }; delete n.preparedBy; return n; });
                                    }}
                                    error={!!errors.preparedBy} helperText={errors.preparedBy}
                                    size="small" />
                            </Grid>
                        </Grid>
                    </Box>

                    <SignatureBlock />

                    <Divider sx={{ my: 3 }} />
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={handleReset} startIcon={<RestartAltIcon />} size="large">
                            Reset
                        </Button>
                        <Button variant="contained" onClick={handleSubmit} startIcon={<SendIcon />} size="large"
                            disabled={loading || fetchingEmployee}
                            sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
                            {loading ? "Submitting…" : "Submit Application"}
                        </Button>
                    </Stack>
                </Box>
            ) : (
                /* ── PRINT PREVIEW ── */
                <Box ref={printRef} sx={{ bgcolor: "white", p: 4, minHeight: "297mm", maxWidth: "210mm", mx: "auto", boxShadow: 3 }}>
                    <Box sx={{ mb: 4, pb: 2, borderBottom: "2px solid #333" }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item size={{ xs: 12, md: 2 }}>
                                <Box component="img" src={logo} alt="Bodla Group"
                                    sx={{ height: 80, width: "auto", objectFit: "contain", display: "block", mx: { xs: "auto", md: 0 } }} />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 10 }}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>BODLA GROUP</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>Leave Application Form</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2"><strong>Application ID:</strong> {formData.applicationId}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
                                <Typography variant="body2"><strong>Application Date:</strong> {formatDate(formData.applicationDate)}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Employee Information" />
                        <Grid container spacing={2}>
                            {[
                                { label: "Employee Code", value: formData.employeeCode },
                                { label: "Employee Name", value: formData.employeeName },
                                { label: "Designation", value: formData.designation },
                                { label: "Department", value: formData.department },
                            ].map(({ label, value }) => (
                                <Grid item size={{ xs: 6, md: 3 }} key={label}>
                                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: "bold", mt: 0.5, pb: 1, borderBottom: "1px solid #eee" }}>
                                        {value || "—"}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Details" />
                        <Grid container spacing={2}>
                            {[
                                { label: "Leave Type", value: formData.leaveTypeName },
                                { label: "Paid / Unpaid", value: formData.paidStatus },
                                { label: "From", value: formatDate(formData.startDate) },
                                { label: "To", value: formatDate(formData.endDate) },
                                { label: "Total Days", value: `${formData.totalDays || "0"} day${formData.totalDays !== "1" ? "s" : ""}` },
                            ].map(({ label, value }) => (
                                <Grid item size={{ xs: 6, md: 2 }} key={label}>
                                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: "bold", color: theme.palette.primary.main, mt: 0.5, pb: 1, borderBottom: "1px solid #eee" }}>
                                        {value}
                                    </Typography>
                                </Grid>
                            ))}
                            <Grid item size={12}>
                                <Typography variant="caption" color="text.secondary">Reason for Leave</Typography>
                                <Typography variant="body1" sx={{ mt: 1, p: 2, bgcolor: "#f9f9f9", borderRadius: 1, border: "1px solid #eee", minHeight: 80 }}>
                                    {formData.reason || "—"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Balance Summary" />
                        <LeaveBalanceTable editable={false} />
                    </Box>

                    <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>Approval Information</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    <strong>Prepared By:</strong> {formData.preparedBy || "—"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <SignatureBlock />

                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button variant="outlined" onClick={() => setShowPrintPreview(false)} startIcon={<RestartAltIcon />}>
                                Back to Edit
                            </Button>
                            <Button variant="contained" onClick={handlePrint} startIcon={<PrintIcon />}>
                                Print / Save as PDF
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            )}
        </Container>
    );
};

export default LeaveApplicationForm;