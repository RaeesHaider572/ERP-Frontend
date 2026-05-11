import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TableSortLabel, Paper, IconButton, Tooltip, Chip,
  Box, Typography, useTheme, alpha, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, CircularProgress, TextField, MenuItem,
  FormControl, InputLabel, Select
} from "@mui/material";

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import ReceiptInvoicePrint from "./ReceiptInvoicePrint";
import { getReceiptInvoice, updateReceipt } from "../../services/receiptService";

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatSurcharge = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const ReceiptsTable = ({ receipts = [], onEdit, onDelete, onView, sortConfig, onSort, onReceiptUpdated
}) => {
  const theme = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    oldVoucherNo: "",
    receiptDate: "",
    collectionBy: "",
    source: "",
    receiptMode: "",
    code: ""
  });

  const columns = [
    { id: "MappingID", label: "ID", minWidth: 80, sortable: true },
    { id: "ReceiptID", label: "Receipt ID", minWidth: 150, sortable: true },
    { id: "EntryID", label: "Entry ID", minWidth: 150, sortable: true },
    { id: "VoucherNo", label: "Voucher No", minWidth: 120, sortable: true },
    { id: "OldVoucherNo", label: "Old Voucher No", minWidth: 140, sortable: true },
    { id: "ReceiptDate", label: "Receipt Date", minWidth: 120, sortable: true },
    { id: "EntryDate", label: "Entry Date", minWidth: 120, sortable: true },
    { id: "UnitNo", label: "Unit No", minWidth: 100, sortable: true },
    { id: "CustomerName", label: "Customer", minWidth: 150, sortable: true },
    { id: "Project", label: "Project", minWidth: 100, sortable: true },
    { id: "CNIC", label: "CNIC", minWidth: 120, sortable: true },
    { id: "CollectionBy", label: "Collection By", minWidth: 120, sortable: true },
    { id: "Source", label: "Source", minWidth: 120, sortable: true },
    { id: "ReceiptMode", label: "Receipt Mode", minWidth: 120, sortable: true },
    { id: "Code", label: "Code", minWidth: 80, sortable: true },
    { id: "ReceiptType", label: "Receipt Type", minWidth: 120, sortable: true },
    { id: "Knocking", label: "Knocking", minWidth: 100, sortable: true },
    { id: "Amount", label: "Amount", minWidth: 120, sortable: true, align: "right" },
    { id: "DefaultSurcharge", label: "Surcharge", minWidth: 120, sortable: true, align: "right" },
    { id: "Narration", label: "Narration", minWidth: 150, sortable: false },
    { id: "Remarks", label: "Remarks", minWidth: 150, sortable: false },
    { id: "CreatedAt", label: "Created At", minWidth: 150, sortable: true },
    { id: "actions", label: "Actions", minWidth: 120, align: "right", sortable: false },
  ];

  const sourceOptions = [
    "Walk-in",
    "Reference",
    "Campaign",
    "Online",
    "Agent",
    "Other"
  ];

  const receiptModeOptions = [
    "Cash",
    "Cheque",
    "Bank Transfer",
    "Credit Card",
    "Online Payment",
    "Other"
  ];

  const safeReceipts = Array.isArray(receipts) ? receipts : [];

  const sortedReceipts = [...safeReceipts].sort((a, b) => {
    if (!sortConfig?.key) return 0;

    let aValue = a[sortConfig.key] || a[sortConfig.key.toLowerCase()];
    let bValue = b[sortConfig.key] || b[sortConfig.key.toLowerCase()];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    const aNum = Number(aValue);
    const bNum = Number(bValue);
    if (!isNaN(aNum) && !isNaN(bNum) && aValue !== "" && bValue !== "") {
      aValue = aNum;
      bValue = bNum;
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedReceipts = sortedReceipts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getReceiptDisplayNo = (receipt) => {
    const receiptId = receipt.ReceiptID || receipt.receipt_id || receipt.id;
    if (receiptId && receiptId.length > 8) {
      return `REC-${receiptId.substring(0, 8).toUpperCase()}`;
    }
    return receipt.receipt_voucher_no || receipt.VoucherNo || receipt.voucher_no || "-";
  };

  // Handle form field changes
  const handleEditFormChange = (field) => (event) => {
    setEditFormData({
      ...editFormData,
      [field]: event.target.value
    });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editFormData.mappingId) {
      console.error("No Mapping ID found for receipt");
      return;
    }

    setEditLoading(true);

    try {
      const payload = {
        sectionOne: {
          old_voucher_no: editFormData.oldVoucherNo,
          receipt_date: editFormData.receiptDate,
          collection_by: editFormData.collectionBy,
          source: editFormData.source,
          receipt_mode: editFormData.receiptMode,
          code: editFormData.code,
          project: editingReceipt?.Project || editingReceipt?.project || null
        },
        sectionTwoList: editingReceipt?.lines || [
          {
            mapping_id: editFormData.mappingId,
            receipt_type: editingReceipt?.ReceiptType || editingReceipt?.receipt_type || "INSTALLMENT",
            knocking: editingReceipt?.Knocking || editingReceipt?.knocking || "No",
            amount: editingReceipt?.Amount || editingReceipt?.amount || 0
          }
        ]
      };

      const response = await updateReceipt(editFormData.mappingId, payload);

      if (response.success) {
        setEditDialogOpen(false);
        if (onReceiptUpdated) {
          onReceiptUpdated();
        }
        console.log("Receipt updated successfully");
      }
    } catch (error) {
      console.error("Error updating receipt:", error);
    } finally {
      setEditLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX: Build the HTML string for all 3 copies and print in a new window.
  // This replaces the empty "// ... (print logic remains the same)" stub.
  // ─────────────────────────────────────────────────────────────────────────────
  // In ReceiptsTable.jsx — handlePrint fix

  const handlePrint = () => {
    if (!previewInvoice) {
      alert("No invoice data loaded yet. Please wait.");
      return;
    }

    const invoice = previewInvoice;

    // ── DEBUG: log what we actually have ──
    console.log("Printing invoice:", invoice);

    const projectUpper = (
      invoice.Project || invoice.project || ''
    ).toString().toUpperCase();

    let backgroundImage = 'BHUBReceiptFormate.svg';
    if (projectUpper.includes('ODN')) backgroundImage = 'ODNReceiptFormate.svg';
    else if (projectUpper.includes('BHO')) backgroundImage = 'BHOReceiptFormate.svg';

    // Use absolute URL — make sure this file is in /public
    const logoUrl = `${window.location.origin}/${backgroundImage}`;

    // ... (rest of your helpers stay the same) ...

    const html = `<!DOCTYPE html>...`; // your existing HTML string

    // ── FIX: open window synchronously, don't close preview first ──
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      alert(
        "Your browser blocked the print popup.\n\n" +
        "Please allow popups for this site:\n" +
        "Click the blocked popup icon in your address bar → Always allow."
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Close preview AFTER print window is opened successfully
    setPreviewOpen(false);
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ maxHeight: "70vh", overflowX: "auto" }}>
        <Table
          size="small"
          stickyHeader
          sx={{
            "& .MuiTableCell-root": {
              whiteSpace: "nowrap",
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              }}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortConfig?.key === column.id}
                      direction={
                        sortConfig?.key === column.id
                          ? sortConfig.direction
                          : "desc"
                      }
                      onClick={() => onSort && onSort(column.id)}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    <span style={{ whiteSpace: "nowrap" }}>{column.label}</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4, whiteSpace: "nowrap" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <ReceiptIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.5 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      No receipts found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedReceipts.map((receipt, index) => {
                const mappingId = receipt.MappingID || receipt.mapping_id || index;
                const receiptId = receipt.ReceiptID || receipt.receipt_id || receipt.id;
                const entryId = receipt.EntryID || receipt.entry_id;
                const voucherNo = receipt.VoucherNo || receipt.voucher_no;
                const oldVoucherNo = receipt.OldVoucherNo || receipt.old_voucher_no;
                const receiptDate = receipt.ReceiptDate || receipt.receipt_date;
                const entryDate = receipt.EntryDate || receipt.entry_date;
                const unitNo = receipt.UnitNo || receipt.unit_no;
                const customerName = receipt.CustomerName || receipt.customer_name;
                const project = receipt.Project || receipt.project;
                const cnic = receipt.CNIC || receipt.cnic;
                const collectionBy = receipt.CollectionBy || receipt.collection_by;
                const source = receipt.Source || receipt.source;
                const receiptMode = receipt.ReceiptMode || receipt.receipt_mode;
                const codeValue = receipt.Code || receipt.code;
                const code = (codeValue === 0 || codeValue === "0" || codeValue === null || codeValue === undefined || codeValue === "-") ? "0" : codeValue;
                const receiptType = receipt.ReceiptType || receipt.receipt_type;
                const knocking = receipt.Knocking || receipt.knocking;
                const amount = receipt.Amount || receipt.amount || 0;
                const defaultSurcharge = receipt.DefaultSurcharge || receipt.default_surcharge || 0;
                const narration = receipt.Narration || receipt.narration;
                const remarks = receipt.Remarks || receipt.remarks;
                const createdAt = receipt.CreatedAt || receipt.created_at;

                return (
                  <TableRow
                    key={mappingId}
                    hover
                    sx={{
                      "&:nth-of-type(even)": {
                        backgroundColor: alpha(theme.palette.action.hover, 0.02),
                      },
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {mappingId || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {receiptId ? receiptId.substring(0, 8) : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Typography variant="body2" sx={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entryId ? entryId.substring(0, 8) : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.8rem" }}>
                      {voucherNo || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.8rem" }}>
                      {oldVoucherNo || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {formatDate(receiptDate)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {formatDate(entryDate)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {unitNo || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {customerName || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {project || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cnic || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {collectionBy || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {source || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {receiptMode || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {code || "-"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Chip
                        label={receiptType || "-"}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap",
                          backgroundColor: receiptType === "INSTALLMENT"
                            ? alpha(theme.palette.primary.main, 0.1)
                            : receiptType === "FINAL PAYMENT"
                              ? alpha(theme.palette.success.main, 0.1)
                              : alpha(theme.palette.secondary.main, 0.1),
                          color: receiptType === "INSTALLMENT"
                            ? theme.palette.primary.main
                            : receiptType === "FINAL PAYMENT"
                              ? theme.palette.success.main
                              : theme.palette.secondary.main,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Chip
                        label={knocking || "-"}
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap",
                          backgroundColor: knocking === "Yes"
                            ? alpha(theme.palette.warning.main, 0.1)
                            : alpha(theme.palette.grey[500], 0.1),
                          color: knocking === "Yes"
                            ? theme.palette.warning.main
                            : theme.palette.grey[600],
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {formatAmount(amount)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: theme.palette.warning.main, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {formatSurcharge(defaultSurcharge)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Typography variant="body2" sx={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {narration || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Typography variant="body2" sx={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {remarks || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <Typography variant="body2" sx={{ fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {createdAt ? formatDate(createdAt) : "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end", whiteSpace: "nowrap" }}>
                        <Tooltip title="Print Invoice">
                          <IconButton
                            size="small"
                            onClick={async () => {
                              const vNo = receipt.VoucherNo || receipt.voucher_no;
                              if (!vNo) {
                                alert("This receipt has no Voucher Number — cannot print.");
                                return;
                              }
                              try {
                                setPreviewLoading(true);
                                const resp = await getReceiptInvoice(vNo);

                                // ── Unwrap correctly based on your backend's response shape ──
                                // Your backend uses: success(res, data) which likely wraps as { status, data }
                                const invoice = resp.data?.data ?? resp.data ?? null;

                                if (!invoice) {
                                  alert("Could not load invoice data. Check console.");
                                  console.error("Raw response:", resp);
                                  return;
                                }

                                console.log("Invoice loaded:", invoice); // verify fields here
                                setPreviewInvoice(invoice);
                                setPreviewOpen(true);
                              } catch (err) {
                                console.error("Error fetching invoice:", err);
                                alert("Failed to load invoice: " + (err.response?.data?.message || err.message));
                              } finally {
                                setPreviewLoading(false);
                              }
                            }}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {onView && (
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => onView(receipt)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => onEdit(receipt)} sx={{ color: theme.palette.info.main }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const mappingIdToDelete = receipt.MappingID || receipt.mapping_id;
                                onDelete(mappingIdToDelete, getReceiptDisplayNo(receipt));
                              }}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Receipt Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pb: 2
        }}>
          <Typography variant="h6">Edit Receipt</Typography>
          <IconButton onClick={() => setEditDialogOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              p: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Receipt ID</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {editFormData.receiptId ? editFormData.receiptId.substring(0, 8) : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Mapping ID</Typography>
                <Typography variant="body2" fontWeight={500}>{editFormData.mappingId || '-'}</Typography>
              </Box>
            </Box>

            <TextField
              label="Old Voucher No"
              value={editFormData.oldVoucherNo}
              onChange={handleEditFormChange('oldVoucherNo')}
              fullWidth
              size="small"
              variant="outlined"
            />

            <TextField
              label="Receipt Date"
              type="date"
              value={editFormData.receiptDate}
              onChange={handleEditFormChange('receiptDate')}
              fullWidth
              size="small"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Collected By"
              value={editFormData.collectionBy}
              onChange={handleEditFormChange('collectionBy')}
              fullWidth
              size="small"
              variant="outlined"
            />
            <TextField
              label="Source"
              value={editFormData.source}
              onChange={handleEditFormChange('source')}
              fullWidth
              size="small"
              variant="outlined"
            />
            <TextField
              label="Receipt Mode"
              value={editFormData.receiptMode}
              onChange={handleEditFormChange('receiptMode')}
              fullWidth
              size="small"
              variant="outlined"
            />

            <TextField
              label="Code (Installment No)"
              value={editFormData.code}
              onChange={handleEditFormChange('code')}
              fullWidth
              size="small"
              variant="outlined"
              helperText="Installment code/number"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pt: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={previewOpen} fullWidth maxWidth="md" onClose={() => setPreviewOpen(false)}>
        <DialogTitle>Print Preview</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: 'background.paper' }}>
          {previewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ p: 1 }}>
              {previewInvoice ? (
                <Box>
                  {['Master Copy', 'Customer Copy', 'Accounts Copy'].map((label, idx) => (
                    <Box key={label} sx={{ mb: idx < 2 ? 1 : 0 }}>
                      <ReceiptInvoicePrint invoice={previewInvoice} autoPrint={false} copyLabel={label} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography>No preview available</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          {/* ✅ FIXED: Print button now calls handlePrint() */}
          <Button
            variant="contained"
            onClick={handlePrint}
            disabled={!previewInvoice || previewLoading}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      <TablePagination
        component="div"
        count={sortedReceipts.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
};

export default ReceiptsTable;