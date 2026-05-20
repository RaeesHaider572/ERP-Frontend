import React, { useState, useEffect } from 'react';
import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees,
    getEmployeeStats
} from '../../services/employeeService';
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
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Grid,
    Card,
    CardContent,
    InputAdornment,
    CircularProgress,
    Chip,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Upload as UploadIcon
} from '@mui/icons-material';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState(null);
    const [openBulkDialog, setOpenBulkDialog] = useState(false);
    const [bulkData, setBulkData] = useState('');
    
    const [formData, setFormData] = useState({
        Name: '',
        deviceUid: ''
    });

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        loadEmployees();
        loadStats();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const response = await getEmployees();
            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            showSnackbar('Failed to load employees', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await getEmployeeStats();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            await loadEmployees();
            return;
        }
        
        setLoading(true);
        try {
            const response = await searchEmployees(searchTerm);
            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            showSnackbar('Search failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        if (!formData.Name || !formData.deviceUid) {
            showSnackbar('Please fill all fields', 'error');
            return;
        }

        setLoading(true);
        try {
            if (editingEmployee) {
                const response = await updateEmployee(editingEmployee.EmployeeId, formData);
                if (response.data.success) {
                    showSnackbar('Employee updated successfully');
                    handleCloseDialog();
                    await loadEmployees();
                    await loadStats();
                } else {
                    showSnackbar(response.data.message || 'Update failed', 'error');
                }
            } else {
                const response = await createEmployee(formData);
                if (response.data.success) {
                    showSnackbar('Employee created successfully');
                    handleCloseDialog();
                    await loadEmployees();
                    await loadStats();
                } else {
                    showSnackbar(response.data.message || 'Creation failed', 'error');
                }
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            Name: employee.Name,
            deviceUid: employee.DeviceUid
        });
        setOpenDialog(true);
    };

    const handleDelete = async (employee) => {
        if (window.confirm(`Are you sure you want to delete ${employee.Name}?`)) {
            setLoading(true);
            try {
                const response = await deleteEmployee(employee.EmployeeId);
                if (response.data.success) {
                    showSnackbar('Employee deleted successfully');
                    await loadEmployees();
                    await loadStats();
                } else {
                    showSnackbar(response.data.message || 'Delete failed', 'error');
                }
            } catch (error) {
                showSnackbar(error.response?.data?.message || 'Delete failed', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkImport = async () => {
        if (!bulkData.trim()) {
            showSnackbar('Please enter employee data', 'error');
            return;
        }

        try {
            const lines = bulkData.trim().split('\n');
            const employeesData = lines.map(line => {
                const [Name, deviceUid] = line.split(',').map(s => s.trim());
                return { Name, deviceUid: parseInt(deviceUid) };
            }).filter(emp => emp.Name && emp.deviceUid);

            if (employeesData.length === 0) {
                showSnackbar('No valid employees found', 'error');
                return;
            }

            setLoading(true);
            const response = await bulkImportEmployees(employeesData);
            if (response.data.success) {
                showSnackbar(response.data.message);
                setOpenBulkDialog(false);
                setBulkData('');
                await loadEmployees();
                await loadStats();
            } else {
                showSnackbar(response.data.message, 'error');
            }
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Bulk import failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingEmployee(null);
        setFormData({ Name: '', deviceUid: '' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Employee Management
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{ mr: 1 }}
                    >
                        Add Employee
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setOpenBulkDialog(true)}
                    >
                        Bulk Import
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Employees
                                </Typography>
                                <Typography variant="h4">
                                    {stats.totalEmployees || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Unique Device UIDs
                                </Typography>
                                <Typography variant="h4">
                                    {stats.uniqueDeviceUids || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    New (Last 7 Days)
                                </Typography>
                                <Typography variant="h4">
                                    {stats.newLast7Days || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Today's Punches
                                </Typography>
                                <Typography variant="h4">
                                    {stats.todayPunches || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by name or Device UID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        Search
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={loadEmployees}
                        startIcon={<RefreshIcon />}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>
            </Paper>

            {/* Employees Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Device UID</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Updated At</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body1" sx={{ py: 3 }}>
                                        No employees found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee.EmployeeId} hover>
                                    <TableCell>{employee.EmployeeId}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {employee.Name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={employee.DeviceUid} 
                                            size="small" 
                                            color="primary" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(employee.CreatedAt)}</TableCell>
                                    <TableCell>{formatDate(employee.UpdatedAt)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit">
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEdit(employee)}
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(employee)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Employee Name"
                        name="Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.Name}
                        onChange={handleInputChange}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        margin="dense"
                        label="Device UID"
                        name="deviceUid"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={formData.deviceUid}
                        onChange={handleInputChange}
                        helperText="The ID that the device sends when employee punches"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {editingEmployee ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Import Dialog */}
            <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Bulk Import Employees</DialogTitle>
                <DialogContent>
                    <TextField
                        multiline
                        rows={10}
                        fullWidth
                        variant="outlined"
                        value={bulkData}
                        onChange={(e) => setBulkData(e.target.value)}
                        placeholder="Name,DeviceUid
John Doe,200
Jane Smith,201
Ahmed Khan,202"
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <Typography variant="caption" color="textSecondary">
                        Format: Name,DeviceUid (one per line)<br />
                        Example: Syed Raees Haider,126
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
                    <Button onClick={handleBulkImport} variant="contained" disabled={loading}>
                        Import
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Employees;