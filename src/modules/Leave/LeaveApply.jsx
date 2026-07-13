import React, { useState, useEffect, useRef } from "react";
import { applyLeave } from "../../services/leaveService";
import api from "../../services/authService";
import { useAuth } from '../../contexts/AuthContext';
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
    Send as SendIcon,
    RestartAlt as RestartAltIcon,
    Print as PrintIcon,
} from "@mui/icons-material";
import logo from "../../assets/BodlaGroupLogo.svg";

const LeaveApplicationForm = () => {
    const theme = useTheme();
    const { user, isCustodian } = useAuth();

    const printRef = useRef();

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    const initialState = {
        employeeCode: "",
        employeeName: "",
        designation: "",
        department: "",
        preparedBy: "",
        applicationId: "BGLA-",
        applicationDate: getTodayDate(),
        leaveType: "Sick",
        paidStatus: "Paid",
        duration: "full-day",
        startDate: "",
        endDate: "",
        weight: "",
        reason: "",
        status: "Pending",

        // Sick Leave
        sickBalance: 0,
        sickTotalAllowed: 0,
        sickLeaves: 0,
        sickOpeningTotal: 0,
        sickOpeningEarned: 0,
        sickAdditionsEarned: 0,
        sickClosingTotal: 0,
        sickClosingEarned: 0,

        // Casual Leave
        casualBalance: 0,
        casualTotalAllowed: 0,
        casualLeaves: 0,
        casualOpeningTotal: 0,
        casualOpeningEarned: 0,
        casualAdditionsEarned: 0,
        casualClosingTotal: 0,
        casualClosingEarned: 0,

        // Annual Leave
        annualBalance: 0,
        annualTotalAllowed: 0,
        annualLeaves: 0,
        annualOpeningTotal: 0,
        annualOpeningEarned: 0,
        annualAdditionsEarned: 0,
        annualClosingTotal: 0,
        annualClosingEarned: 0,

        // Compensatory Leave
        compensatoryBalance: 0,
        compensatoryTotalAllowed: 0,
        compensatoryLeaves: 0,
        compensatoryOpeningTotal: 0,
        compensatoryOpeningEarned: 0,
        compensatoryAdditionsEarned: 0,
        compensatoryClosingTotal: 0,
        compensatoryClosingEarned: 0,

        employeeId: null,
        requestId: null,
    };

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingEmployee, setFetchingEmployee] = useState(false);
    const [isFetchingBalance, setIsFetchingBalance] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);

    // ============================================
    // LEAVE TYPES
    // ============================================
    const leaveTypes = [
        {
            value: "Sick",
            label: "Sick Leave",
            balanceKey: "sickBalance",
            totalKey: "sickTotalAllowed",
            usedKey: "sickLeaves",
            openingTotalKey: "sickOpeningTotal",
            openingEarnedKey: "sickOpeningEarned",
            additionsEarnedKey: "sickAdditionsEarned",
            closingTotalKey: "sickClosingTotal",
            closingEarnedKey: "sickClosingEarned"
        },
        {
            value: "Casual",
            label: "Casual Leave",
            balanceKey: "casualBalance",
            totalKey: "casualTotalAllowed",
            usedKey: "casualLeaves",
            openingTotalKey: "casualOpeningTotal",
            openingEarnedKey: "casualOpeningEarned",
            additionsEarnedKey: "casualAdditionsEarned",
            closingTotalKey: "casualClosingTotal",
            closingEarnedKey: "casualClosingEarned"
        },
        {
            value: "Annual",
            label: "Annual Leave",
            balanceKey: "annualBalance",
            totalKey: "annualTotalAllowed",
            usedKey: "annualLeaves",
            openingTotalKey: "annualOpeningTotal",
            openingEarnedKey: "annualOpeningEarned",
            additionsEarnedKey: "annualAdditionsEarned",
            closingTotalKey: "annualClosingTotal",
            closingEarnedKey: "annualClosingEarned"
        },
        {
            value: "Compensatory",
            label: "Compensatory Leave",
            balanceKey: "compensatoryBalance",
            totalKey: "compensatoryTotalAllowed",
            usedKey: "compensatoryLeaves",
            openingTotalKey: "compensatoryOpeningTotal",
            openingEarnedKey: "compensatoryOpeningEarned",
            additionsEarnedKey: "compensatoryAdditionsEarned",
            closingTotalKey: "compensatoryClosingTotal",
            closingEarnedKey: "compensatoryClosingEarned"
        },
    ];

    // ============================================
    // FETCH LEAVE BALANCES
    // ============================================
    const fetchLeaveBalances = async (employeeId) => {
        if (!employeeId) return;

        setIsFetchingBalance(true);
        try {
            const res = await api.get(`/leave/balances/employee/${employeeId}`);
            let balances = [];
            if (res.data?.data) balances = res.data.data;
            else if (Array.isArray(res.data)) balances = res.data;

            const balanceMap = {
                sickBalance: 0, sickTotalAllowed: 0, sickLeaves: 0,
                sickOpeningTotal: 0, sickOpeningEarned: 0, sickAdditionsEarned: 0,
                sickClosingTotal: 0, sickClosingEarned: 0,
                casualBalance: 0, casualTotalAllowed: 0, casualLeaves: 0,
                casualOpeningTotal: 0, casualOpeningEarned: 0, casualAdditionsEarned: 0,
                casualClosingTotal: 0, casualClosingEarned: 0,
                annualBalance: 0, annualTotalAllowed: 0, annualLeaves: 0,
                annualOpeningTotal: 0, annualOpeningEarned: 0, annualAdditionsEarned: 0,
                annualClosingTotal: 0, annualClosingEarned: 0,
                compensatoryBalance: 0, compensatoryTotalAllowed: 0, compensatoryLeaves: 0,
                compensatoryOpeningTotal: 0, compensatoryOpeningEarned: 0, compensatoryAdditionsEarned: 0,
                compensatoryClosingTotal: 0, compensatoryClosingEarned: 0,
            };

            if (balances.length > 0) {
                balances.forEach((bal) => {
                    const name = bal.LeaveName || bal.leaveName || "";
                    const totalAllowed = parseFloat(bal.TotalAllowed || bal.totalAllowed || 0);
                    const leaves = parseFloat(bal.Leaves || bal.leaves || 0);
                    const balance = parseFloat(bal.Balance || bal.balance || 0);
                    const openingTotal = parseFloat(bal.OpeningBalance || bal.openingBalance || bal.OpeningTotal || bal.openingTotal || 0);
                    const openingEarned = parseFloat(bal.OpeningEarned || bal.openingEarned || 0);
                    const additionsEarned = parseFloat(bal.AdditionsEarned || bal.additionsEarned || 0);
                    const closingTotal = parseFloat(bal.ClosingTotal || bal.closingTotal || 0);
                    const closingEarned = parseFloat(bal.ClosingEarned || bal.closingEarned || 0);

                    const nameLower = name.toLowerCase();
                    if (nameLower.includes("sick")) {
                        Object.assign(balanceMap, {
                            sickBalance: balance,
                            sickTotalAllowed: totalAllowed,
                            sickLeaves: leaves,
                            sickOpeningTotal: openingTotal,
                            sickOpeningEarned: openingEarned,
                            sickAdditionsEarned: additionsEarned,
                            sickClosingTotal: closingTotal,
                            sickClosingEarned: closingEarned
                        });
                    } else if (nameLower.includes("casual")) {
                        Object.assign(balanceMap, {
                            casualBalance: balance,
                            casualTotalAllowed: totalAllowed,
                            casualLeaves: leaves,
                            casualOpeningTotal: openingTotal,
                            casualOpeningEarned: openingEarned,
                            casualAdditionsEarned: additionsEarned,
                            casualClosingTotal: closingTotal,
                            casualClosingEarned: closingEarned
                        });
                    } else if (nameLower.includes("annual")) {
                        Object.assign(balanceMap, {
                            annualBalance: balance,
                            annualTotalAllowed: totalAllowed,
                            annualLeaves: leaves,
                            annualOpeningTotal: openingTotal,
                            annualOpeningEarned: openingEarned,
                            annualAdditionsEarned: additionsEarned,
                            annualClosingTotal: closingTotal,
                            annualClosingEarned: closingEarned
                        });
                    } else if (nameLower.includes("compensatory")) {
                        Object.assign(balanceMap, {
                            compensatoryBalance: balance,
                            compensatoryTotalAllowed: totalAllowed,
                            compensatoryLeaves: leaves,
                            compensatoryOpeningTotal: openingTotal,
                            compensatoryOpeningEarned: openingEarned,
                            compensatoryAdditionsEarned: additionsEarned,
                            compensatoryClosingTotal: closingTotal,
                            compensatoryClosingEarned: closingEarned
                        });
                    }
                });
            }

            setFormData((prev) => ({ ...prev, ...balanceMap }));
        } catch (error) {
            console.error("❌ Error fetching leave balances:", error);
            setSnackbar({
                open: true,
                message: "Failed to fetch leave balances",
                severity: "error",
            });
        } finally {
            setIsFetchingBalance(false);
        }
    };

    // ============================================
    // FETCH EMPLOYEE DATA BY CODE
    // ============================================
    const fetchEmployeeByCode = async (code) => {
        if (!code || code.trim() === "") {
            setFormData((prev) => ({
                ...prev,
                employeeName: "",
                designation: "",
                department: "",
                employeeId: null,
            }));
            return;
        }

        setFetchingEmployee(true);
        try {
            const res = await api.get(`/employees/code/${code}`);
            const emp = res.data?.data;

            if (emp) {
                setFormData((prev) => ({
                    ...prev,
                    employeeName: emp.Name || "",
                    designation: emp.Designation || "",
                    department: emp.Department || "",
                    employeeId: emp.EmployeeID || null,
                    employeeCode: code,
                }));

                if (emp.EmployeeID) {
                    await fetchLeaveBalances(emp.EmployeeID);
                }

                setSnackbar({
                    open: true,
                    message: `Employee ${emp.Name} loaded successfully`,
                    severity: "success",
                });
            } else {
                setSnackbar({
                    open: true,
                    message: `Employee with code "${code}" not found`,
                    severity: "error",
                });
            }
        } catch (error) {
            console.error("❌ Employee fetch error:", error);
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
    // AUTO-FILL LOGGED-IN EMPLOYEE
    // ============================================
    useEffect(() => {
        if (user) {
            const employeeCode = user.EmployeeCode || user.employeeCode || "";
            const preparedByName = user.Name || user.name || "";

            let formattedCode = employeeCode;
            if (formattedCode && !formattedCode.includes('-')) {
                if (formattedCode.startsWith('EMP')) {
                    const numPart = formattedCode.replace('EMP', '');
                    formattedCode = `EMP-${numPart}`;
                }
            }

            if (formattedCode) {
                setFormData((prev) => ({
                    ...prev,
                    employeeCode: formattedCode,
                    employeeName: user.Name || "",
                    designation: user.Designation || "",
                    department: user.Department || "",
                    employeeId: user.EmployeeID || null,
                    preparedBy: preparedByName,
                }));

                if (user.EmployeeID) {
                    fetchLeaveBalances(user.EmployeeID);
                }
            }

            if (isCustodian()) {
                fetchTeamMembers();
            }
        }
    }, [user]);

    // ============================================
    // FETCH TEAM MEMBERS
    // ============================================
    const fetchTeamMembers = async () => {
        if (!isCustodian() || !user?.EmployeeID) return;
        try {
            const res = await api.get(`/employees/team/${user.EmployeeID}`);
            let data = [];
            if (res.data?.data) data = res.data.data;
            else if (Array.isArray(res.data)) data = res.data;
            setTeamMembers(data);
        } catch (error) {
            console.error("❌ Error fetching team members:", error);
        }
    };

    // ============================================
    // URL PARAMETER HANDLER
    // ============================================
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const employeeCode = params.get('employeeCode');
        if (employeeCode) {
            fetchEmployeeByCode(employeeCode);
        }
    }, []);

    // ============================================
    // CALCULATE DAYS
    // ============================================
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end >= start) {
                let diff = 0;
                if (formData.duration === 'half-day') {
                    diff = 0.5;
                } else if (formData.duration === 'short-day') {
                    diff = 0.75;
                } else {
                    diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
                }
                setFormData(prev => ({ ...prev, weight: diff.toString() }));
            } else {
                setFormData(prev => ({ ...prev, weight: "" }));
            }
        } else {
            setFormData(prev => ({ ...prev, weight: "" }));
        }
    }, [formData.startDate, formData.endDate, formData.duration]);

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
        const mapping = { "Sick": 1, "Casual": 2, "Annual": 3, "Compensatory": 4 };
        return mapping[leaveTypeName] || 1;
    };

    const getLeaveTypeName = (leaveTypeId) => {
        const mapping = { 1: 'Sick', 2: 'Casual', 3: 'Annual', 4: 'Compensatory' };
        return mapping[leaveTypeId] || 'Sick';
    };

    // ============================================
    // HANDLE SUBMIT
    // ============================================
    const handleSubmit = async () => {
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
                Duration: formData.duration || "full-day",
            };

            const response = await applyLeave(payload);
            const responseData = response.data?.data || response.data;
            const requestId = responseData?.RequestID;
            const requestCode = responseData?.RequestCode;
            const totalDays = responseData?.TotalDays;

            if (requestId) {
                const fullApplicationId = requestCode || `BGLA-${String(requestId).padStart(6, '0')}`;

                try {
                    const printDataResponse = await api.get(`/leave/requests/${requestId}`);
                    const printData = printDataResponse.data?.data || printDataResponse.data;

                    setFormData((prev) => ({
                        ...prev,
                        requestId: requestId,
                        applicationId: printData.RequestCode || fullApplicationId,
                        employeeName: printData.EmployeeName || prev.employeeName,
                        employeeCode: printData.EmployeeCode || prev.employeeCode,
                        designation: printData.Designation || prev.designation,
                        department: printData.Department || prev.department,
                        leaveType: getLeaveTypeName(printData.LeaveTypeID) || prev.leaveType,
                        startDate: printData.StartDate ? new Date(printData.StartDate).toISOString().split('T')[0] : prev.startDate,
                        endDate: printData.EndDate ? new Date(printData.EndDate).toISOString().split('T')[0] : prev.endDate,
                        weight: printData.TotalDays?.toString() || prev.weight,
                        reason: printData.Reason || prev.reason,
                        status: printData.Status || prev.status,
                        duration: printData.Duration || prev.duration,
                    }));
                } catch (fetchError) {
                    setFormData((prev) => ({
                        ...prev,
                        requestId: requestId,
                        applicationId: fullApplicationId,
                        weight: totalDays?.toString() || prev.weight,
                    }));
                }

                setSnackbar({
                    open: true,
                    message: `Leave application submitted! ID: ${fullApplicationId}`,
                    severity: "success",
                });

                setTimeout(() => {
                    setShowPrintPreview(true);
                }, 1500);
            } else {
                throw new Error("No RequestID returned from server");
            }
        } catch (error) {
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
            applicationId: "BGLA-",
            ...(user && {
                employeeCode: user.EmployeeCode || "",
                employeeName: user.Name || "",
                designation: user.Designation || "",
                department: user.Department || "",
                employeeId: user.EmployeeID || null,
                preparedBy: user.Name || "",
            })
        });
        setErrors({});
        setShowPrintPreview(false);
        if (user?.EmployeeID) {
            fetchLeaveBalances(user.EmployeeID);
        }
    };

    // ============================================
    // FORMAT DATE
    // ============================================
    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getLeaveTypeLabel = () => {
        const leaveType = leaveTypes.find(lt => lt.value === formData.leaveType);
        return leaveType ? leaveType.label : formData.leaveType;
    };

    // ============================================
    // LEAVE BALANCE TABLE COMPONENT (Reusable)
    // ============================================
    const LeaveBalanceTable = () => {
        const currentMonth = new Date().getMonth() + 1;
        const isFirstMonth = currentMonth === 1;

        return (
            <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "none", overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell rowSpan={2}>Particulars</TableCell>
                            <TableCell colSpan={2} align="center">Opening</TableCell>
                            <TableCell colSpan={2} align="center">Additions</TableCell>
                            <TableCell align="center">Leaves</TableCell>
                            <TableCell colSpan={2} align="center">Closing</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center">Earned</TableCell>
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center">Earned</TableCell>
                            <TableCell align="center">Actual</TableCell>
                            <TableCell align="center">Total</TableCell>
                            <TableCell align="center">Earned</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leaveTypes.map((lt, i) => {
                            // Real DB state (already reflects approved leaves)
                            const openingTotal = parseFloat(formData[lt.openingTotalKey]) || 0;
                            const openingEarned = parseFloat(formData[lt.openingEarnedKey]) || 0;
                            const additionsTotal = parseFloat(formData[lt.additionsTotalKey]) || 0; // see note below
                            const additionsEarned = parseFloat(formData[lt.additionsEarnedKey]) || 0;
                            const closingTotal = parseFloat(formData[lt.closingTotalKey]) || 0;
                            const closingEarned = parseFloat(formData[lt.closingEarnedKey]) || 0;

                            // ✅ THIS row's Actual = the current application's day-weight, ONLY if this is the selected leave type
                            const isActive = formData.leaveType === lt.value;
                            const leavesActual = isActive ? (parseFloat(formData.weight) || 0) : 0;

                            // ✅ Projected closing = DB closing MINUS this pending application (only for the active row)
                            const projectedTotal = isActive ? closingTotal - leavesActual : closingTotal;
                            const projectedEarned = isActive ? closingEarned - leavesActual : closingEarned;

                            return (
                                <TableRow key={lt.value} sx={{ bgcolor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                    <TableCell>{lt.label}</TableCell>
                                    <TableCell align="right">{openingTotal.toFixed(2)}</TableCell>
                                    <TableCell align="right">{openingEarned.toFixed(2)}</TableCell>
                                    <TableCell align="right">{additionsTotal.toFixed(2)}</TableCell>
                                    <TableCell align="right">{additionsEarned.toFixed(2)}</TableCell>
                                    <TableCell align="right">
                                        <strong>{leavesActual > 0 ? leavesActual.toFixed(2) : '0.00'}</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong style={{ color: projectedTotal < 0 ? 'red' : 'inherit' }}>
                                            {projectedTotal.toFixed(2)}
                                        </strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong style={{ color: projectedEarned < 0 ? 'red' : 'inherit' }}>
                                            {projectedEarned.toFixed(2)}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };
    // ============================================
    // SIGNATURE BLOCK
    // ============================================
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

    // ============================================
    // SECTION HEADER
    // ============================================
    const SectionHeader = ({ title }) => (
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>{title}</Typography>
    );

    // ============================================
    // HANDLE PRINT
    // ============================================
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const currentMonth = new Date().getMonth() + 1;
        const isFirstMonth = currentMonth === 1;
        // Generate balance rows for print
        const balanceRows = leaveTypes.map((lt) => {
            // Real DB state (already reflects approved leaves) — same fields the screen table reads
            const openingTotal = parseFloat(formData[lt.openingTotalKey]) || 0;
            const openingEarned = parseFloat(formData[lt.openingEarnedKey]) || 0;
            const additionsTotal = parseFloat(formData[lt.additionsTotalKey]) || 0;
            const additionsEarned = parseFloat(formData[lt.additionsEarnedKey]) || 0;
            const closingTotal = parseFloat(formData[lt.closingTotalKey]) || 0;
            const closingEarned = parseFloat(formData[lt.closingEarnedKey]) || 0;

            // This row's Actual = the current application's day-weight, ONLY if this is the selected leave type
            const isActive = formData.leaveType === lt.value;
            const leavesActual = isActive ? (parseFloat(formData.weight) || 0) : 0;

            // Projected closing = DB closing MINUS this pending application (only for the active row)
            const projectedTotal = isActive ? closingTotal - leavesActual : closingTotal;
            const projectedEarned = isActive ? closingEarned - leavesActual : closingEarned;

            const isHighlighted = isActive ? 'highlight' : '';

            return `
        <tr class="${isHighlighted}">
            <td>${lt.label}</td>
            <td class="right">${openingTotal.toFixed(2)}</td>
            <td class="right">${openingEarned.toFixed(2)}</td>
            <td class="right">${additionsTotal.toFixed(2)}</td>
            <td class="right">${additionsEarned.toFixed(2)}</td>
            <td class="right"><strong>${leavesActual > 0 ? leavesActual.toFixed(2) : '0.00'}</strong></td>
            <td class="right"><strong style="${projectedTotal < 0 ? 'color: red;' : ''}">${projectedTotal.toFixed(2)}</strong></td>
            <td class="right"><strong style="${projectedEarned < 0 ? 'color: red;' : ''}">${projectedEarned.toFixed(2)}</strong></td>
        </tr>
    `;
        }).join('');
        const applicationIdDisplay = formData.applicationId && formData.applicationId !== "BGLA-"
            ? formData.applicationId
            : "Pending";

        const printHTML = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Leave Application - ${applicationIdDisplay}</title>
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
                    .dates{min-width: 19%!important;}
                    .info-label { font-size: 11px; color: #777; margin-bottom: 4px; }
                    .info-value { font-size: 14px; font-weight: 400; padding-bottom: 6px; border-bottom: 1px solid #eee; }
                    .info-value.highlight { font-weight: 700; }
                    .details-grid { display: flex; gap: 16px; width: 100%; flex-wrap: wrap; }
                    .details-grid .info-item{ flex: 1; min-width: 0; }
                    .full-width { width: 100%; display: block; margin-bottom: 20px; margin-top: 16px; }
                    .reason-box { padding: 12px; border: 1px solid #eee; border-radius: 4px; min-height: 80px; line-height: 1.6; width: 100%; background: #f9f9f9; }
                    
                    .balance-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
                    .balance-table th, .balance-table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                    .balance-table th { background: #f5f5f5; font-weight: 700; font-size: 12px; }
                    .balance-table th.center { text-align: center; }
                    .balance-table td.right { text-align: right; }
                    .balance-table tr.highlight { background-color: #e3f2fd; }
                    .balance-table tr.highlight td { font-weight: 700; }
                    .balance-table td strong { font-weight: 700; }
                    
                    .approval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #ddd; }
                    .approval-title { font-size: 16px; font-weight: 700; }
                    .signature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 130px; }
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
                            <span><strong>Application ID:</strong> ${applicationIdDisplay}</span>
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
                                <div class="info-label">Duration</div>
                                <div class="info-value">${formData.duration === 'half-day' ? 'Half Day (0.5)' : formData.duration === 'short-day' ? 'Short Day (0.75)' : 'Full Day'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Paid / Unpaid</div>
                                <div class="info-value">${formData.paidStatus}</div>
                            </div>
                            <div class="info-item dates">
                                <div class="info-label">From</div>
                                <div class="info-value highlight">${formatDate(formData.startDate)}</div>
                            </div>
                            <div class="info-item dates">
                                <div class="info-label">To</div>
                                <div class="info-value highlight">${formatDate(formData.endDate)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Total Days</div>
                                <div class="info-value highlight">${formData.weight || "0"}</div>
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
                                    <th rowspan="2">Particulars</th>
                                    <th colspan="2" class="center">Opening</th>
                                    <th colspan="2" class="center">Additions</th>
                                    <th class="center">Leaves</th>
                                    <th colspan="2" class="center">Closing</th>
                                </tr>
                                <tr>
                                    <th class="center">Total</th>
                                    <th class="center">Earned</th>
                                    <th class="center">Total</th>
                                    <th class="center">Earned</th>
                                    <th class="center">Actual</th>
                                    <th class="center">Total</th>
                                    <th class="center">Earned</th>
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
                                <Box component="img" src={logo} alt="Bodla Group" sx={{ height: 80, width: "auto", objectFit: "contain", display: "block", mx: { xs: "auto", md: 0 } }} />
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
                                <Typography variant="body2">
                                    <strong>Application ID:</strong>
                                    {formData.applicationId && formData.applicationId !== "BGLA-" ? (
                                        <span style={{ color: theme.palette.primary.main, marginLeft: '8px' }}>
                                            {formData.applicationId}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#666', marginLeft: '8px' }}>
                                            {loading ? "Submitting..." : "BGLA-"}
                                        </span>
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
                                    required
                                    error={!!errors.employeeCode}
                                    helperText={errors.employeeCode}
                                    size="small"
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: fetchingEmployee && <CircularProgress size={20} />,
                                    }}
                                    sx={{ "& input": { bgcolor: "#e3f2fd", fontWeight: "bold" } }}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Employee Name *"
                                    name="employeeName"
                                    value={formData.employeeName}
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
                            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Leave Type</InputLabel>
                                    <Select value={formData.leaveType} onChange={handleChange("leaveType")} label="Leave Type">
                                        {leaveTypes.map(lt => (
                                            <MenuItem key={lt.value} value={lt.value}>{lt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Duration</InputLabel>
                                    <Select value={formData.duration} onChange={handleChange("duration")} label="Duration">
                                        <MenuItem value="full-day">Full Day</MenuItem>
                                        <MenuItem value="half-day">Half Day (0.5)</MenuItem>
                                        <MenuItem value="short-day">Short Day (0.75)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Paid/Unpaid</InputLabel>
                                    <Select value={formData.paidStatus} onChange={handleChange("paidStatus")} label="Paid/Unpaid">
                                        <MenuItem value="Paid">Paid</MenuItem>
                                        <MenuItem value="Unpaid">Unpaid</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 2.5 }}>
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
                            <Grid item size={{ xs: 12, sm: 6, md: 2.5 }}>
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
                                    sx={{ "& input": { bgcolor: "#f9f9f9", fontWeight: "bold" } }}
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
                        {isFetchingBalance ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={30} />
                                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                                    Loading leave balances...
                                </Typography>
                            </Box>
                        ) : (
                            <LeaveBalanceTable isPrint={false} />
                        )}
                    </Box>

                    {/* Approval Information */}
                    <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>Approval Information</Typography>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Prepared By *"
                                    value={formData.preparedBy}
                                    onChange={handleChange("preparedBy")}
                                    error={!!errors.preparedBy}
                                    helperText={errors.preparedBy}
                                    size="small"
                                    InputProps={{ readOnly: true }}
                                    sx={{ "& input": { bgcolor: "#e3f2fd", fontWeight: "bold" } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <SignatureBlock />

                    <Divider sx={{ my: 3 }} />
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={handleReset} startIcon={<RestartAltIcon />} size="large">Reset</Button>
                        <Button variant="contained" onClick={handleSubmit} startIcon={<SendIcon />} size="large" sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }} disabled={loading}>
                            {loading ? "Submitting..." : "Submit Application"}
                        </Button>
                    </Stack>
                </Box>
            ) : (
                // Print Preview
                <Box ref={printRef} sx={{ bgcolor: "white", p: 4, minHeight: "297mm", maxWidth: "210mm", mx: "auto", boxShadow: 3 }}>
                    {/* Header */}
                    <Box sx={{ mb: 3, pb: 2, borderBottom: "2px solid #333" }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item size={{ xs: 12, md: 2 }}>
                                <Box component="img" src={logo} alt="Bodla Group"
                                    sx={{ height: 70, width: "auto", objectFit: "contain", display: "block", mx: { xs: "auto", md: 0 } }} />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 10 }}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 800, letterSpacing: 2 }}>
                                        BODLA GROUP
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, color: "#555" }}>
                                        Leave Application Form
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    <strong>Application ID:</strong>
                                    {formData.applicationId && formData.applicationId !== "BGLA-" ? (
                                        <span style={{ color: theme.palette.primary.main, marginLeft: '8px', fontWeight: 700 }}>
                                            {formData.applicationId}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#666', marginLeft: '8px' }}>BGLA-</span>
                                    )}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    <strong>Application Date:</strong> {formatDate(formData.applicationDate)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Employee Information - Print */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>
                            Employee Information
                        </Typography>
                        <Grid container spacing={2}>
                            {[
                                { label: "Employee Code", value: formData.employeeCode },
                                { label: "Employee Name", value: formData.employeeName },
                                { label: "Designation", value: formData.designation },
                                { label: "Department", value: formData.department },
                            ].map(({ label, value }) => (
                                <Grid item size={{ xs: 6, md: 3 }} key={label}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        {label}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, pb: 1, borderBottom: "1px solid #eee" }}>
                                        {value || "—"}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Leave Details - Print */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>
                            Leave Details
                        </Typography>
                        <Grid container spacing={1.5}>
                            <Grid item size={{ xs: 6, md: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Leave Type
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {leaveTypes.find(lt => lt.value === formData.leaveType)?.label || "—"}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Duration
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {formData.duration === 'half-day' ? 'Half Day' :
                                        formData.duration === 'short-day' ? 'Short Day' : 'Full Day'}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Paid / Unpaid
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {formData.paidStatus}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 2.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    From
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3, pb: 1, borderBottom: "1px solid #eee", color: theme.palette.primary.main }}>
                                    {formatDate(formData.startDate)}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 2.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    To
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3, pb: 1, borderBottom: "1px solid #eee", color: theme.palette.primary.main }}>
                                    {formatDate(formData.endDate)}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 6, md: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Total Days
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3, pb: 0.3, borderBottom: "1px solid #eee", color: theme.palette.primary.main, fontSize: '1.1rem' }}>
                                    {formData.weight || "0"}
                                </Typography>
                            </Grid>
                            <Grid item size={12}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Reason for Leave
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.3, p: 2, bgcolor: "#f9f9f9", borderRadius: 1, border: "1px solid #eee", minHeight: 70 }}>
                                    {formData.reason || "—"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Leave Balance Summary - Print */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>
                            Leave Balance Summary
                        </Typography>
                        <LeaveBalanceTable isPrint={true} />
                    </Box>

                    {/* Approval Information - Print */}
                    <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    Approval Information
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 500 }}>
                                    <strong>Prepared By:</strong> {formData.preparedBy || "—"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Signature Block */}
                    <Grid container spacing={3} sx={{ mt: 4, mb: 2 }}>
                        {["Employee", "Reporting Manager", "Department Head", "HR"].map((role) => (
                            <Grid item size={{ xs: 6, sm: 3 }} key={role}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, pt: 3, borderTop: "2px solid #000", minHeight: 40 }}>
                                        {role}
                                    </Typography>
                                    {/* <Typography variant="caption" color="text.secondary">
                                        Signature & Date
                                    </Typography> */}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Print Buttons - Hidden when printing */}
                    <Box sx={{ mt: 4, textAlign: "center" }} className="no-print">
                        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                            <Button
                                variant="outlined"
                                onClick={() => setShowPrintPreview(false)}
                                startIcon={<RestartAltIcon />}
                                size="large"
                            >
                                Back to Edit
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handlePrint}
                                startIcon={<PrintIcon />}
                                size="large"
                                sx={{
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                                    }
                                }}
                            >
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