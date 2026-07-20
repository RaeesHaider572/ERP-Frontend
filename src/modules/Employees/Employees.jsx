import React, { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Grid,
    useTheme,
    alpha,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar
} from "@mui/material";
import {
    Add as AddIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    People as PeopleIcon,
    Business as BusinessIcon,
    CalendarToday as CalendarIcon,
    Close as CloseIcon,
    Save as SaveIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Badge as BadgeIcon,
    Work as WorkIcon,
    PermIdentity as PermIdentityIcon
} from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStats
} from "../../services/employeeService";

function Employees() {
    const theme = useTheme();
    const { user, isCustodian, isHR, isEmployee } = useAuth();
    const navigate = useNavigate();

    const [employees, setEmployees] = useState([]);
    const [stats, setStats] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const [form, setForm] = useState({
        Name: "",
        DeviceUid: "",
        Email: "",
        Department: "",
        Designation: "",
        JoinDate: "",
        EmployeeCode: "",
        Role: "employee",
        CustodianID: null
    });

    // ✅ FETCH EMPLOYEES
    const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getEmployees({ search: searchTerm || undefined });
            let employeesData = [];
            if (res.data && res.data.data) {
                employeesData = Array.isArray(res.data.data) ? res.data.data : [];
            } else if (res.data && Array.isArray(res.data)) {
                employeesData = res.data;
            }
            setEmployees(employeesData);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError(err.response?.data?.message || "Error fetching employees");
            showSnackbar(err.response?.data?.message || "Error fetching employees", "error");
        } finally {
            setLoading(false);
        }
    };

    // ✅ FETCH STATS
    const fetchStats = async () => {
        if (!isHR()) return;
        try {
            const res = await getEmployeeStats();
            if (res.data && res.data.data) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    useEffect(() => {
        if (user && (isHR() || isCustodian())) {
            fetchEmployees();
            fetchStats();
        }
    }, [user, isHR, isCustodian]);

    // ✅ Show snackbar
    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (isEmployee() && !isCustodian() && !isHR()) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    <Typography variant="h6">⛔ Access Denied</Typography>
                    <Typography>You do not have permission to view this page. Only HR and Custodian can access employee management.</Typography>
                </Alert>
            </Box>
        );
    }

    const handleApplyForTeamMember = (employeeCode) => {
        navigate(`/LeaveApply?employeeCode=${employeeCode}`);
    };

    const handleApplyCorrectionForTeamMember = (employeeCode) => {
        navigate(`/attendance-correction/apply?employeeCode=${employeeCode}`);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.Name.trim()) {
            showSnackbar("Employee name is required", "error");
            return;
        }

        try {
            const submitData = {
                ...form,
                DeviceUid: form.DeviceUid ? parseInt(form.DeviceUid) : null,
                JoinDate: form.JoinDate || null,
                CustodianID: form.CustodianID ? parseInt(form.CustodianID) : null
            };

            if (editingEmployee) {
                await updateEmployee(editingEmployee.EmployeeID, submitData);
                showSnackbar("Employee updated successfully", "success");
            } else {
                await createEmployee(submitData);
                showSnackbar("Employee created successfully", "success");
            }

            setShowModal(false);
            resetForm();
            fetchEmployees();
            fetchStats();
        } catch (err) {
            console.error("Error saving employee:", err);
            showSnackbar(err.response?.data?.message || "Error saving employee", "error");
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setForm({
            Name: employee.Name || "",
            DeviceUid: employee.DeviceUid || "",
            Email: employee.Email || "",
            Department: employee.Department || "",
            Designation: employee.Designation || "",
            JoinDate: employee.JoinDate ? employee.JoinDate.split('T')[0] : "",
            EmployeeCode: employee.EmployeeCode || "",
            Role: employee.Role || "employee",
            CustodianID: employee.CustodianID || null
        });
        setShowModal(true);
    };

    const handleDelete = async (employeeId, employeeName) => {
        if (window.confirm(`Are you sure you want to delete ${employeeName}?`)) {
            try {
                await deleteEmployee(employeeId);
                showSnackbar("Employee deleted successfully", "success");
                fetchEmployees();
                fetchStats();
            } catch (err) {
                console.error("Error deleting employee:", err);
                showSnackbar(err.response?.data?.message || "Error deleting employee", "error");
            }
        }
    };

    const resetForm = () => {
        setForm({
            Name: "",
            DeviceUid: "",
            Email: "",
            Department: "",
            Designation: "",
            JoinDate: "",
            EmployeeCode: "",
            Role: "employee",
            CustodianID: null
        });
        setEditingEmployee(null);
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter(emp => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (emp.Name && emp.Name.toLowerCase().includes(searchLower)) ||
            (emp.EmployeeCode && emp.EmployeeCode.toLowerCase().includes(searchLower)) ||
            (emp.DeviceUid && emp.DeviceUid.toString().includes(searchLower)) ||
            (emp.Email && emp.Email.toLowerCase().includes(searchLower)) ||
            (emp.Department && emp.Department.toLowerCase().includes(searchLower)) ||
            (emp.Designation && emp.Designation.toLowerCase().includes(searchLower))
        );
    });

    // Pagination
    const paginatedEmployees = filteredEmployees.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Get role badge color
    const getRoleChip = (role) => {
        const config = {
            'HR': { color: 'primary', label: 'HR' },
            'custodian': { color: 'warning', label: 'Custodian' },
            'employee': { color: 'default', label: 'Employee' }
        };
        const roleConfig = config[role] || config.employee;
        return (
            <Chip
                label={roleConfig.label}
                size="small"
                color={roleConfig.color}
                sx={{ fontSize: '0.7rem' }}
            />
        );
    };

    // Columns for table
    const columns = [
        { id: 'EmployeeID', label: 'ID', minWidth: 60 },
        { id: 'EmployeeCode', label: 'Code', minWidth: 100 },
        { id: 'Name', label: 'Name', minWidth: 150 },
        { id: 'DeviceUid', label: 'Device UID', minWidth: 100 },
        { id: 'Department', label: 'Department', minWidth: 120 },
        { id: 'Designation', label: 'Designation', minWidth: 120 },
        { id: 'Email', label: 'Email', minWidth: 150 },
        { id: 'Role', label: 'Role', minWidth: 100 },
        { id: 'JoinDate', label: 'Join Date', minWidth: 100 },
        { id: 'actions', label: 'Actions', minWidth: 150, align: 'right' },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Header Section */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.1
                    )} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {isHR() ? 'Employee Management' : 'My Team'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isHR()
                                ? 'Manage your workforce and device integration'
                                : `Showing ${employees.length} team member${employees.length !== 1 ? 's' : ''} under your supervision`
                            }
                        </Typography>
                    </Grid>
                    <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: { md: 'flex-end' },
                            flexWrap: 'wrap',
                        }}
                    >
                        <Tooltip title="Refresh">
                            <IconButton
                                onClick={() => { fetchEmployees(); fetchStats(); }}
                                sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        {isHR() && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                sx={{
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                    '&:hover': {
                                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                                    },
                                }}
                            >
                                Add New Employee
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Statistics Cards */}
            {isHR() && stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                            <PeopleIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.totalEmployees || 0}</Typography>
                            <Typography variant="caption" color="textSecondary">Total Employees</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#e8f5e9' }}>
                            <BadgeIcon sx={{ color: '#2e7d32', fontSize: 28 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>{stats.uniqueDeviceUids || 0}</Typography>
                            <Typography variant="caption" color="textSecondary">Unique Devices</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#e3f2fd' }}>
                            <CalendarIcon sx={{ color: '#1565c0', fontSize: 28 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0' }}>{stats.newLast7Days || 0}</Typography>
                            <Typography variant="caption" color="textSecondary">New This Week</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#fff3e0' }}>
                            <BusinessIcon sx={{ color: '#e65100', fontSize: 28 }} />
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#e65100' }}>{stats.totalDepartments || 0}</Typography>
                            <Typography variant="caption" color="textSecondary">Total Departments</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Search and Filter Section */}
            <Paper
                sx={{
                    p: { xs: 2, sm: 3 },
                    mb: { xs: 2, sm: 3 },
                    borderRadius: 2,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, code, department, email, or designation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm("")}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' }, flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="textSecondary" sx={{ alignSelf: 'center' }}>
                                {filteredEmployees.length} / {employees.length} employees
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Employees Table */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2, color: 'text.secondary' }}>Loading employees...</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                                        {columns.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                align={column.align || 'left'}
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {column.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedEmployees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                    <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                                                    <Typography variant="body1" color="text.secondary">
                                                        {employees.length === 0
                                                            ? isCustodian()
                                                                ? 'No team members assigned to you'
                                                                : 'No employees found'
                                                            : 'No matching employees'
                                                        }
                                                    </Typography>
                                                    {isHR() && employees.length === 0 && (
                                                        <Button
                                                            variant="contained"
                                                            startIcon={<PersonAddIcon />}
                                                            onClick={() => { resetForm(); setShowModal(true); }}
                                                        >
                                                            Add Your First Employee
                                                        </Button>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedEmployees.map((emp) => (
                                            <TableRow
                                                key={emp.EmployeeID}
                                                hover
                                                sx={{
                                                    '&:nth-of-type(even)': {
                                                        backgroundColor: alpha(theme.palette.action.hover, 0.02),
                                                    },
                                                }}
                                            >
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                                                        {emp.EmployeeID}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <Chip
                                                        label={emp.EmployeeCode || "-"}
                                                        size="small"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {emp.Name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <Chip
                                                        label={emp.DeviceUid || "-"}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    {emp.Department || "-"}
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    {emp.Designation || "-"}
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                        {emp.Email || "-"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    {getRoleChip(emp.Role)}
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    {formatDate(emp.JoinDate)}
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }} align="right">
                                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                        {isHR() ? (
                                                            <>
                                                                <Tooltip title="Edit Employee">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleEdit(emp)}
                                                                        sx={{ color: theme.palette.info.main }}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete Employee">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleDelete(emp.EmployeeID, emp.Name)}
                                                                        sx={{ color: theme.palette.error.main }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        ) : isCustodian() && emp.EmployeeID !== user?.EmployeeID ? (
                                                            <>
                                                                {/* <Tooltip title="Apply Leave for this employee">
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        color="primary"
                                                                        onClick={() => handleApplyForTeamMember(emp.EmployeeCode)}
                                                                        sx={{
                                                                            fontSize: '0.6rem',
                                                                            py: 0.5,
                                                                            px: 1,
                                                                            minWidth: 'auto',
                                                                            textTransform: 'none',
                                                                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                                        }}
                                                                    >
                                                                        Apply Leave
                                                                    </Button>
                                                                </Tooltip> */}
                                                                <Tooltip title="Apply Attendance Correction for this employee">
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        color="primary"
                                                                        onClick={() => handleApplyCorrectionForTeamMember(emp.EmployeeCode)}
                                                                        sx={{
                                                                            fontSize: '0.6rem',
                                                                            py: 0.5,
                                                                            px: 1,
                                                                            minWidth: 'auto',
                                                                            textTransform: 'none',
                                                                            background: `linear-gradient(135deg, #0004ff88 0%, #0004ff88 100%)`,
                                                                            '&:hover': {
                                                                                background: `linear-gradient(135deg, #0004ff88 0%, #0004ff88 100%)`,
                                                                            },
                                                                        }}
                                                                    >
                                                                        Attendance Correction
                                                                    </Button>
                                                                </Tooltip>
                                                            </>
                                                        ) : isCustodian() && emp.EmployeeID === user?.EmployeeID ? (
                                                            <Chip
                                                                label="Yourself"
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.65rem' }}
                                                            />
                                                        ) : null}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredEmployees.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </Paper>

            {/* Add/Edit Employee Modal */}
            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    pb: 2
                }}>
                    <Typography variant="h6">
                        {editingEmployee ? `Edit Employee: ${editingEmployee.Name}` : "Add New Employee"}
                    </Typography>
                    <IconButton onClick={() => setShowModal(false)} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 3, pb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name *"
                                    name="Name"
                                    value={form.Name}
                                    onChange={handleChange}
                                    placeholder="Enter employee name"
                                    required
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Employee Code"
                                    name="EmployeeCode"
                                    value={form.EmployeeCode}
                                    onChange={handleChange}
                                    placeholder="Auto-generated if left blank"
                                    disabled={!!editingEmployee}
                                    size="small"
                                    helperText={editingEmployee ? "Employee code cannot be changed" : "Leave blank for auto-generation"}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BadgeIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Device UID"
                                    name="DeviceUid"
                                    type="number"
                                    value={form.DeviceUid || ""}
                                    onChange={handleChange}
                                    placeholder="Biometric device user ID (optional)"
                                    size="small"
                                    helperText="Unique ID from biometric device"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="Email"
                                    type="email"
                                    value={form.Email}
                                    onChange={handleChange}
                                    placeholder="employee@company.com"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Department"
                                    name="Department"
                                    value={form.Department}
                                    onChange={handleChange}
                                    placeholder="e.g., IT, HR, Finance"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BusinessIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Designation"
                                    name="Designation"
                                    value={form.Designation}
                                    onChange={handleChange}
                                    placeholder="e.g., Manager, Developer"
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <WorkIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="Role"
                                        value={form.Role}
                                        onChange={handleChange}
                                        label="Role"
                                    >
                                        <MenuItem value="employee">Employee</MenuItem>
                                        <MenuItem value="custodian">Custodian</MenuItem>
                                        <MenuItem value="HR">HR</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Join Date"
                                    name="JoinDate"
                                    type="date"
                                    value={form.JoinDate}
                                    onChange={handleChange}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon sx={{ color: '#666' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: theme.palette.primary.main,
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>

                        {editingEmployee && (
                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                    Created: {formatDate(editingEmployee.CreatedAt)}
                                    {editingEmployee.UpdatedAt && ` | Updated: ${formatDate(editingEmployee.UpdatedAt)}`}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pt: 2 }}>
                    <Button
                        onClick={() => setShowModal(false)}
                        variant="outlined"
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        }}
                    >
                        {editingEmployee ? "Update Employee" : "Create Employee"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Employees;