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
  const handlePrint = () => {
    if (!previewInvoice) return;

    const invoice = previewInvoice;

    // Determine background image (mirrors ReceiptInvoicePrint logic)
    const projectUpper = (
      invoice.Project ||
      invoice.project ||
      invoice.ProjectName ||
      (invoice.lines && invoice.lines[0] && invoice.lines[0].project) ||
      ''
    ).toString().toUpperCase();

    let backgroundImage = 'BHUBReceiptFormate.svg';
    if (projectUpper.includes('BHU') || projectUpper === 'BHUB') {
      backgroundImage = 'BHUBReceiptFormate.svg';
    } else if (projectUpper.includes('ODN')) {
      backgroundImage = 'ODNReceiptFormate.svg';
    } else if (projectUpper.includes('BHO')) {
      backgroundImage = 'BHOReceiptFormate.svg';
    }

    const logoUrl = `${window.location.origin}/${backgroundImage}`;

    // ── Helpers (replicated from ReceiptInvoicePrint) ──────────────────────────
    const fmt = (v) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(v || 0));

    const fmtDate = (d) => {
      if (!d) return "-";
      return new Date(d).toLocaleDateString("en-US");
    };

    const numberToWords = (num) => {
      if (num == null) return "-";
      const n = Number(num) || 0;
      const parts = n.toFixed(2).split('.');
      const intPart = parseInt(parts[0], 10);
      const decPart = parseInt(parts[1], 10);
      const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
      const tens = ["","",'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      const intToWords = (n) => {
        if (n === 0) return 'Zero';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
        if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + intToWords(n%100) : '');
        return '';
      };
      let w = '';
      const scales = [{v:1e9,s:'Billion'},{v:1e6,s:'Million'},{v:1e3,s:'Thousand'}];
      let rem = intPart;
      for (const s of scales) {
        if (rem >= s.v) {
          const c = Math.floor(rem / s.v);
          w += (w ? ' ' : '') + intToWords(c) + ' ' + s.s;
          rem = rem % s.v;
        }
      }
      if (rem > 0) w += (w ? ' ' : '') + intToWords(rem);
      if (!w) w = 'Zero';
      if (decPart > 0) w += ' and ' + decPart + '/100';
      return w + ' Only';
    };

    // ── Field values ──────────────────────────────────────────────────────────
    const regNo        = invoice.RegNo || invoice.RegistrationNo || invoice.regNo || invoice.registrationNo || '-';
    const mobile       = invoice.Mobile || invoice.mobile || invoice.Phone || invoice.phone || '-';
    const sqft         = invoice.SqFt || invoice.Sqft || invoice.sqft || '-';
    const installmentNo = invoice.InstallmentNo || invoice.installmentNo || (invoice.lines && invoice.lines[0] && invoice.lines[0].installmentCode) || '0';
    const status       = invoice.ppu || (invoice.lines && invoice.lines[0]?.ppu) || '-';

    // ── Build one receipt block ───────────────────────────────────────────────
    const buildCopyHtml = (copyLabel) => `
      <div class="receipt-copy">
        <div class="copy-label">${copyLabel}</div>
        <div class="receipt-body">
          <div class="grid">
            <div class="col">
              <div class="row"><span class="lbl">Reg No:</span><span class="val">${regNo}</span></div>
              <div class="row"><span class="lbl">Name:</span><span class="val">${invoice.CustomerName || '-'}</span></div>
              <div class="row"><span class="lbl">Mobile:</span><span class="val">${mobile}</span></div>
              <div class="row"><span class="lbl">Receipt Mode:</span><span class="val">${invoice.ReceiptMode || '-'}</span></div>
              <div class="row"><span class="lbl">Amount:</span><span class="val">${fmt(invoice.TotalAmount)}</span></div>
              <div class="row"><span class="lbl">(in words):</span><span class="val">${numberToWords(invoice.TotalAmount)}</span></div>
            </div>
            <div class="col">
              <div class="row"><span class="lbl">Receipt Date:</span><span class="val">${fmtDate(invoice.ReceiptDate)}</span></div>
              <div class="row"><span class="lbl">Voucher No:</span><span class="val">${invoice.VoucherNo || '-'}</span></div>
              <div class="row"><span class="lbl">Unit:</span><span class="val">${invoice.UnitNo || '-'}</span></div>
              <div class="row"><span class="lbl">SQ FT:</span><span class="val">${sqft}</span></div>
              <div class="row"><span class="lbl">Installment No:</span><span class="val">${installmentNo}</span></div>
              <div class="row"><span class="lbl">Status PPU:</span><span class="val">${status}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // ── Full page HTML ────────────────────────────────────────────────────────
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt Print</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }

            /* Force single A4 page — no overflow, no extra pages */
            @page {
              size: A4 portrait;
              margin: 6mm;
            }

            html, body {
              width: 210mm;
              height: 297mm;
              font-family: "Arial", sans-serif;
              font-size: 16px;
              color: #000;
              background: #fff;
              overflow: hidden;
            }

            /* Wrapper fills the whole A4 and divides into 3 equal rows */
            .page-wrapper {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }

            /* Each copy gets exactly 1/3 of the page height */
            .receipt-copy {
              position: relative;
              flex: 1;
              min-height: 0;
              margin-top: 10mm;
              padding: 0 20px 10px 20px;
              background-image: url('${logoUrl}');
              background-repeat: no-repeat;
              background-position: top center;
              background-size: 100% auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            /* Dashed cut line between copies */
            .receipt-copy:not(:last-child) {
              border-bottom: 1.5px dashed #bbb;
            }

            .copy-label {
              text-align: center;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              padding-top: 20px;
              margin-top: 15px;
              margin-bottom: 2px;
              color: #555;
            }

            /* Push content 30px below the SVG header */
            .receipt-body {
              padding-top: 30px;
              font-size: 16px;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: top;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px 20px;
            }

            .col { display: flex; flex-direction: column; gap: 5px; }

            .row {
              display: flex;
              gap: 6px;
              align-items: baseline;
              line-height: 1.5;
            }

            .lbl {
              width: 38%;
              font-weight: 400;
              flex-shrink: 0;
              color: #000;
              font-size: 15px;
            }

            .val {
              flex: 1;
              font-weight: 500;
              color: #000;
              font-size: 15px;
              word-break: break-word;
            }

            @media print {
              html, body { width: 210mm; height: 297mm; overflow: hidden; }
              .receipt-copy {
                background-image: url('${logoUrl}') !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-wrapper">
          ${buildCopyHtml('Master Copy')}  
          ${buildCopyHtml('Customer Copy')}
            
            ${buildCopyHtml('Accounts Copy')}
          </div>

          <script>
            // Wait for background image to load before printing
            window.onload = function () {
              setTimeout(function () {
                window.print();
                window.onafterprint = function () { window.close(); };
              }, 500);
            };
          </script>
        </body>
      </html>
    `;


    // ── Open print window ─────────────────────────────────────────────────────
    try {
      const printWindow = window.open("", "_blank", "width=900,height=1100");
      if (!printWindow) {
        alert("Popup blocked! Please allow popups for this site and try again.");
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setPreviewOpen(false);
    } catch (err) {
      console.error('Error opening print window:', err);
    }
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
                                console.error("No Voucher Number found for this row");
                                return;
                              }
                              try {
                                setPreviewLoading(true);
                                const resp = await getReceiptInvoice(vNo);
                                const invoice = resp.data?.data || resp.data || resp;
                                setPreviewInvoice(invoice);
                                setPreviewOpen(true);
                              } catch (err) {
                                console.error("Error fetching invoice for preview", err);
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