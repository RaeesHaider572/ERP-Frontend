// src/modules/inventory/Inventory.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Container, Paper, Typography, TextField, IconButton,
  Tooltip, Chip, Alert, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Grid, useTheme, alpha,
  Snackbar, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, InputAdornment,
  Switch, FormControlLabel, Divider, Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warehouse as WarehouseIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  getInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  getProjectsForDropdown,
} from "../../services/inventoryService";
import { getCustomers } from "../../services/customerService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatCurrency = (value) => {
  if (value == null || value === "") return "-";
  return Number(value).toLocaleString("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 });
};

const emptyForm = {
  UnitID: "",  // ← ADD THIS
  ShopNo: "", FloorSubCategory: "", Project: "",
  DepthIdentifier: "", SoldUnsold: false, Map: "", UnsoldSubCategory: "",
  SellingAgent: "", CurrentStatus: "", Block: "", FloorID: "", Floor: "",
  CornerFactor: "", CommercialResidential: "", PropertyUsage: "",
  SFTVerified: "", RatePerSFT: "", LateralIdentifier: "",
  SellingCompany: "", SellingPerson: "",
  CustomerID: "",
};

const columns = [
  { id: "InventoryID", label: "ID", minWidth: 65 },
  { id: "ShopNo", label: "Shop No", minWidth: 90 },
  { id: "FloorSubCategory", label: "Floor Sub-Cat", minWidth: 120 },
  // { id: "Name",                  label: "Customer Name",   minWidth: 140 },
  // { id: "CustomerID",            label: "MRN",             minWidth: 110 },
  { id: "CustomerName", label: "Name", minWidth: 150 },
  { id: "Project", label: "Project Code", minWidth: 120 },
  { id: "UnitID", label: "Unit ID", minWidth: 190 },

  { id: "DepthIdentifier", label: "Depth ID", minWidth: 90 },
  { id: "SoldUnsold", label: "Sold/Unsold", minWidth: 100 },
  { id: "CurrentStatus", label: "Status", minWidth: 100 },
  { id: "Block", label: "Block", minWidth: 80 },
  { id: "Floor", label: "Floor", minWidth: 90 },
  { id: "CommercialResidential", label: "Comm/Resi", minWidth: 110 },
  { id: "PropertyUsage", label: "Property Usage", minWidth: 130 },
  { id: "SFTVerified", label: "SFT Verified", minWidth: 105 },
  { id: "RatePerSFT", label: "Rate/SFT", minWidth: 110 },
  { id: "Price", label: "Price", minWidth: 140 },
  { id: "SellingCompany", label: "Selling Company", minWidth: 150 },
  { id: "SellingPerson", label: "Selling Person", minWidth: 140 },
  { id: "CreatedAt", label: "Created At", minWidth: 120, isDate: true },
  { id: "actions", label: "Actions", minWidth: 90, align: "right", sortable: false },
];

function SectionLabel({ children }) {
  return (
    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.2, mt: 1 }}>
      {children}
    </Typography>
  );
}

function FormField({ label, name, form, formErrors, handleChange, required, type = "text", placeholder, ...rest }) {
  return (
    <TextField
      label={label} name={name} value={form[name] ?? ""}
      onChange={handleChange} error={!!formErrors[name]}
      helperText={formErrors[name]} required={required}
      fullWidth size="small" type={type} placeholder={placeholder}
      {...rest}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Inventory() {
  const theme = useTheme();

  const [inventory, setInventory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);   // for customer dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "InventoryID", direction: "desc" });

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // ─── Fetch ────────────────────────────────────────────────────────────────────

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const response = await getInventory();
      let data = [];
      if (Array.isArray(response.data)) data = response.data;
      else if (Array.isArray(response.data?.data)) data = response.data.data;
      setInventory(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Error fetching inventory.";
      setError(msg);
      showSnackbarMsg(msg, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await getProjectsForDropdown();
      let data = [];
      if (Array.isArray(response.data)) data = response.data;
      else if (Array.isArray(response.data?.data)) data = response.data.data;
      setProjects(data);
    } catch (err) {
      console.error("[fetchProjects]", err.message);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await getCustomers();
      let data = [];
      if (Array.isArray(response.data)) data = response.data;
      else if (Array.isArray(response.data?.data)) data = response.data.data;
      else if (Array.isArray(response.data?.customers)) data = response.data.customers;
      setCustomers(data);
    } catch (err) {
      console.error("[fetchCustomers]", err.message);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchProjects();
    fetchCustomers();
  }, [fetchInventory, fetchProjects, fetchCustomers]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const showSnackbarMsg = (message, severity = "success") => setSnackbar({ open: true, message, severity });
  const resetForm = () => { setForm(emptyForm); setEditingItem(null); setFormErrors({}); };

  const validateForm = () => {
    const errors = {};
    if (!form.UnitID?.trim()) errors.UnitID = "Required";  // ← ADD THIS
    if (!form.Project) errors.Project = "Required";
    if (!form.FloorSubCategory?.trim()) errors.FloorSubCategory = "Required";
    if (!form.ShopNo?.trim()) errors.ShopNo = "Required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (formErrors[name]) setFormErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  // ─── Table logic ──────────────────────────────────────────────────────────────

  const filtered = Array.isArray(inventory)
    ? inventory.filter((item) =>
      !searchTerm || Object.values(item).some(
        (v) => v != null && String(v).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    : [];

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const av = a[sortConfig.key] ?? "", bv = b[sortConfig.key] ?? "";
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const handleSort = (key) => setSortConfig((prev) => ({
    key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
  }));

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      UnitID: item.UnitID || "",
      ShopNo: item.ShopNo || "",
      FloorSubCategory: item.FloorSubCategory || "",
      Name: item.Name || "",
      Project: item.Project || "",
      DepthIdentifier: item.DepthIdentifier || "",
      SoldUnsold: Boolean(item.SoldUnsold),
      Map: item.Map || "",
      UnsoldSubCategory: item.UnsoldSubCategory || "",
      SellingAgent: item.SellingAgent || "",
      CurrentStatus: item.CurrentStatus || "",
      Block: item.Block || "",
      FloorID: item.FloorID ?? "",
      Floor: item.Floor || "",
      CornerFactor: item.CornerFactor || "",
      CommercialResidential: item.CommercialResidential || "",
      PropertyUsage: item.PropertyUsage || "",
      SFTVerified: item.SFTVerified ?? "",
      RatePerSFT: item.RatePerSFT ?? "",
      LateralIdentifier: item.LateralIdentifier || "",
      SellingCompany: item.SellingCompany || "",
      SellingPerson: item.SellingPerson || "",
      CustomerID: item.CustomerID || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) { showSnackbarMsg("Please fill in required fields", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        FloorID: form.FloorID !== "" ? Number(form.FloorID) : null,
        SFTVerified: form.SFTVerified !== "" ? Number(form.SFTVerified) : null,
        RatePerSFT: form.RatePerSFT !== "" ? Number(form.RatePerSFT) : null,
        SoldUnsold: form.SoldUnsold ? 1 : 0,
        CustomerID: form.CustomerID || null,
      };
      if (editingItem) {
        await updateInventory(editingItem.InventoryID, payload);
        showSnackbarMsg("Inventory item updated successfully!", "success");
      } else {
        await createInventory(payload);
        showSnackbarMsg("Inventory item created successfully!", "success");
      }
      setShowModal(false);
      resetForm();
      fetchInventory();
    } catch (err) {
      showSnackbarMsg(err.response?.data?.message || "Error saving inventory item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteInventory(itemToDelete.InventoryID);
      showSnackbarMsg("Inventory item deleted successfully!", "success");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchInventory();
    } catch (err) {
      showSnackbarMsg(err.response?.data?.message || "Error deleting inventory item", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Cell renderer ────────────────────────────────────────────────────────────

  const renderCell = (col, item) => {
    if (col.id === "actions") {
      return (
        <TableCell key="actions" align="right" sx={{ whiteSpace: "nowrap" }}>
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: theme.palette.info.main }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }} sx={{ color: theme.palette.error.main }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      );
    }

    const value = item[col.id];

    if (col.id === "SoldUnsold") {
      return (
        <TableCell key={col.id} sx={{ whiteSpace: "nowrap" }}>
          <Chip label={value ? "Sold" : "Unsold"} size="small" color={value ? "error" : "success"} variant="outlined" sx={{ fontSize: "0.72rem" }} />
        </TableCell>
      );
    }

    if (col.id === "CurrentStatus") {
      return (
        <TableCell key={col.id} sx={{ whiteSpace: "nowrap" }}>
          {value
            ? <Chip label={value} size="small" color="primary" variant="outlined" sx={{ fontSize: "0.72rem" }} />
            : <Typography variant="body2" color="text.disabled">-</Typography>}
        </TableCell>
      );
    }

    if (col.id === "CustomerID") {
      return (
        <TableCell key={col.id} sx={{ whiteSpace: "nowrap" }}>
          {value
            ? <Chip label={value} size="small" color="secondary" variant="outlined" icon={<PersonIcon sx={{ fontSize: "0.85rem !important" }} />} sx={{ fontSize: "0.72rem" }} />
            : <Typography variant="body2" color="text.disabled">-</Typography>}
        </TableCell>
      );
    }

    if (col.id === "CustomerName") {
      return (
        <TableCell key={col.id} sx={{ whiteSpace: "nowrap" }}>
          <Typography variant="body2" color={value ? "text.primary" : "text.disabled"}>
            {value || "-"}
          </Typography>
        </TableCell>
      );
    }

    if (col.id === "Price" || col.id === "RatePerSFT") {
      return (
        <TableCell key={col.id} sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
          {value != null && value !== "" ? formatCurrency(value) : "-"}
        </TableCell>
      );
    }

    const display = value != null && value !== ""
      ? (col.isDate ? formatDate(value) : String(value))
      : "-";

    return (
      <TableCell key={col.id} align={col.align || "left"} sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
        {display}
      </TableCell>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }


  // Selected customer object for Autocomplete
  const selectedCustomer = customers.find((c) => c.MembershipId === form.CustomerID) || null;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <WarehouseIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Inventory</Typography>
                <Typography variant="body2" color="text.secondary">{inventory.length} total records</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", gap: 1, justifyContent: { md: "flex-end" }, flexWrap: "wrap" }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchInventory} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={() => { resetForm(); setShowModal(true); }}
              sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
            >
              Add Inventory
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Search */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <TextField
          fullWidth placeholder="Search by Unit ID, Project, Customer, Block, Status..."
          value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          variant="outlined" size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary" }} /></InputAdornment> }}
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "65vh" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || "left"} sx={{ fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap", minWidth: col.minWidth, backgroundColor: theme.palette.background.paper }}>
                    {col.sortable !== false
                      ? <TableSortLabel active={sortConfig.key === col.id} direction={sortConfig.key === col.id ? sortConfig.direction : "asc"} onClick={() => handleSort(col.id)}>{col.label}</TableSortLabel>
                      : col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <WarehouseIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                    <Typography color="text.secondary">No inventory records found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow key={item.InventoryID} hover sx={{ "&:nth-of-type(even)": { backgroundColor: alpha(theme.palette.action.hover, 0.02) } }}>
                    {columns.map((col) => renderCell(col, item))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={sorted.length} page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      </Paper>

      {/* ─── Create / Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showModal} onClose={() => { setShowModal(false); resetForm(); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editingItem ? `Editing: ${editingItem.UnitID}` : "Fill in Unit ID manually"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => { setShowModal(false); resetForm(); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <SectionLabel>Unit ID Components *</SectionLabel>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Shop No" name="ShopNo" required placeholder="e.g. 01" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Floor Sub-Category" name="FloorSubCategory" required placeholder="e.g. GF" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select label="Project" name="Project" value={form.Project}
                  onChange={handleChange} error={!!formErrors.Project}
                  helperText={formErrors.Project || "Must match a project code"}
                  required fullWidth size="small"
                >
                  <MenuItem value=""><em>Select Project</em></MenuItem>
                  {projects.length === 0 && <MenuItem disabled><em>No projects found</em></MenuItem>}
                  {projects.map((p) => (
                    <MenuItem key={p.project_code} value={p.project_code}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{p.project_code}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.project_name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                {/* ← NEW: Manual UnitID input */}
                <FormField
                  form={form} formErrors={formErrors} handleChange={handleChange}
                  label="Unit ID" name="UnitID" required
                  placeholder="e.g. PRJ01GF01"
                />
              </Grid>
            </Grid>



            <Divider sx={{ my: 1 }} />

            {/* ── 2. Customer Assignment ── */}
            <SectionLabel>Customer Assignment</SectionLabel>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(c) => `${c.MembershipId} — ${c.Name} (${c.CNIC || "N/A"})`}
                  value={selectedCustomer}
                  onChange={(_, newValue) => {
                    setForm((prev) => ({ ...prev, CustomerID: newValue?.MembershipId || "" }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assign Customer (MRN)"
                      size="small"
                      placeholder="Search by name, MRN or CNIC..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <PersonIcon sx={{ color: "text.secondary", mr: 0.5, fontSize: "1.1rem" }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                      helperText="Optional — assign this unit to a customer"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.MembershipId} — {option.Name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          CNIC: {option.CNIC || "N/A"} | Contact: {option.ContactNo || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  isOptionEqualToValue={(option, value) => option.MembershipId === value.MembershipId}
                  clearOnEscape
                  noOptionsText="No customers found"
                />
              </Grid>

              {/* Show selected customer info */}
              {selectedCustomer && (
                <Grid item xs={12}>
                  <Alert severity="success" icon={<PersonIcon />} sx={{ py: 0.5 }}>
                    <Typography variant="body2">
                      <strong>{selectedCustomer.Name}</strong> ({selectedCustomer.MembershipId}) —&nbsp;
                      {selectedCustomer.ContactNo || "No contact"} | CNIC: {selectedCustomer.CNIC || "N/A"}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* ── 3. Status & Identifiers ── */}
            <SectionLabel>Status & Identifiers</SectionLabel>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Depth Identifier" name="DepthIdentifier" placeholder="e.g. Back" />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={<Switch checked={Boolean(form.SoldUnsold)} onChange={handleChange} name="SoldUnsold" color="error" />}
                  label={
                    <Typography sx={{ fontWeight: form.SoldUnsold ? 600 : 400, color: form.SoldUnsold ? "error.main" : "success.main" }}>
                      {form.SoldUnsold ? "Sold" : "Unsold"}
                    </Typography>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Map" name="Map" placeholder="e.g. Active" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Unsold Sub-Category" name="UnsoldSubCategory" placeholder="e.g. Reserved" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* ── 4. Location & Status ── */}
            <SectionLabel>Location & Status</SectionLabel>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Selling Agent" name="SellingAgent" placeholder="e.g. Agent Name" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Current Status" name="CurrentStatus" placeholder="e.g. Available" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Block" name="Block" placeholder="e.g. Block-C" />
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Floor ID" name="FloorID" type="number" placeholder="e.g. 1" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Floor" name="Floor" placeholder="e.g. Ground Floor" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Corner Factor" name="CornerFactor" placeholder="e.g. Corner" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* ── 5. Classification ── */}
            <SectionLabel>Classification</SectionLabel>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Commercial / Residential" name="CommercialResidential" placeholder="e.g. Commercial" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Property Usage" name="PropertyUsage" placeholder="e.g. Office" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* ── 6. Pricing ── */}
            <SectionLabel>Pricing</SectionLabel>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="SFT Verified" name="SFTVerified" type="number" placeholder="e.g. 1250.000" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Rate Per SFT (PKR)" name="RatePerSFT" type="number" placeholder="e.g. 8500" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Price (computed)" fullWidth size="small" disabled
                  value={form.SFTVerified && form.RatePerSFT ? formatCurrency(Number(form.SFTVerified) * Number(form.RatePerSFT)) : "Auto-calculated"}
                  helperText="SFT × Rate — saved by SQL automatically"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* ── 7. Selling Info ── */}
            <SectionLabel>Selling Info</SectionLabel>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Lateral Identifier" name="LateralIdentifier" placeholder="e.g. 2" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Selling Company" name="SellingCompany" placeholder="e.g. Alpha Corp" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField form={form} formErrors={formErrors} handleChange={handleChange} label="Selling Person" name="SellingPerson" placeholder="e.g. Ahmed Khan" />
              </Grid>
            </Grid>

          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => { setShowModal(false); resetForm(); }} variant="outlined">Cancel</Button>
          <Button
            onClick={handleSubmit} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
            sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}
          >
            {saving ? "Saving..." : editingItem ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Inventory Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete unit <strong>{itemToDelete?.UnitID}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} variant="outlined">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting} startIcon={deleting ? <CircularProgress size={16} /> : null}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default Inventory;