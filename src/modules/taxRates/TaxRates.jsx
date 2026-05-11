// src/modules/taxRates/TaxRates.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Container, Paper, Typography, TextField, IconButton,
  Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, useTheme, alpha, Snackbar, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TableSortLabel, InputAdornment, Chip, MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Percent as PercentIcon,
} from "@mui/icons-material";
import {
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
} from "../../services/taxRatesService";

const emptyForm = { TaxYear: "", TaxpayerStatus: "", TaxRate: "" };

const TAXPAYER_STATUSES = [
  "Filer",
  "Non-Filer",
  "Company",
  "AOP",
  "Individual",
  "Other",
];

function TaxRates() {
  const theme = useTheme();

  // Data state
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table state
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "TaxYear", direction: "desc" });

  // Dialog state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const fetchTaxRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTaxRates();
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      }
      setTaxRates(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Error fetching tax rates.";
      setError(msg);
      showSnackbarMessage(msg, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTaxRates(); }, [fetchTaxRates]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const showSnackbarMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingItem(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.TaxYear) {
      errors.TaxYear = "Tax Year is required";
    } else if (!/^\d{4}$/.test(String(form.TaxYear))) {
      errors.TaxYear = "Enter a valid 4-digit year";
    }
    if (!form.TaxpayerStatus?.trim()) errors.TaxpayerStatus = "Taxpayer Status is required";
    if (form.TaxRate === "" || form.TaxRate === null || form.TaxRate === undefined) {
      errors.TaxRate = "Tax Rate is required";
    } else if (isNaN(Number(form.TaxRate)) || Number(form.TaxRate) < 0 || Number(form.TaxRate) > 999.99) {
      errors.TaxRate = "Enter a valid tax rate (0 - 999.99)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Table Logic ─────────────────────────────────────────────────────────────
  const filtered = Array.isArray(taxRates)
    ? taxRates.filter((item) => {
        if (!searchTerm) return true;
        return Object.values(item).some((val) =>
          val != null && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] ?? "";
    const bVal = b[sortConfig.key] ?? "";
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // ─── CRUD Handlers ────────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      TaxYear: item.TaxYear || "",
      TaxpayerStatus: item.TaxpayerStatus || "",
      TaxRate: item.TaxRate !== undefined ? item.TaxRate : "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbarMessage("Please fill in required fields correctly", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        TaxYear: Number(form.TaxYear),
        TaxpayerStatus: form.TaxpayerStatus.trim(),
        TaxRate: Number(form.TaxRate),
      };
      if (editingItem) {
        await updateTaxRate(editingItem.TaxRateId, payload);
        showSnackbarMessage("Tax rate updated successfully!", "success");
      } else {
        await createTaxRate(payload);
        showSnackbarMessage("Tax rate created successfully!", "success");
      }
      setShowModal(false);
      resetForm();
      fetchTaxRates();
    } catch (err) {
      const msg = err.response?.data?.message || "Error saving tax rate";
      showSnackbarMessage(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteTaxRate(itemToDelete.TaxRateId);
      showSnackbarMessage("Tax rate deleted successfully!", "success");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchTaxRates();
    } catch (err) {
      const msg = err.response?.data?.message || "Error deleting tax rate";
      showSnackbarMessage(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Tax Rate chip color ──────────────────────────────────────────────────────
  const getRateColor = (rate) => {
    const r = Number(rate);
    if (r === 0) return "default";
    if (r <= 5) return "success";
    if (r <= 15) return "warning";
    return "error";
  };

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    { id: "TaxRateId", label: "ID", minWidth: 70 },
    { id: "TaxYear", label: "Tax Year", minWidth: 110 },
    { id: "TaxpayerStatus", label: "Taxpayer Status", minWidth: 160 },
    { id: "TaxRate", label: "Tax Rate (%)", minWidth: 130, align: "right" },
    { id: "actions", label: "Actions", minWidth: 100, align: "right", sortable: false },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <PercentIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Tax Rates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {taxRates.length} total records
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", gap: 1, justifyContent: { md: "flex-end" }, flexWrap: "wrap" }}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchTaxRates}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { resetForm(); setShowModal(true); }}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                "&:hover": { boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)" },
              }}
            >
              Add Tax Rate
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Search */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by year, taxpayer status, rate..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "65vh" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align || "left"}
                    sx={{ fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "nowrap" }}
                  >
                    {col.sortable !== false ? (
                      <TableSortLabel
                        active={sortConfig.key === col.id}
                        direction={sortConfig.key === col.id ? sortConfig.direction : "asc"}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <PercentIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                    <Typography color="text.secondary">No tax rates found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow
                    key={item.TaxRateId}
                    hover
                    sx={{ "&:nth-of-type(even)": { backgroundColor: alpha(theme.palette.action.hover, 0.02) } }}
                  >
                    {columns.map((col) => {
                      if (col.id === "actions") {
                        return (
                          <TableCell key={col.id} align="right">
                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: theme.palette.info.main }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => openDeleteDialog(item)} sx={{ color: theme.palette.error.main }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        );
                      }

                      const value = item[col.id];

                      // Tax Rate shown as colored chip
                      if (col.id === "TaxRate") {
                        return (
                          <TableCell key={col.id} align="right">
                            <Chip
                              label={`${Number(value).toFixed(2)}%`}
                              size="small"
                              color={getRateColor(value)}
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: "0.8rem" }}
                            />
                          </TableCell>
                        );
                      }

                      // Tax Year as bold
                      if (col.id === "TaxYear") {
                        return (
                          <TableCell key={col.id} align="left">
                            <Typography variant="body2" fontWeight={600}>
                              {value ?? "-"}
                            </Typography>
                          </TableCell>
                        );
                      }

                      const display = value !== null && value !== undefined && value !== ""
                        ? String(value) : "-";

                      return (
                        <TableCell key={col.id} align={col.align || "left"} sx={{ fontSize: "0.8125rem" }}>
                          {display}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {editingItem ? "Edit Tax Rate" : "Add Tax Rate"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editingItem ? "Update tax rate details" : "Fill in tax rate details"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => { setShowModal(false); resetForm(); }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Tax Year"
              name="TaxYear"
              value={form.TaxYear}
              onChange={handleChange}
              error={!!formErrors.TaxYear}
              helperText={formErrors.TaxYear || "e.g. 2024"}
              required
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 2000, max: 2100 }}
            />
            <TextField
              select
              label="Taxpayer Status"
              name="TaxpayerStatus"
              value={form.TaxpayerStatus}
              onChange={handleChange}
              error={!!formErrors.TaxpayerStatus}
              helperText={formErrors.TaxpayerStatus}
              required
              fullWidth
              size="small"
            >
              {TAXPAYER_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Tax Rate (%)"
              name="TaxRate"
              value={form.TaxRate}
              onChange={handleChange}
              error={!!formErrors.TaxRate}
              helperText={formErrors.TaxRate || "e.g. 5.00"}
              required
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, max: 999.99, step: 0.01 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => { setShowModal(false); resetForm(); }} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            {saving ? "Saving..." : editingItem ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Tax Rate</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the <strong>{itemToDelete?.TaxpayerStatus}</strong> tax
            rate for year <strong>{itemToDelete?.TaxYear}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : null}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default TaxRates;