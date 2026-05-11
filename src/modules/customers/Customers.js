// src/components/Customers/Customers.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Button, Container, Paper, Typography, TextField, IconButton,
  Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Grid,
  useTheme, alpha, Snackbar,
} from "@mui/material";
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  Download as ExportIcon, Refresh as RefreshIcon,
} from "@mui/icons-material";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../services/customerService";
import CustomersTable     from "./CustomersTable";
import CustomerForm       from "./CustomerForm";
import CustomerStats      from "./CustomerStats";
import CustomerDetailView from "./CustomerDetailView";

// UnitID removed — unit assignment is now done from the Inventory side
const EMPTY_FORM = {
  Name:      "",
  ContactNo: "",
  CNIC:      "",
  SDW:       "",
  Gender:    "",
  Address:   "",
};

function Customers() {
  const theme = useTheme();

  const [customers,        setCustomers]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [showModal,        setShowModal]        = useState(false);
  const [showDetailView,   setShowDetailView]   = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer,  setEditingCustomer]  = useState(null);
  const [searchTerm,       setSearchTerm]       = useState("");
  const [genderFilter,     setGenderFilter]     = useState("");
  const [sortConfig,       setSortConfig]       = useState({ key: "MembershipId", direction: "asc" });
  const [form,             setForm]             = useState(EMPTY_FORM);
  const [formErrors,       setFormErrors]       = useState({});
  const [snackbar,         setSnackbar]         = useState({ open: false, message: "", severity: "success" });

  // ─── Data fetching ───────────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCustomers();
      console.log("[fetchCustomers] response:", response);

      let data = [];
      if (Array.isArray(response.data))                 data = response.data;
      else if (Array.isArray(response.data?.data))      data = response.data.data;
      else if (Array.isArray(response.data?.customers)) data = response.data.customers;
      else { console.warn("[fetchCustomers] Unexpected API shape:", response.data); }

      setCustomers(data);
    } catch (err) {
      console.error("[fetchCustomers] ERROR:", err);
      console.error("[fetchCustomers] status:", err.response?.status);
      console.error("[fetchCustomers] message:", err.response?.data?.message || err.message);
      setError(`Error fetching customers: ${err.response?.data?.message || err.message}`);
      notify(`Error: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const notify        = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditingCustomer(null); setFormErrors({}); };

  const validateForm = () => {
    const errors = {};
    if (!form.Name?.trim())      errors.Name      = "Name is required";
    if (!form.ContactNo?.trim()) errors.ContactNo = "Contact No is required";
    if (!form.CNIC?.trim())      errors.CNIC      = "CNIC is required";
    setFormErrors(errors);
    return errors;
  };

  // ─── CRUD ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { notify("Please fill in required fields", "error"); return; }
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.MembershipId, form);
        notify("Customer updated successfully!");
      } else {
        await createCustomer(form);
        notify("Customer created successfully!");
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      notify(err.response?.data?.message || "Error saving customer", "error");
    }
  };

  const handleView   = (customer) => { setSelectedCustomer(customer); setShowDetailView(true); };
  const handleEdit   = (customer) => {
    setEditingCustomer(customer);
    setForm({
      Name:      customer.Name      || "",
      ContactNo: customer.ContactNo || "",
      CNIC:      customer.CNIC      || "",
      SDW:       customer.SDW       || "",
      Gender:    customer.Gender    || "",
      Address:   customer.Address   || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (membershipId) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await deleteCustomer(membershipId);
      notify("Customer deleted successfully!");
      fetchCustomers();
    } catch (err) {
      notify(err.response?.data?.message || "Error deleting customer", "error");
    }
  };

  const handleExport = () => {
    try {
      const rows = [
        ["MRN", "Name", "Contact No", "CNIC", "Gender", "S/D/W of", "Address"],
        ...filteredCustomers.map((c) => [
          c.MembershipId || "", c.Name || "", c.ContactNo || "",
          c.CNIC || "", c.Gender || "", c.SDW || "", c.Address || "",
        ]),
      ];
      const csv  = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      notify("Exported successfully!");
    } catch { notify("Error exporting customers", "error"); }
  };

  const handleSort = (key) => setSortConfig((s) => ({
    key, direction: s.key === key && s.direction === "asc" ? "desc" : "asc",
  }));

  const filteredCustomers = (Array.isArray(customers) ? customers : [])
    .filter((c) => {
      if (!c || typeof c !== "object") return false;
      const matchesSearch = !searchTerm || Object.values(c).some(
        (v) => v != null && v.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesGender = !genderFilter || c.Gender === genderFilter;
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const av = a[sortConfig.key], bv = b[sortConfig.key];
      if (av == null) return 1; if (bv == null) return -1;
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ?  1 : -1;
      return 0;
    });

  const uniqueGenders = [...new Set(customers.map((c) => c?.Gender).filter(Boolean))].sort();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, sm: 3, md: 0 }, px: { xs: 2, sm: 3, md: 0 } }}>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={closeSnackbar} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>

      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <CustomerStats customers={customers} />
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Customer Management</Typography>
            <Typography variant="body2" color="text.secondary">Manage and organise your customers</Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", gap: 1, justifyContent: { md: "flex-end" }, flexWrap: "wrap" }}>
            <Tooltip title="Refresh"><IconButton onClick={fetchCustomers} sx={{ border: `1px solid ${theme.palette.divider}` }}><RefreshIcon /></IconButton></Tooltip>
            <Tooltip title="Export CSV"><IconButton onClick={handleExport} disabled={filteredCustomers.length === 0} sx={{ border: `1px solid ${theme.palette.divider}` }}><ExportIcon /></IconButton></Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setShowModal(true); }} sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
              Add New Customer
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField fullWidth placeholder="Search by name, CNIC, contact, MRN…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="outlined" size="small" InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Gender</InputLabel>
                <Select value={genderFilter} label="Gender" onChange={(e) => setGenderFilter(e.target.value)}>
                  <MenuItem value="">All Genders</MenuItem>
                  {uniqueGenders.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => { setSearchTerm(""); setGenderFilter(""); }} size="small">Clear</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <CustomersTable customers={filteredCustomers} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} sortConfig={sortConfig} onSort={handleSort} />

      <CustomerDetailView customer={selectedCustomer} open={showDetailView} onClose={() => { setShowDetailView(false); setSelectedCustomer(null); }} onEdit={handleEdit} />

      <Dialog open={showModal} onClose={() => { setShowModal(false); resetForm(); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{editingCustomer ? "Edit Customer" : "Add New Customer"}</Typography>
          <Typography variant="body2" color="text.secondary">{editingCustomer ? "Update customer information" : "Fill in customer details"}</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <CustomerForm form={form} handleChange={handleChange} errors={formErrors} />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => { setShowModal(false); resetForm(); }} variant="outlined">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
            {editingCustomer ? "Update Customer" : "Create Customer"}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default Customers;