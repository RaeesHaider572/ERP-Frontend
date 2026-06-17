import React, { useState, useEffect, useRef } from "react";
import { applyLeave } from "../../services/leaveService";
import api from "../../services/authService";
import {
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Stack,
    Box,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Paper,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    CircularProgress,
} from "@mui/material";
import {
    EventNote as EventNoteIcon,
    Send as SendIcon,
    RestartAlt as RestartAltIcon,
    Print as PrintIcon,
} from "@mui/icons-material";
import logo from "../../assets/BodlaGroupLogo.svg";

const LeaveApplicationForm = () => {
    const theme = useTheme();
    const printRef = useRef();

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    const initialState = {
        employeeCode: "",
        employeeName: "",
        designation: "",
        department: "",
        preparedBy: "",
        applicationId: "", // Will be auto-generated
        applicationDate: getTodayDate(),
        leaveType: "Sick",
        paidStatus: "Paid",
        startDate: "",
        endDate: "",
        weight: "",
        reason: "",
        status: "Pending",
        sickLeaves: 0,
        casualLeaves: 0,
        annualLeaves: 0,
        compensatoryLeaves: 0,
        employeeId: null,
        requestId: null,
    };

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingEmployee, setFetchingEmployee] = useState(false);
    const [generatingId, setGeneratingId] = useState(false);

    // ============================================
    // ✅ AUTO-GENERATE APPLICATION ID ON LOAD
    // ============================================
    useEffect(() => {
        generateApplicationId();
    }, []);

    // ============================================
    // ✅ GENERATE APPLICATION ID FROM DATABASE
    // ============================================
    const generateApplicationId = async () => {
        setGeneratingId(true);
        try {
            console.log("🆔 Generating Application ID...");

            // ✅ Get the latest leave request from database
            const res = await api.get('/leave/requests');
            console.log("📊 Latest requests response:", res.data);

            let requests = [];
            if (res.data?.data) {
                requests = res.data.data;
            } else if (Array.isArray(res.data)) {
                requests = res.data;
            }

            let nextId = 1;

            if (requests && requests.length > 0) {
                // ✅ Find the maximum RequestID
                const maxId = Math.max(...requests.map(r => r.RequestID || 0));
                nextId = maxId + 1;
                console.log(`📊 Last RequestID: ${maxId}, Next ID: ${nextId}`);
            } else {
                console.log("📊 No existing requests, starting from 1");
            }

            // ✅ Format as LVE-XXXXXX (e.g., LVE-000001)
            const formattedId = `LVE-${String(nextId).padStart(6, '0')}`;
            console.log(`✅ Generated Application ID: ${formattedId}`);

            setFormData((prev) => ({
                ...prev,
                applicationId: formattedId,
                requestId: nextId,
            }));

        } catch (error) {
            console.error("❌ Error generating application ID:", error);
            // ✅ Show error and keep ID empty
            setFormData((prev) => ({
                ...prev,
                applicationId: "",
            }));
            setSnackbar({
                open: true,
                message: "Failed to generate Application ID. Please refresh the page.",
                severity: "error",
            });
        } finally {
            setGeneratingId(false);
        }
    };

    // ============================================
    // FETCH EMPLOYEE DATA BY CODE
    // ============================================
    const fetchEmployeeByCode = async (code) => {
        console.log("🔍 Fetching employee with code:", code);

        if (!code || code.trim() === "") {
            setFormData((prev) => ({
                ...prev,
                employeeName: "",
                designation: "",
                department: "",
                sickLeaves: 0,
                casualLeaves: 0,
                annualLeaves: 0,
                compensatoryLeaves: 0,
                employeeId: null,
            }));
            return;
        }

        setFetchingEmployee(true);
        try {
            const res = await api.get(`/employees/code/${code}`);
            console.log("✅ API Response:", res.data);

            const emp = res.data?.data;
            console.log("✅ Employee data:", emp);

            if (emp) {
                console.log("✅ Employee found:", emp.Name);

                setFormData((prev) => ({
                    ...prev,
                    employeeName: emp.Name || "",
                    designation: emp.Designation || "",
                    department: emp.Department || "",
                    employeeId: emp.EmployeeID || null,
                }));

                if (emp.EmployeeID) {
                    console.log("📊 Fetching leave balances for employee:", emp.EmployeeID);
                    await fetchLeaveBalances(emp.EmployeeID);
                }

                setSnackbar({
                    open: true,
                    message: `Employee ${emp.Name} loaded successfully`,
                    severity: "success",
                });
            } else {
                console.log("❌ No employee found");
                setFormData((prev) => ({
                    ...prev,
                    employeeName: "",
                    designation: "",
                    department: "",
                    sickLeaves: 0,
                    casualLeaves: 0,
                    annualLeaves: 0,
                    compensatoryLeaves: 0,
                    employeeId: null,
                }));
                setSnackbar({
                    open: true,
                    message: `Employee with code "${code}" not found`,
                    severity: "error",
                });
            }
        } catch (error) {
            console.error("❌ Employee fetch error:", error);
            setFormData((prev) => ({
                ...prev,
                employeeName: "",
                designation: "",
                department: "",
                sickLeaves: 0,
                casualLeaves: 0,
                annualLeaves: 0,
                compensatoryLeaves: 0,
                employeeId: null,
            }));
            setSnackbar({
                open: true,
                message: error.response?.data?.message || "Failed to fetch employee data",
                severity: "error",
            });
        } finally {
            setFetchingEmployee(false);
        }
    };

    // ============================================
    // FETCH LEAVE BALANCES
    // ============================================
    const fetchLeaveBalances = async (employeeId) => {
        try {
            console.log("📊 Fetching balances for Employee ID:", employeeId);
            const res = await api.get(`/leave/balances/employee/${employeeId}`);
            console.log("📊 Leave balances response:", res.data);

            let balances = [];
            if (res.data?.data) {
                balances = res.data.data;
            } else if (Array.isArray(res.data)) {
                balances = res.data;
            }

            console.log("📊 Processed balances:", balances);

            const balanceMap = {
                sickLeaves: 0,
                casualLeaves: 0,
                annualLeaves: 0,
                compensatoryLeaves: 0
            };

            if (balances && balances.length > 0) {
                balances.forEach((bal) => {
                    const name = bal.LeaveName || bal.leaveName || "";
                    const totalAllowed = bal.TotalAllowed || bal.totalAllowed || 0;

                    console.log(`📊 Processing ${name}: Total=${totalAllowed}`);

                    if (name.toLowerCase().includes("sick")) {
                        balanceMap.sickLeaves = totalAllowed;
                    } else if (name.toLowerCase().includes("casual")) {
                        balanceMap.casualLeaves = totalAllowed;
                    } else if (name.toLowerCase().includes("annual")) {
                        balanceMap.annualLeaves = totalAllowed;
                    } else if (name.toLowerCase().includes("compensatory")) {
                        balanceMap.compensatoryLeaves = totalAllowed;
                    }
                });
            }

            console.log("✅ Balance map:", balanceMap);

            setFormData((prev) => ({
                ...prev,
                sickLeaves: balanceMap.sickLeaves,
                casualLeaves: balanceMap.casualLeaves,
                annualLeaves: balanceMap.annualLeaves,
                compensatoryLeaves: balanceMap.compensatoryLeaves,
            }));
        } catch (error) {
            console.error("❌ Error fetching leave balances:", error);
            setFormData((prev) => ({
                ...prev,
                sickLeaves: 0,
                casualLeaves: 0,
                annualLeaves: 0,
                compensatoryLeaves: 0,
            }));
        }
    };

    // ============================================
    // CALCULATE DAYS
    // ============================================
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end >= start) {
                const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
                setFormData(prev => ({ ...prev, weight: diff.toString() }));
            } else {
                setFormData(prev => ({ ...prev, weight: "" }));
            }
        } else {
            setFormData(prev => ({ ...prev, weight: "" }));
        }
    }, [formData.startDate, formData.endDate]);

    // ============================================
    // GET CLOSING BALANCE
    // ============================================
    const getClosingBalance = (balanceKey, leaveTypeValue) => {
        const opening = parseFloat(formData[balanceKey]) || 0;
        const applied = formData.leaveType === leaveTypeValue
            ? parseFloat(formData.weight) || 0
            : 0;
        return Math.max(0, opening - applied);
    };

    // ============================================
    // HANDLE CHANGE
    // ============================================
    const handleChange = (field) => (event) => {
        const value = event.target.value;

        setFormData((prev) => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors((prev) => {
                const e = { ...prev };
                delete e[field];
                return e;
            });
        }

        if (field === "employeeCode") {
            fetchEmployeeByCode(value);
        }
    };

    const handleBalanceChange = (field) => (event) => {
        const value = event.target.value === "" ? "" : parseFloat(event.target.value) || 0;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // ============================================
    // VALIDATE FORM
    // ============================================
    const validateForm = () => {
        const newErrors = {};
        if (!formData.employeeCode) newErrors.employeeCode = "Employee Code is required";
        if (!formData.employeeName) newErrors.employeeName = "Employee Name is required";
        if (!formData.designation) newErrors.designation = "Designation is required";
        if (!formData.department) newErrors.department = "Department is required";
        if (!formData.preparedBy) newErrors.preparedBy = "Prepared By is required";
        if (!formData.startDate) newErrors.startDate = "Start Date is required";
        if (!formData.endDate) newErrors.endDate = "End Date is required";
        if (!formData.reason) newErrors.reason = "Reason is required";
        if (formData.startDate && formData.endDate &&
            new Date(formData.startDate) > new Date(formData.endDate)) {
            newErrors.endDate = "End Date must be after Start Date";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================
    // GET LEAVE TYPE ID
    // ============================================
    const getLeaveTypeId = (leaveTypeName) => {
        const mapping = {
            "Sick": 2,
            "Casual": 3,
            "Annual": 1,
            "Compensatory": 4
        };
        return mapping[leaveTypeName] || 1;
    };

    // ============================================
    // HANDLE SUBMIT
    // ============================================
    const handleSubmit = async () => {
        console.log("📝 Submitting form...");
        console.log("📝 Form data:", formData);

        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: "Please fill in all required fields",
                severity: "error"
            });
            return;
        }

        if (!formData.employeeId) {
            setSnackbar({
                open: true,
                message: "Employee not found. Please enter a valid employee code.",
                severity: "error",
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                EmployeeID: parseInt(formData.employeeId),
                LeaveTypeID: getLeaveTypeId(formData.leaveType),
                StartDate: formData.startDate,
                EndDate: formData.endDate,
                Reason: formData.reason || "",
            };

            console.log("📤 Submitting payload:", payload);

            const response = await applyLeave(payload);
            console.log("✅ Submit response:", response);

            const requestId = response.data?.data?.RequestID || response.data?.RequestID;

            if (requestId) {
                console.log("✅ RequestID from database:", requestId);

                // ✅ Update with the actual database ID
                const formattedId = `LVE-${String(requestId).padStart(6, '0')}`;

                setFormData((prev) => ({
                    ...prev,
                    requestId: requestId,
                    applicationId: formattedId,
                }));
            }

            setSnackbar({
                open: true,
                message: `Leave application submitted successfully! Application ID: ${formData.applicationId}`,
                severity: "success",
            });

            // ✅ Regenerate ID for next application
            setTimeout(() => {
                generateApplicationId();
            }, 2000);

            setTimeout(() => setShowPrintPreview(true), 1000);

        } catch (error) {
            console.error("❌ Submit error:", error);
            console.error("❌ Error details:", error.response);

            setSnackbar({
                open: true,
                message: error.response?.data?.message || "Failed to submit leave application",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // HANDLE RESET
    // ============================================
    const handleReset = () => {
        setFormData({
            ...initialState,
            applicationDate: getTodayDate(),
            applicationId: formData.applicationId, // Keep the generated ID
        });
        setErrors({});
        setShowPrintPreview(false);
    };

    // ============================================
    // FORMAT DATE
    // ============================================
    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // ============================================
    // GET LEAVE TYPE LABEL
    // ============================================
    const getLeaveTypeLabel = () => {
        const leaveType = leaveTypes.find(lt => lt.value === formData.leaveType);
        return leaveType ? leaveType.label : formData.leaveType;
    };

    // ============================================
    // LEAVE TYPES
    // ============================================
    const leaveTypes = [
        { value: "Sick", label: "Sick Leave", balanceKey: "sickLeaves" },
        { value: "Casual", label: "Casual Leave", balanceKey: "casualLeaves" },
        { value: "Annual", label: "Annual Leave", balanceKey: "annualLeaves" },
        { value: "Compensatory", label: "Compensatory Leave", balanceKey: "compensatoryLeaves" },
    ];

    // ============================================
    // LEAVE BALANCE TABLE
    // ============================================
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
                    {leaveTypes.map((lt, i) => {
                        const opening = parseFloat(formData[lt.balanceKey]) || 0;
                        const isActive = formData.leaveType === lt.value;
                        const applied = isActive ? parseFloat(formData.weight) || 0 : 0;
                        const closing = Math.max(0, opening - applied);

                        return (
                            <TableRow
                                key={lt.value}
                                sx={{
                                    bgcolor: i % 2 === 0 ? "#fff" : "#fafafa",
                                    ...(isActive && {
                                        bgcolor: `${theme.palette.primary.main}10`,
                                        "& td": { fontWeight: "bold" },
                                    }),
                                }}
                            >
                                <TableCell>{lt.label}</TableCell>
                                <TableCell align="right">
                                    {editable ? (
                                        <TextField
                                            type="number"
                                            value={formData[lt.balanceKey]}
                                            onChange={handleBalanceChange(lt.balanceKey)}
                                            size="small"
                                            placeholder="0"
                                            inputProps={{ min: 0, style: { textAlign: "right", width: 70 } }}
                                            variant="standard"
                                            sx={{ width: 80 }}
                                        />
                                    ) : (
                                        opening
                                    )}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ color: isActive ? theme.palette.primary.main : "inherit" }}
                                >
                                    {applied || 0}
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: "bold",
                                        color: closing < 0 ? "error.main" : "inherit",
                                    }}
                                >
                                    {closing}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );

    // ============================================
    // SIGNATURE BLOCK
    // ============================================
    const SignatureBlock = () => (
        <Grid container spacing={3} sx={{ mt: 6 }}>
            {["Employee", "Reporting Manager", "Department Head", "HR"].map((role) => (
                <Grid item size={{ xs: 6, sm: 3 }} key={role}>
                    <Box sx={{ textAlign: "center" }}>
                        <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold", pt: 3, borderTop: "2px solid #ddd" }}
                        >
                            {role}
                        </Typography>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

    // ============================================
    // SECTION HEADER
    // ============================================
    const SectionHeader = ({ title }) => (
        <Typography
            variant="h6"
            sx={{
                fontWeight: "bold",
                mb: 2,
                pb: 1,
                borderBottom: "2px solid #ddd",
                color: theme.palette.primary.main,
            }}
        >
            {title}
        </Typography>
    );

    // ============================================
    // HANDLE PRINT
    // ============================================
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');

        const balanceRows = leaveTypes.map((lt) => {
            const opening = parseFloat(formData[lt.balanceKey]) || 0;
            const isActive = formData.leaveType === lt.value;
            const applied = isActive ? parseFloat(formData.weight) || 0 : 0;
            const closing = Math.max(0, opening - applied);
            const isHighlighted = isActive ? 'highlight' : '';

            return `
                <tr class="${isHighlighted}">
                    <td>${lt.label}</td>
                    <td class="right">${opening}</td>
                    <td class="right"><strong>${applied}</strong></td>
                    <td class="right"><strong>${closing}</strong></td>
                </tr>
            `;
        }).join('');

        const printHTML = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Leave Application - ${formData.applicationId}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; padding: 40px; color: #333; }
                        .print-container { max-width: 210mm; margin: 0 auto; background: white; }
                        .header { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #333; display: flex; flex-wrap: wrap; flex-direction: row; }
                        .header .header-logo { width: 100px; height: auto; }
                        .header .header-logo img { width: 100%; height: auto; border:0; }
                        .header .header-company { width: auto; height: auto; margin: 0 auto; text-align: center; padding-right: 15%; }
                        .header .header-company .company-name { font-size: 20px; font-weight: 800; letter-spacing: 2px; }
                        .form-title { font-size: 24px; font-weight: 600; margin-top: 8px; color: #333; }
                        .header .app-info { display: flex; flex-wrap: wrap; flex-direction: row; align-items: center; justify-content: space-between; width: 100%; margin-top: 0.5rem; font-size: 0.875rem; gap: 1rem; }
                        .section { margin-bottom: 10px; display: flex; flex-wrap: wrap; flex-direction: row; }
                        .section-title { font-size: 16px; font-weight: 700; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #ddd; width: 100%; }
                        .info-grid { display: flex; gap: 16px; margin-bottom: 20px; width: 100%; }
                        .info-item { margin-bottom: 8px; flex: 1; min-width: 0; }
                        .info-label { font-size: 11px; color: #777; margin-bottom: 4px; }
                        .info-value { font-size: 14px; font-weight: 500; padding-bottom: 6px; border-bottom: 1px solid #eee; }
                        .info-value.highlight { font-weight: 700; }
                        .details-grid { display: flex; gap: 16px; width: 100%; }
                        .details-grid .info-item{ flex: 1; min-width: 0; }
                        .full-width { width: 100%; display: block; margin-bottom: 20px; margin-top: 16px; }
                        .reason-box { padding: 12px; border: 1px solid #eee; border-radius: 4px; min-height: 80px; line-height: 1.6; width: 100%; background: #fffff; }
                        .balance-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
                        .balance-table th, .balance-table td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
                        .balance-table th { background: #f5f5f5; font-weight: 700; }
                        .balance-table td.right, .balance-table th.right { text-align: right; }
                        .balance-table tr.highlight { background-color: #e3f2fd; }
                        .balance-table tr.highlight td { font-weight: 700; }
                        .approval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #ddd; }
                        .approval-title { font-size: 16px; font-weight: 700; }
                        .signature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 120px; }
                        .signature-box { text-align: center; }
                        .signature-line { border-top: 1px solid #000; padding-top: 8px; margin-top: 4px; font-size: 12px; }
                        .no-print { display: none; }
                        @media print { body { padding: 15mm; } @page { size: A4; margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="header">
                            <div class="header-logo">
                                <img src="${logo}" alt="Bodla Group Logo" />
                            </div>
                            <div class="header-company">
                                <div class="company-name">BODLA GROUP</div>
                                <div class="form-title">Leave Application Form</div>
                            </div>
                            <div class="app-info">
                                <span><strong>Application ID:</strong> ${formData.applicationId}</span>
                                <span><strong>Application Date:</strong> ${formatDate(formData.applicationDate)}</span>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Employee Information</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Employee Code</div>
                                    <div class="info-value">${formData.employeeCode || "—"}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Employee Name</div>
                                    <div class="info-value">${formData.employeeName || "—"}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Designation</div>
                                    <div class="info-value">${formData.designation || "—"}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Department</div>
                                    <div class="info-value">${formData.department || "—"}</div>
                                </div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Leave Details</div>
                            <div class="details-grid">
                                <div class="info-item">
                                    <div class="info-label">Leave Type</div>
                                    <div class="info-value highlight">${getLeaveTypeLabel()}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Paid / Unpaid</div>
                                    <div class="info-value">${formData.paidStatus}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">From</div>
                                    <div class="info-value highlight">${formatDate(formData.startDate)}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">To</div>
                                    <div class="info-value highlight">${formatDate(formData.endDate)}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Total Days</div>
                                    <div class="info-value highlight">${formData.weight || "0"} day${formData.weight !== "1" ? "s" : ""}</div>
                                </div>
                            </div>
                            <div class="full-width">
                                <div class="info-label">Reason for Leave</div>
                                <div class="reason-box">${formData.reason || "—"}</div>
                            </div>
                        </div>

                        <div class="section">
                            <div class="section-title">Leave Balance Summary</div>
                            <table class="balance-table">
                                <thead>
                                    <tr>
                                        <th>Leave Type</th>
                                        <th class="right">Opening Balance</th>
                                        <th class="right">Applied Days</th>
                                        <th class="right">Closing Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${balanceRows}
                                </tbody>
                            </table>
                        </div>

                        <div class="approval-header">
                            <div class="approval-title">Approval Information</div>
                            <div><strong>Prepared By:</strong> ${formData.preparedBy || "—"}</div>
                        </div>

                        <div class="signature-grid">
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
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper
                elevation={0}
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    borderRadius: 2,
                    p: 3,
                    mb: 3,
                    color: "white",
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <EventNoteIcon sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="bold">Leave Application Form</Typography>
                            <Typography variant="light" sx={{ opacity: 0.9 }}>
                                Enter employee code to auto-fill information
                            </Typography>
                        </Box>
                    </Stack>
                    {showPrintPreview && (
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            sx={{ bgcolor: "white", color: theme.palette.primary.main, "&:hover": { bgcolor: "#f5f5f5" } }}
                        >
                            Print Application
                        </Button>
                    )}
                </Stack>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
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
                                    <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>
                                        BODLA GROUP
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
                                        Leave Application Form
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2">
                                    <strong>Application ID:</strong>
                                    {generatingId ? (
                                        <CircularProgress size={16} sx={{ ml: 1 }} />
                                    ) : formData.applicationId ? (
                                        ` ${formData.applicationId}`
                                    ) : (
                                        <span style={{ color: 'red', fontWeight: 'bold' }}> Failed to load</span>
                                    )}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
                                <Typography variant="body2"><strong>Application Date:</strong> {formatDate(formData.applicationDate)}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Employee Information */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Employee Information" />
                        <Grid container spacing={1}>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Employee Code *"
                                    name="employeeCode"
                                    value={formData.employeeCode}
                                    onChange={handleChange("employeeCode")}
                                    required
                                    error={!!errors.employeeCode}
                                    helperText={errors.employeeCode}
                                    size="small"
                                    placeholder="Enter code to auto-fill"
                                    InputProps={{
                                        endAdornment: fetchingEmployee && (
                                            <CircularProgress size={20} />
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Employee Name *"
                                    name="employeeName"
                                    value={formData.employeeName}
                                    onChange={handleChange("employeeName")}
                                    required
                                    error={!!errors.employeeName}
                                    helperText={errors.employeeName}
                                    size="small"
                                    InputProps={{ readOnly: true }}
                                    sx={{ "& input": { bgcolor: "#f9f9f9" } }}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Designation *"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange("designation")}
                                    required
                                    error={!!errors.designation}
                                    helperText={errors.designation}
                                    size="small"
                                    InputProps={{ readOnly: true }}
                                    sx={{ "& input": { bgcolor: "#f9f9f9" } }}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Department *"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange("department")}
                                    required
                                    error={!!errors.department}
                                    helperText={errors.department}
                                    size="small"
                                    InputProps={{ readOnly: true }}
                                    sx={{ "& input": { bgcolor: "#f9f9f9" } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Leave Details */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Details" />
                        <Grid container spacing={1}>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Leave Type</InputLabel>
                                    <Select
                                        value={formData.leaveType}
                                        onChange={handleChange("leaveType")}
                                        label="Leave Type"
                                    >
                                        {leaveTypes.map(lt => (
                                            <MenuItem key={lt.value} value={lt.value}>{lt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Paid/Unpaid</InputLabel>
                                    <Select
                                        value={formData.paidStatus}
                                        onChange={handleChange("paidStatus")}
                                        label="Paid/Unpaid"
                                    >
                                        <MenuItem value="Paid">Paid</MenuItem>
                                        <MenuItem value="Unpaid">Unpaid</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Start Date *"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange("startDate")}
                                    required
                                    error={!!errors.startDate}
                                    helperText={errors.startDate}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="End Date *"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={handleChange("endDate")}
                                    required
                                    error={!!errors.endDate}
                                    helperText={errors.endDate}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Total Days"
                                    value={formData.weight}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                    sx={{ "& input": { bgcolor: "#f9f9f9" } }}
                                />
                            </Grid>
                            <Grid item size={12}>
                                <TextField
                                    fullWidth
                                    label="Reason for Leave *"
                                    value={formData.reason}
                                    onChange={handleChange("reason")}
                                    required
                                    error={!!errors.reason}
                                    helperText={errors.reason}
                                    multiline
                                    rows={3}
                                    placeholder="Please provide a detailed reason for leave..."
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Leave Balance Summary */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Balance Summary" />
                        <LeaveBalanceTable editable={true} />
                    </Box>

                    {/* Approval Information */}
                    <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                    Approval Information
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Prepared By *"
                                    value={formData.preparedBy}
                                    onChange={handleChange("preparedBy")}
                                    error={!!errors.preparedBy}
                                    helperText={errors.preparedBy}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <SignatureBlock />

                    <Divider sx={{ my: 3 }} />
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={handleReset} startIcon={<RestartAltIcon />} size="large">
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            startIcon={<SendIcon />}
                            size="large"
                            sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Submit Application"}
                        </Button>
                    </Stack>
                </Box>
            ) : (
                /* Print Preview */
                <Box ref={printRef} sx={{ bgcolor: "white", p: 4, minHeight: "297mm", maxWidth: "210mm", mx: "auto", boxShadow: 3 }}>
                    {/* Print Preview Content - Same as before */}
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

                    {/* Employee Information - Print */}
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

                    {/* Leave Details - Print */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Details" />
                        <Grid container spacing={2}>
                            <Grid item size={{ xs: 6, md: 2 }}>
                                <Typography variant="caption" color="text.secondary">Leave Type</Typography>
                                <Typography variant="body1" sx={{ fontWeight: "bold", mt: 0.5, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {leaveTypes.find(lt => lt.value === formData.leaveType)?.label || "—"}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 2 }}>
                                <Typography variant="caption" color="text.secondary">Paid / Unpaid</Typography>
                                <Typography variant="body1" sx={{ fontWeight: "bold", mt: 0.5, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {formData.paidStatus}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 3 }}>
                                <Typography variant="caption" color="text.secondary">From</Typography>
                                <Typography variant="body1" sx={{ fontWeight: "bold", color: theme.palette.primary.main, mt: 0.5, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {formatDate(formData.startDate)}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 3 }}>
                                <Typography variant="caption" color="text.secondary">To</Typography>
                                <Typography variant="body1" sx={{ fontWeight: "bold", color: theme.palette.primary.main, mt: 0.5, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {formatDate(formData.endDate)}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 2 }}>
                                <Typography variant="caption" color="text.secondary">Total Days</Typography>
                                <Typography variant="body1" sx={{ fontWeight: "bold", color: theme.palette.primary.main, mt: 0.5, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {formData.weight || "0"} day{formData.weight !== "1" ? "s" : ""}
                                </Typography>
                            </Grid>
                            <Grid item size={12}>
                                <Typography variant="caption" color="text.secondary">Reason for Leave</Typography>
                                <Typography variant="body1" sx={{ mt: 1, p: 2, bgcolor: "#f9f9f9", borderRadius: 1, border: "1px solid #eee", minHeight: 80 }}>
                                    {formData.reason || "—"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Leave Balance Summary - Print */}
                    <Box sx={{ mb: 3 }}>
                        <SectionHeader title="Leave Balance Summary" />
                        <LeaveBalanceTable editable={false} />
                    </Box>

                    {/* Approval Information - Print */}
                    <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                    Approval Information
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    <strong>Prepared By:</strong> {formData.preparedBy || "—"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <SignatureBlock />

                    {/* Print Actions */}
                    <Box sx={{ mt: 4, textAlign: "center" }} className="no-print">
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