import React, { useEffect, useState } from "react";
import {
  Box, Button, Container, Paper, Typography, TextField, IconButton,
  Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Grid,
  useTheme, alpha, Snackbar, Chip, Avatar
} from "@mui/material";
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  Refresh as RefreshIcon, Delete as DeleteIcon, Edit as EditIcon,
  Business as BusinessIcon, People as PeopleIcon, Devices as DevicesIcon,
  QrCode as QrCodeIcon
} from "@mui/icons-material";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeStats, departments, statuses, formatDate, getStatusColor } from "../../services/employeeService";
import EmployeeForm from "./EmployeeForm";
import EmployeeStats from "./EmployeeStats";

const EMPTY_FORM = {
  Name: "",
  DeviceUid: "",
  DeviceName: "",
  CardNumber: "",
  DeviceSN: "",
  Designation: "",
  Department: "",
  Email: "",
  Phone: "",
  DateOfBirth: "",
  Gender: "",
  Address: "",
  Salary: "",
  JoiningDate: "",
  Status: "active"
};

function Employees() {
  const theme = useTheme();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "EmployeeId", direction: "desc" });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        department: departmentFilter,
        status: statusFilter
      };
      const response = await getEmployees(params);
      setEmployees(response.data.data.employees);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total,
        totalPages: response.data.data.pagination.totalPages
      }));
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(`Error fetching employees: ${err.response?.data?.message || err.message}`);
      notify(`Error: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await getEmployeeStats();
      setStats(response.data.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [pagination.page, pagination.limit, searchTerm, departmentFilter, statusFilter]);

  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingEmployee(null); setFormErrors({}); };

  const validateForm = () => {
    const errors = {};
    if (!form.Name?.trim()) errors.Name = "Name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notify("Please fill in all required fields", "error");
      return;
    }
    
    try {
      const submitData = {
        ...form,
        DeviceUid: form.DeviceUid ? parseInt(form.DeviceUid) : null,
        Salary: form.Salary ? parseFloat(form.Salary) : 0
      };
      
      if (editingEmployee) {
        await updateEmployee(editingEmployee.EmployeeId, submitData);
        notify("Employee updated successfully!");
      } else {
        await createEmployee(submitData);
        notify("Employee created successfully!");
      }
      setShowModal(false);
      resetForm();
      fetchEmployees();
      fetchStats();
    } catch (err) {
      notify(err.response?.data?.message || "Error saving employee", "error");
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setForm({
      Name: employee.Name || "",
      DeviceUid: employee.DeviceUid || "",
      DeviceName: employee.DeviceName || "",
      CardNumber: employee.CardNumber || "",
      DeviceSN: employee.DeviceSN || "",
      Designation: employee.Designation || "",
      Department: employee.Department || "",
      Email: employee.Email || "",
      Phone: employee.Phone || "",
      DateOfBirth: employee.DateOfBirth ? employee.DateOfBirth.split('T')[0] : "",
      Gender: employee.Gender || "",
      Address: employee.Address || "",
      Salary: employee.Salary || "",
      JoiningDate: employee.JoiningDate ? employee.JoiningDate.split('T')[0] : "",
      Status: employee.Status || "active"
    });
    setShowModal(true);
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete ${employeeName}?`)) return;
    try {
      await deleteEmployee(employeeId);
      notify("Employee deleted successfully!");
      fetchEmployees();
      fetchStats();
    } catch (err) {
      notify(err.response?.data?.message || "Error deleting employee", "error");
    }
  };

  // Get unique departments for filter
  const uniqueDepartments = [...new Set(employees.map(e => e.Department).filter(Boolean))];

  // Sort employees
  const sortedEmployees = [...employees].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let av = a[sortConfig.key], bv = b[sortConfig.key];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  if (loading && employees.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xxl" sx={{ py: 3 }}>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={closeSnackbar} 
                anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Statistics Cards */}
      {stats && <EmployeeStats stats={stats} />}

      {/* Header */}
      <Paper elevation={0} sx={{ 
        p: 3, mb: 3, borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                <PeopleIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700}>Employee Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage employee records and device integration
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchEmployees} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} 
                    onClick={() => { resetForm(); setShowModal(true); }}>
              Add Employee
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField fullWidth placeholder="Search by name, email, phone, device UID..." 
                       value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                       variant="outlined" size="small" 
                       InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={departmentFilter} label="Department" onChange={(e) => setDepartmentFilter(e.target.value)}>
                <MenuItem value="">All Departments</MenuItem>
                {uniqueDepartments.map(dept => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All Status</MenuItem>
                {statuses.map(status => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button variant="outlined" startIcon={<FilterIcon />} fullWidth
                    onClick={() => { setSearchTerm(""); setDepartmentFilter(""); setStatusFilter(""); }}>
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Employee Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: theme.palette.grey[50], borderBottom: `1px solid ${theme.palette.divider}` }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>ID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Device UID</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Device Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Department</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Designation</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Contact</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center" }}>
                    <Typography color="text.secondary">No employees found</Typography>
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((emp) => (
                  <tr key={emp.EmployeeId} style={{ borderBottom: `1px solid ${theme.palette.divider}`, hover: { backgroundColor: theme.palette.action.hover } }}>
                    <td style={{ padding: "12px 16px" }}>{emp.EmployeeId}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{emp.Name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {emp.DeviceUid ? (
                        <Chip label={emp.DeviceUid} size="small" color="primary" variant="outlined" />
                      ) : "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{emp.DeviceName || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>{emp.Department || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>{emp.Designation || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {emp.Phone && <div style={{ fontSize: "0.85rem" }}>{emp.Phone}</div>}
                      {emp.Email && <div style={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>{emp.Email}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Chip label={emp.Status} size="small" color={getStatusColor(emp.Status)} />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(emp)} sx={{ color: theme.palette.info.main }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(emp.EmployeeId, emp.Name)} sx={{ color: theme.palette.error.main }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
        
        {/* Pagination */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
              Previous
            </Button>
            <Typography variant="body2" sx={{ px: 2, py: 0.5, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
              Page {pagination.page} of {pagination.totalPages}
            </Typography>
            <Button size="small" disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
              Next
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onClose={() => { setShowModal(false); resetForm(); }} 
              maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>
          <Typography variant="h5" fontWeight={600}>
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <EmployeeForm form={form} handleChange={handleChange} errors={formErrors} editing={!!editingEmployee} />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => { setShowModal(false); resetForm(); }} variant="outlined">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEmployee ? "Update Employee" : "Create Employee"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Employees;