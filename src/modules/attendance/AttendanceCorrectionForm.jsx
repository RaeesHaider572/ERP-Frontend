import React, { useState, useEffect, useRef } from "react";
import { applyAttendanceCorrection, getCorrectionRequestById } from "../../services/attendanceCorrectionService";
import api from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
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
    Card,
    CardContent,
    useTheme,
    CircularProgress,
    Autocomplete,
} from "@mui/material";
import {
    Send as SendIcon,
    RestartAlt as RestartAltIcon,
    Print as PrintIcon,
} from "@mui/icons-material";
import logo from "../../assets/BodlaGroupLogo.svg";

const AttendanceCorrectionForm = () => {
    const theme = useTheme();
    const { user, isCustodian } = useAuth();
    const printRef = useRef();

    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const getCurrentTime = () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    const initialState = {
        employeeCode: "",
        employeeName: "",
        designation: "",
        department: "",
        punchDate: getTodayDate(),
        punchTime: getCurrentTime(),
        punchType: 0,
        deviceName: "Web",
        reason: "",
        employeeId: null,
        requestId: null,
        appliedDate: "",
        preparedBy: "",
        rawPunchTime: "",
        isLoadingEmployee: false,
    };

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [fetchingEmployee, setFetchingEmployee] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedTeamMember, setSelectedTeamMember] = useState(null);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const submittingRef = useRef(false);

    // ============================================
    // FETCH TEAM MEMBERS (for Custodian)
    // ============================================
    const fetchTeamMembers = async () => {
        if (!isCustodian() || !user?.EmployeeID) return;
        
        setLoadingTeam(true);
        try {
            const res = await api.get(`/employees/team/${user.EmployeeID}`);
            let data = [];
            if (res.data?.data) data = res.data.data;
            else if (Array.isArray(res.data)) data = res.data;

            const formattedData = data.map(emp => ({
                label: `${emp.Name} (${emp.EmployeeCode})`,
                EmployeeID: emp.EmployeeID,
                Name: emp.Name,
                EmployeeCode: emp.EmployeeCode,
                Designation: emp.Designation || "",
                Department: emp.Department || "",
            }));
            setTeamMembers(formattedData);

            // ✅ After team members are loaded, check if we have an employee code from URL
            const params = new URLSearchParams(window.location.search);
            const employeeCode = params.get('employeeCode');
            
            if (employeeCode && !formData.employeeId) {
                fetchEmployeeByCode(employeeCode);
            }
        } catch (error) {
            console.error("❌ Error fetching team members:", error);
            setSnackbar({
                open: true,
                message: "Failed to load team members",
                severity: "error",
            });
        } finally {
            setLoadingTeam(false);
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
                isLoadingEmployee: false,
            }));
            return;
        }

        setFetchingEmployee(true);
        setFormData((prev) => ({ ...prev, isLoadingEmployee: true }));
        
        try {
            const res = await api.get(`/employees/code/${code}`);
            const emp = res.data?.data;

            if (emp) {
                // ✅ Find if this employee is in the team members list
                const foundTeamMember = teamMembers.find(
                    tm => tm.EmployeeCode === code || tm.EmployeeID === emp.EmployeeID
                );

                setFormData((prev) => ({
                    ...prev,
                    employeeName: emp.Name || "",
                    designation: emp.Designation || "",
                    department: emp.Department || "",
                    employeeId: emp.EmployeeID || null,
                    employeeCode: code,
                    preparedBy: user?.Name || prev.preparedBy || "",
                    isLoadingEmployee: false,
                }));

                // ✅ If this is a team member, update selected team member
                if (foundTeamMember) {
                    setSelectedTeamMember(foundTeamMember);
                } else if (isCustodian() && emp.EmployeeID !== user?.EmployeeID) {
                    // ✅ If employee is not in team list but custodian, still allow
                    // but don't set selected team member
                    setSelectedTeamMember(null);
                }

                setSnackbar({
                    open: true,
                    message: `Employee ${emp.Name} loaded successfully`,
                    severity: "success",
                });
            } else {
                setFormData((prev) => ({
                    ...prev,
                    isLoadingEmployee: false,
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
                isLoadingEmployee: false,
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
    // AUTO-FILL LOGGED-IN EMPLOYEE
    // ============================================
    useEffect(() => {
        if (user) {
            const employeeCode = user.EmployeeCode || user.employeeCode || "";
            let formattedCode = employeeCode;
            if (formattedCode && !formattedCode.includes('-')) {
                if (formattedCode.startsWith('EMP')) {
                    const numPart = formattedCode.replace('EMP', '');
                    formattedCode = `EMP-${numPart}`;
                }
            }

            // ✅ Only set if not already set from URL parameter
            setFormData((prev) => ({
                ...prev,
                employeeCode: prev.employeeCode || formattedCode,
                employeeName: prev.employeeName || user.Name || "",
                designation: prev.designation || user.Designation || "",
                department: prev.department || user.Department || "",
                employeeId: prev.employeeId || user.EmployeeID || null,
                preparedBy: user.Name || "",
            }));

            if (isCustodian()) {
                fetchTeamMembers();
            }
        }
    }, [user]);

    // ============================================
    // ✅ URL PARAMETER HANDLER - Auto-fill from employeeCode
    // ============================================
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const employeeCode = params.get('employeeCode');
        
        if (employeeCode) {
            // ✅ Clear any existing selection
            setSelectedTeamMember(null);
            
            // ✅ Set the employee code and fetch details
            setFormData((prev) => ({
                ...prev,
                employeeCode: employeeCode,
                employeeName: "",
                designation: "",
                department: "",
                employeeId: null,
            }));
            
            // ✅ Fetch employee details
            fetchEmployeeByCode(employeeCode);
        }
    }, []);

    // ============================================
    // HANDLE TEAM MEMBER SELECT (Custodian Only)
    // ============================================
    const handleTeamMemberSelect = (event, value) => {
        if (value) {
            setSelectedTeamMember(value);
            setFormData((prev) => ({
                ...prev,
                employeeCode: value.EmployeeCode,
                employeeName: value.Name,
                designation: value.Designation || "",
                department: value.Department || "",
                employeeId: value.EmployeeID,
                preparedBy: user?.Name || "",
            }));
            
            setSnackbar({
                open: true,
                message: `Selected: ${value.Name}`,
                severity: "success",
            });
        } else {
            setSelectedTeamMember(null);
            if (user) {
                setFormData((prev) => ({
                    ...prev,
                    employeeCode: user.EmployeeCode || "",
                    employeeName: user.Name || "",
                    designation: user.Designation || "",
                    department: user.Department || "",
                    employeeId: user.EmployeeID || null,
                    preparedBy: user.Name || "",
                }));
            }
        }
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
    };

    const handlePunchTypeChange = (event) => {
        const value = parseInt(event.target.value);
        setFormData((prev) => ({ ...prev, punchType: value }));
        if (errors.punchType) {
            setErrors((prev) => {
                const e = { ...prev };
                delete e.punchType;
                return e;
            });
        }
    };

    const handleEmployeeCodeSearch = (event) => {
        const code = event.target.value;
        setFormData((prev) => ({ ...prev, employeeCode: code }));
        if (errors.employeeCode) {
            setErrors((prev) => {
                const e = { ...prev };
                delete e.employeeCode;
                return e;
            });
        }
        // Clear selected team member when typing
        if (selectedTeamMember) {
            setSelectedTeamMember(null);
        }
    };

    const handleEmployeeCodeBlur = () => {
        if (formData.employeeCode && !formData.employeeId) {
            fetchEmployeeByCode(formData.employeeCode);
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
        if (!formData.punchDate) newErrors.punchDate = "Punch Date is required";
        if (!formData.punchTime) newErrors.punchTime = "Punch Time is required";
        if (formData.punchType === undefined || formData.punchType === null) {
            newErrors.punchType = "Punch Type is required";
        }
        if (!formData.deviceName) newErrors.deviceName = "Device Name is required";
        if (!formData.reason) newErrors.reason = "Reason is required";

        if (formData.punchDate) {
            const selectedDate = new Date(formData.punchDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDateOnly = new Date(selectedDate);
            selectedDateOnly.setHours(0, 0, 0, 0);

            if (selectedDateOnly > today) {
                newErrors.punchDate = "Punch date cannot be in the future";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================
    // HANDLE SUBMIT
    // ============================================
    const handleSubmit = async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;

        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: "Please fill in all required fields",
                severity: "error"
            });
            submittingRef.current = false;
            return;
        }

        if (!formData.employeeId) {
            setSnackbar({
                open: true,
                message: "Employee not found. Please enter a valid employee code or select a team member.",
                severity: "error",
            });
            submittingRef.current = false;
            return;
        }

        setLoading(true);
        try {
            const dateStr = formData.punchDate;
            const timeStr = formData.punchTime;

            const punchDateTime = new Date(`${dateStr}T${timeStr}`);

            const year = punchDateTime.getFullYear();
            const month = String(punchDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(punchDateTime.getDate()).padStart(2, '0');
            const hours = String(punchDateTime.getHours()).padStart(2, '0');
            const minutes = String(punchDateTime.getMinutes()).padStart(2, '0');
            const seconds = String(punchDateTime.getSeconds()).padStart(2, '0');

            const localTimeStr = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

            const payload = {
                EmployeeID: parseInt(formData.employeeId),
                PunchTime: localTimeStr,
                PunchType: formData.punchType,
                DeviceName: formData.deviceName,
                Reason: formData.reason,
            };

            console.log("📤 Sending payload:", payload);

            const response = await applyAttendanceCorrection(payload);
            const responseData = response.data || response;
            const requestId = responseData?.RequestID;

            if (requestId) {
                try {
                    const printDataResponse = await getCorrectionRequestById(requestId);
                    const printData = printDataResponse.data || printDataResponse;

                    const rawPunchTime = printData.PunchTime || new Date().toISOString();
                    
                    let punchDateStr = formData.punchDate;
                    let punchTimeStr = formData.punchTime;
                    
                    if (rawPunchTime) {
                        const dateMatch = rawPunchTime.match(/^(\d{4})-(\d{2})-(\d{2})/);
                        const timeMatch = rawPunchTime.match(/(\d{2}):(\d{2}):(\d{2})/);
                        
                        if (dateMatch) {
                            punchDateStr = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                        }
                        if (timeMatch) {
                            punchTimeStr = `${timeMatch[1]}:${timeMatch[2]}`;
                        }
                    }

                    setFormData((prev) => ({
                        ...prev,
                        requestId: requestId,
                        appliedDate: printData.AppliedDate || new Date().toISOString(),
                        punchDate: punchDateStr,
                        punchTime: punchTimeStr,
                        rawPunchTime: rawPunchTime,
                        punchType: printData.PunchType !== undefined ? printData.PunchType : prev.punchType,
                        deviceName: printData.DeviceName || prev.deviceName,
                        reason: printData.Reason || prev.reason,
                        employeeName: printData.EmployeeName || prev.employeeName,
                        employeeCode: printData.EmployeeCode || prev.employeeCode,
                        designation: printData.Designation || prev.designation,
                        department: printData.Department || prev.department,
                    }));
                } catch (fetchError) {
                    console.error("❌ Error fetching request details:", fetchError);
                    setFormData((prev) => ({
                        ...prev,
                        requestId: requestId,
                        appliedDate: new Date().toISOString(),
                    }));
                }

                setSubmitted(true);
                setSnackbar({
                    open: true,
                    message: `Attendance correction submitted successfully! Request ID: BGAC-${requestId}`,
                    severity: "success",
                });

                setTimeout(() => {
                    setShowPrintPreview(true);
                }, 1500);
            } else {
                throw new Error("No RequestID returned from server");
            }
        } catch (error) {
            console.error("❌ Submit error:", error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || "Failed to submit attendance correction",
                severity: "error",
            });
        } finally {
            setLoading(false);
            submittingRef.current = false;
        }
    };

    // ============================================
    // HANDLE RESET
    // ============================================
    const handleReset = () => {
        setFormData({
            ...initialState,
            punchDate: getTodayDate(),
            punchTime: getCurrentTime(),
            deviceName: "Web",
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
        setSubmitted(false);
        setShowPrintPreview(false);
        setSelectedTeamMember(null);
    };

    // ============================================
    // FORMAT DATE - WITHOUT TIMEZONE CONVERSION
    // ============================================
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const day = parseInt(parts[2]);
                const date = new Date(year, month, day);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "—";
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return "—";
        }
    };

    // ============================================
    // FORMAT DATE TIME - WITHOUT TIMEZONE CONVERSION
    // ============================================
    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "—";
            
            const month = date.toLocaleString('en-US', { month: 'long' });
            const day = date.getDate();
            const year = date.getFullYear();
            
            return `${month} ${day}, ${year}`;
        } catch (error) {
            return "—";
        }
    };

    // ============================================
    // FORMAT TIME ONLY - WITHOUT TIMEZONE CONVERSION
    // ============================================
    const formatTimeOnly = (timeString) => {
        if (!timeString) return "—";
        try {
            if (timeString.includes('T') || timeString.includes(':')) {
                const timeMatch = timeString.match(/(\d{2}):(\d{2})/);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = timeMatch[2];
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12;
                    return `${hours}:${minutes} ${ampm}`;
                }
                const date = new Date(timeString);
                if (isNaN(date.getTime())) return timeString;
                let hours = date.getHours();
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                return `${hours}:${minutes} ${ampm}`;
            }
            return timeString;
        } catch (error) {
            return timeString || "—";
        }
    };

    // ============================================
    // GET PUNCH TYPE LABEL
    // ============================================
    const getPunchTypeLabel = (type) => {
        return type === 0 ? "IN" : "OUT";
    };

    // ============================================
    // HANDLE PRINT
    // ============================================
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const applicationIdDisplay = formData.requestId ? `${formData.requestId}` : "Pending";

        let punchDateStr = formData.punchDate;
        let punchTimeStr = formData.punchTime;

        if (formData.rawPunchTime) {
            const dateMatch = formData.rawPunchTime.match(/^(\d{4})-(\d{2})-(\d{2})/);
            const timeMatch = formData.rawPunchTime.match(/(\d{2}):(\d{2})/);
            
            if (dateMatch) {
                const year = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]) - 1;
                const day = parseInt(dateMatch[3]);
                const date = new Date(year, month, day);
                punchDateStr = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2];
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                punchTimeStr = `${hours}:${minutes} ${ampm}`;
            }
        } else {
            const punchDateObj = new Date(formData.punchDate);
            punchDateStr = punchDateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (formData.punchTime) {
                const timeParts = formData.punchTime.split(':');
                if (timeParts.length === 2) {
                    let hours = parseInt(timeParts[0]);
                    const minutes = timeParts[1];
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12 || 12;
                    punchTimeStr = `${hours}:${minutes} ${ampm}`;
                }
            }
        }

        const appliedDateObj = new Date(formData.appliedDate || new Date());
        const appliedDateStr = appliedDateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printHTML = `
<!DOCTYPE html>
<html>
    <head>
        <title>Attendance Correction - ${applicationIdDisplay}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: white; padding: 40px; color: #333; }
            .print-container { max-width: 210mm; margin: 0 auto; background: white; }
            
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
                font-size: 20px; 
                font-weight: 800; 
                letter-spacing: 2px; 
            }
            .form-title { 
                font-size: 24px; 
                font-weight: 600; 
                margin-top: 8px; 
                color: #333; 
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
                background: #f9f9f9; 
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
            .signature-header { 
                display: flex; 
                justify-content: space-between; 
                margin-top: 150px; width: 100%;
            }
            .signature-grid { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 20px; 
                margin-top: 130px; 
                margin-bottom: 0;
                align-items: end;
            }
            .signature-box { 
                text-align: center; 
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                height: 100%;
            }
            .signature-line { 
                border-top: 1px solid #000; 
                padding-top: 8px; 
                margin-top: 4px; 
                font-size: 12px; 
            }
            
            .no-print { display: none; }
            
            @media print { 
                body { padding: 15mm; } 
                @page { size: A4; margin: 0; } 
                .no-print { display: none !important; }
            }
        </style>
    </head>
    <body>
        <div class="print-container">
            <!-- Header -->
            <div class="header">
                <div class="header-logo">
                    <img src="${logo}" alt="Bodla Group Logo" />
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

            <!-- Employee Information -->
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

            <!-- Correction Details -->
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
                        <div class="info-value highlight">${getPunchTypeLabel(formData.punchType)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Device Name</div>
                        <div class="info-value">${formData.deviceName || "Web"}</div>
                    </div>
                </div>
                <div style="width: 100%; margin-top: 12px;">
                    <div class="info-label">Reason for Correction</div>
                    <div class="reason-box">${formData.reason || "—"}</div>
                </div>
            </div>

            <!-- Approval Information -->
            <div class="approval-header">
                <div class="approval-title">Approval Information</div>
                <div><strong>Prepared By:</strong> ${formData.preparedBy || "—"}</div>
            </div>

            <!-- Signature Block - Bottom Aligned -->
            <div  class="signature-header">
                <div style="text-align: center; flex: 1;">
                    <div style="border-top: 1px solid #000; padding-top: 8px; margin: 0 10px;">
                        <span style="font-size: 12px;">Employee</span>
                    </div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="border-top: 1px solid #000; padding-top: 8px; margin: 0 10px;">
                        <span style="font-size: 12px;">Reporting Manager</span>
                    </div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="border-top: 1px solid #000; padding-top: 8px; margin: 0 10px;">
                        <span style="font-size: 12px;">Department Head</span>
                    </div>
                </div>
                <div style="text-align: center; flex: 1;">
                    <div style="border-top: 1px solid #000; padding-top: 8px; margin: 0 10px;">
                        <span style="font-size: 12px;">HR</span>
                    </div>
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
                <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, maxWidth: "21cm", mx: "auto" }}>
                    {/* Company Header */}
                    <Box sx={{ mb: 4, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item size={{ xs: 12, md: 2 }}>
                                <Box component="img" src={logo} alt="Bodla Group"
                                    sx={{width: "auto", objectFit: "contain", display: "block", mx: { xs: "auto", md: 0 } }} />
                            </Grid>
                            <Grid item size={{ xs: 12, md: 8 }}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>
                                        BODLA GROUP
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
                                        Attendance Correction Request
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 2 }}></Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2">
                                    <strong>Request ID:</strong>
                                    {submitted && formData.requestId ? (
                                        <span style={{ color: theme.palette.primary.main, marginLeft: '8px' }}>
                                            BGAC-{formData.requestId}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#666', marginLeft: '8px' }}>
                                            {loading ? "Submitting..." : "New Request"}
                                        </span>
                                    )}
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
                                <Typography variant="body2">
                                    <strong>Date:</strong> {formatDate(new Date().toISOString().split('T')[0])}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Employee Information */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>
                            Employee Information
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Employee Code *"
                                    name="employeeCode"
                                    value={formData.employeeCode}
                                    onChange={handleEmployeeCodeSearch}
                                    onBlur={handleEmployeeCodeBlur}
                                    required
                                    error={!!errors.employeeCode}
                                    helperText={errors.employeeCode}
                                    size="small"
                                    InputProps={{
                                        readOnly: submitted || !!selectedTeamMember,
                                        endAdornment: fetchingEmployee && <CircularProgress size={20} />,
                                    }}
                                    sx={{ "& input": { bgcolor: submitted ? "#f5f5f5" : "#e3f2fd", fontWeight: "bold" } }}
                                    disabled={submitted || !!selectedTeamMember}
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

                    {/* Attendance Correction Details */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>
                            Correction Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Punch Date *"
                                    type="date"
                                    value={formData.punchDate}
                                    onChange={handleChange("punchDate")}
                                    required
                                    error={!!errors.punchDate}
                                    helperText={errors.punchDate}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    disabled={submitted}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Punch Time *"
                                    type="time"
                                    value={formData.punchTime}
                                    onChange={handleChange("punchTime")}
                                    required
                                    error={!!errors.punchTime}
                                    helperText={errors.punchTime}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    disabled={submitted}
                                />
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth size="small" error={!!errors.punchType} disabled={submitted}>
                                    <InputLabel>Punch Type *</InputLabel>
                                    <Select
                                        value={formData.punchType}
                                        onChange={handlePunchTypeChange}
                                        label="Punch Type *"
                                    >
                                        <MenuItem value={0}>IN</MenuItem>
                                        <MenuItem value={1}>OUT</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Device Name *"
                                    value={formData.deviceName}
                                    onChange={handleChange("deviceName")}
                                    required
                                    error={!!errors.deviceName}
                                    helperText={errors.deviceName}
                                    size="small"
                                    placeholder="e.g., Web, Office Main Door"
                                    disabled={submitted}
                                />
                            </Grid>
                            <Grid item size={12}>
                                <TextField
                                    fullWidth
                                    label="Reason for Correction *"
                                    value={formData.reason}
                                    onChange={handleChange("reason")}
                                    required
                                    error={!!errors.reason}
                                    helperText={errors.reason}
                                    multiline
                                    rows={3}
                                    placeholder="Please provide a detailed reason for attendance correction..."
                                    disabled={submitted}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Approval Information */}
                    <Box sx={{ mb: 2, pb: 2, borderBottom: "2px solid #ddd" }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                    Approval Information
                                </Typography>
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

                    {/* Signature Block */}
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        {["Employee", "Reporting Manager", "Department Head", "HR"].map((role) => (
                            <Grid item size={{ xs: 6, sm: 3 }} key={role}>
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography variant="body2" sx={{ fontWeight: "bold", pt: 3, borderTop: "2px solid #ddd" }}>
                                        {role}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Instructions */}
                    <Box sx={{ mt: 3, mb: 2 }}>
                        <Card variant="outlined" sx={{ bgcolor: "#f5f5f5" }}>
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                    Instructions:
                                </Typography>
                                <Typography variant="body2">
                                    1. Please ensure the punch date and time are correct
                                </Typography>
                                <Typography variant="body2">
                                    2. Provide a clear reason for the correction
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    <Divider sx={{ my: 3 }} />
                    <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap">
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                            startIcon={<RestartAltIcon />}
                            size="large"
                            disabled={loading}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            startIcon={<SendIcon />}
                            size="large"
                            sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}
                            disabled={loading || submitted}
                        >
                            {loading ? "Submitting..." : "Submit Request"}
                        </Button>
                    </Stack>
                </Paper>
            ) : (
                // ============================================
                // PRINT PREVIEW
                // ============================================
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
                                        Attendance Correction Request
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    <strong>Request ID:</strong>
                                    <span style={{ marginLeft: '8px', fontWeight: 700 }}>
                                        {formData.requestId ? `BGAC-${formData.requestId}` : 'Pending'}
                                    </span>
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    <strong>Application Date:</strong> {formatDate(formData.appliedDate)}
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

                    {/* Correction Details - Print */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, pb: 1, borderBottom: "2px solid #ddd", color: theme.palette.primary.main }}>
                            Correction Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item size={{ xs: 12, md: 3 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Punch Date
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3, pb: 1, borderBottom: "1px solid #eee", color: theme.palette.primary.main }}>
                                    {formatDate(formData.punchDate)}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Punch Time
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3, pb: 1, borderBottom: "1px solid #eee", color: theme.palette.primary.main }}>
                                    {formatTimeOnly(formData.punchTime)}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Punch Type
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.3, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {getPunchTypeLabel(formData.punchType)}
                                </Typography>
                            </Grid>
                            <Grid item size={{ xs: 12, md: 3 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Device Name
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3, pb: 1, borderBottom: "1px solid #eee" }}>
                                    {formData.deviceName || "Web"}
                                </Typography>
                            </Grid>
                            <Grid item size={12}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Reason for Correction
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.3, p: 2, bgcolor: "#f9f9f9", borderRadius: 1, border: "1px solid #eee", minHeight: 60 }}>
                                    {formData.reason || "—"}
                                </Typography>
                            </Grid>
                        </Grid>
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

                    {/* Signature Block - Bottom Aligned */}
                    <Box sx={{ mt: 13, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        {["Employee", "Reporting Manager", "Department Head", "HR"].map((role) => (
                            <Box key={role} sx={{ textAlign: 'center', flex: 1, mx: 1 }}>
                                <Box sx={{ borderTop: '2px solid #000', pt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {role}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

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

export default AttendanceCorrectionForm;