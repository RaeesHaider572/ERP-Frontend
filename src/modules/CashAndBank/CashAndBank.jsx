import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";

import {
  Box, Button, Container, Paper, Typography, TextField, IconButton,
  Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, useTheme, alpha, Snackbar, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TableSortLabel, InputAdornment, Divider,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Refresh as RefreshIcon, Close as CloseIcon,
  AccountBalance as AccountBalanceIcon,
  Upload as UploadIcon, Download as DownloadIcon,
  FilterList as FilterIcon, Print as PrintIcon,
} from "@mui/icons-material";
import {
  getCashAndBank, createCashAndBank, updateCashAndBank, deleteCashAndBank,
  bulkImportCashAndBank, exportCashAndBank,
} from "../../services/cashAndBankService";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import BankBalances from "./BankBalances";

// ── Formatters ─────────────────────────────────────────────────────────────
const fCurrency = (v) => {
  if (v == null || v === "") return "-";
  return Math.round(Number(v)).toLocaleString("en-PK");
};

const fDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const fStr = (v) => (v != null && v !== "" ? String(v) : "-");

// ── Print Voucher ──────────────────────────────────────────────────────────
const printVoucher = (record) => {
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g, "-") : "-";
  const amount = Math.round(Number(record.Amount || record.Debit || 0));
  const numberToWords = (num) => {
    const n = Math.abs(Math.round(Number(num) || 0));
    if (n === 0) return "Zero";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
      "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
      "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
      "Sixty", "Seventy", "Eighty", "Ninety"];
    const toWords = (n) => {
      if (n === 0) return "";
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + toWords(n % 100) : "");
    };
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const rest = n % 1000;
    let words = "";
    if (crore) words += toWords(crore) + " Crore ";
    if (lakh) words += toWords(lakh) + " Lakh ";
    if (thousand) words += toWords(thousand) + " Thousand ";
    if (rest) words += toWords(rest);
    return words.trim() + " Rupees Only";
  };

  const watermarkSvg = `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 967.68 967.68">
  <defs><style>.st0{fill:#244d68;}.st0,.st1,.st2{stroke:#a8aaac;stroke-miterlimit:10;}.st1{fill:#1f96ce;}.st2{fill:none;}</style></defs>
  <polygon class="st0" points="412.25 482.06 143.87 482.06 142.16 478.53 276.79 243.73 412.25 482.06"/>
  <polygon class="st0" points="143.87 485.62 409.72 485.62 411.52 489.24 276.79 723.95 142.17 489.14 143.87 485.62"/>
  <polygon class="st2" points="692.84 482.06 424.46 482.06 422.75 478.53 557.38 243.73 692.84 482.06"/>
  <polygon class="st2" points="424.45 485.62 690.31 485.62 692.11 489.24 557.38 723.95 422.75 489.14 424.45 485.62"/>
  <polygon class="st0" points="553.59 729.32 418.96 967.68 282.68 729.32 553.59 729.32"/>
  <polygon class="st0" points="553.59 238.36 282.68 238.36 416.47 1.76 553.59 238.36"/>
  <polygon class="st0" points="412.25 967.68 141.34 967.68 275.97 729.32 412.25 967.68"/>
  <polygon class="st0" points="412.25 0 275.97 238.36 141.34 0 412.25 0"/>
  <polygon class="st0" points="553.59 243.7 418.14 480.25 282.68 243.7 553.59 243.7"/>
  <polygon class="st2" points="832.07 243.7 696.62 480.25 561.16 243.7 832.07 243.7"/>
  <polygon class="st2" points="270.91 238.36 0 238.36 133.79 1.76 270.91 238.36"/>
  <polygon class="st2" points="270.91 243.7 135.45 480.25 0 243.7 270.91 243.7"/>
  <polygon class="st0" points="553.59 723.98 282.68 723.98 418.14 487.43 553.59 723.98"/>
  <polygon class="st2" points="271.45 729.32 136.82 967.68 .55 729.32 271.45 729.32"/>
  <polygon class="st2" points="271.45 723.98 .55 723.98 136 487.43 271.45 723.98"/>
  <polygon class="st1" points="691.97 967.68 422.75 967.68 558.2 731.13 691.97 967.68"/>
  <polygon class="st2" points="967.68 967.68 698.46 967.68 833.91 731.13 967.68 967.68"/>
  <polygon class="st1" points="690.29 0 556.52 236.55 422.75 0 690.29 0"/>
  <polygon class="st2" points="967.68 0 833.91 236.55 700.14 0 967.68 0"/>
  <polygon class="st2" points="561.16 238.36 696.6 1.77 830.39 238.36 561.16 238.36"/>
  <polygon class="st1" points="828.7 729.32 694.92 965.91 561.16 729.32 828.7 729.32"/>
  <polygon class="st1" points="827.02 723.98 557.8 723.98 691.58 489.16 827.02 723.98"/>
  <polygon class="st1" points="965.99 487.4 832.21 722.22 696.77 487.4 965.99 487.4"/>
</svg>`;
  const watermarkEncoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(watermarkSvg)}`;

  const html = `<!DOCTYPE html><html><head><title>${record.VNo || "Voucher"}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { font-family: "Courier New", Courier, monospace; font-size:14px; padding:0; margin:0; }
.page { width:210mm; height:297mm; margin:auto; padding:45px; display:flex; flex-direction:column; position:relative; }
.page::before { content:""; position:absolute; top:0; left:0; width:100vw; height:100vh;
  background-image:url("${watermarkEncoded}"); background-repeat:no-repeat; background-size:cover;
  background-position:center; opacity:0.03; pointer-events:none;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.title { font-weight:bold; font-size:22px; text-align:center; flex:1; text-decoration:underline; text-transform:uppercase; }
.row { display:flex; justify-content:space-between; margin-bottom:10px; }
.field, .description { display:flex; gap:2px; }
.field { width:33%; }
.label { margin:0; font-weight:bold; }
.value { text-decoration:underline; display:inline-block; }
.description { margin-top:15px; }
.description .value { width:100%; text-decoration:none; border-bottom:0.5px solid; }
.table-container { border:1px solid #000; margin-top:20px; flex:1; }
table { width:100%; border-collapse:collapse; }
th, td { border:0; padding:6px; }
th { text-align:left; font-weight:bold; }
th, tr { border-bottom:0.5px solid #000; }
tr:last-child { border-bottom:0; }
.amount { text-align:right; }
.totalRow td { font-weight:bold; }
.amountWords { margin-top:20px; }
.signatures { display:flex; justify-content:space-between; margin-top:30px; gap:8px; }
.signatures .field { width:auto; border-bottom:1px solid #000; padding-bottom:70px; }
.sign { display:flex; width:50%; justify-content:space-between; align-items:baseline; }
.sign .label { width:70%; display:flex; }
.signLine { border-top:1px solid #000; margin-top:20px; height:1px; display:inline-block; width:100%; }
.bottomSigns { display:flex; justify-content:space-between; margin-top:50px; gap:15px; }
.footer { margin-top:30px; font-size:11px; }
</style></head><body>
<div class="page">
  <div class="header">
    <svg width="90" height="90" viewBox="0 0 967.68 880" xmlns="http://www.w3.org/2000/svg">
      <defs><style>.lst0{fill:#244d68;stroke:#a8aaac;stroke-miterlimit:10;}.lst1{fill:#1f96ce;stroke:#a8aaac;stroke-miterlimit:10;}.lst2{fill:none;stroke:#a8aaac;stroke-miterlimit:10;}</style></defs>
      <polygon class="lst0" points="424.87 342.67 265.53 342.67 264.51 340.68 344.45 208.82 424.87 342.67"/>
      <polygon class="lst0" points="265.53 344.67 423.37 344.67 424.44 346.7 344.45 478.52 264.52 346.64 265.53 344.67"/>
      <polygon class="lst2" points="591.46 342.67 432.12 342.67 431.11 340.68 511.04 208.82 591.46 342.67"/>
      <polygon class="lst2" points="432.12 344.67 589.96 344.67 591.03 346.7 511.04 478.52 431.11 346.64 432.12 344.67"/>
      <polygon class="lst0" points="508.79 481.53 428.85 615.4 347.95 481.53 508.79 481.53"/>
      <polygon class="lst0" points="508.79 205.8 347.95 205.8 427.38 72.92 508.79 205.8"/>
      <polygon class="lst0" points="424.87 615.4 264.03 615.4 343.96 481.53 424.87 615.4"/>
      <polygon class="lst0" points="424.87 71.93 343.96 205.8 264.03 71.93 424.87 71.93"/>
      <polygon class="lst0" points="508.79 208.8 428.37 341.65 347.95 208.8 508.79 208.8"/>
      <polygon class="lst2" points="674.13 208.8 593.71 341.65 513.29 208.8 674.13 208.8"/>
      <polygon class="lst2" points="340.95 205.8 180.11 205.8 259.54 72.92 340.95 205.8"/>
      <polygon class="lst2" points="340.95 208.8 260.53 341.65 180.11 208.8 340.95 208.8"/>
      <polygon class="lst0" points="508.79 478.53 347.95 478.53 428.37 345.68 508.79 478.53"/>
      <polygon class="lst2" points="341.28 481.53 261.34 615.4 180.43 481.53 341.28 481.53"/>
      <polygon class="lst2" points="341.28 478.53 180.43 478.53 260.86 345.68 341.28 478.53"/>
      <polygon class="lst1" points="590.95 615.4 431.11 615.4 511.53 482.55 590.95 615.4"/>
      <polygon class="lst2" points="754.64 615.4 594.8 615.4 675.22 482.55 754.64 615.4"/>
      <polygon class="lst1" points="589.95 71.93 510.53 204.78 431.11 71.93 589.95 71.93"/>
      <polygon class="lst2" points="754.65 71.93 675.22 204.78 595.8 71.93 754.65 71.93"/>
      <polygon class="lst2" points="513.29 205.8 593.7 72.92 673.13 205.8 513.29 205.8"/>
      <polygon class="lst1" points="672.13 481.53 592.7 614.41 513.29 481.53 672.13 481.53"/>
      <polygon class="lst1" points="671.13 478.53 511.29 478.53 590.72 346.65 671.13 478.53"/>
      <polygon class="lst1" points="753.64 345.66 674.21 477.55 593.8 345.66 753.64 345.66"/>
    </svg>
    <div class="title">${record.Type || "BPV"}</div>
  </div>
  <div class="row">
    <div class="field"><span class="label">Bank Name:</span><span class="value">${record.BankNameCashName || ""}</span></div>
    <div class="field"><span class="label">Voucher No:</span><span class="value">${record.VNo || record.SrNo}</span></div>
    <div class="field"><span class="label">Transaction Date:</span><span class="value">${formatDate(record.Date)}</span></div>
  </div>
  <div class="row">
    <div class="field"><span class="label">Project:</span><span class="value">${record.Project || ""}</span></div>
    <div class="field"><span class="label">Division:</span><span class="value">${record.Division || ""}</span></div>
    <div class="field"><span class="label">Bank Company:</span><span class="value">${record.Company || ""}</span></div>
  </div>
  <div class="description"><b class="label">Description:</b><div class="value">${record.Description || ""}</div></div>
  <div class="table-container">
    <table>
      <thead><tr><th style="width:35%">Function</th><th style="width:30%">Counter Party</th><th style="width:20%">Cheque #</th><th style="width:15%">Amount</th></tr></thead>
      <tbody>
        <tr><td>${record.Function || ""}</td><td>${record.CounterParty || ""}</td><td>${record.ChequeNo || ""}</td><td class="amount">${amount.toLocaleString()}</td></tr>
        <tr class="totalRow"><td colspan="3">Total</td><td class="amount">${amount.toLocaleString()}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="amountWords"><b>Amounts in Rupees:</b> ${numberToWords(Math.abs(amount))}</div>
  <div class="signatures">
    <div class="field"><div class="label">Prepared By:</div><div class="value">Aqib Hassan</div></div>
    <div class="field"><div class="label">Reviewed By:</div><div class="value">Waqar Hussain</div></div>
    <div class="field"><div class="label">Received By:</div><div class="value">${record.PaidTo || ""}</div></div>
  </div>
  <div class="bottomSigns">
    <div class="sign"><div class="label">Director Finance</div><div class="signLine"></div></div>
    <div class="sign"><div class="label">Chief Executive</div><div class="signLine"></div></div>
  </div>
  <div class="footer">This computer generated voucher is printed on <u>${new Date().toLocaleString()}</u></div>
</div>
<script>window.onload = () => window.print();</script>
</body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(html);
  win.document.close();
};

// ── Empty form ─────────────────────────────────────────────────────────────
const makeEmptyForm = () => ({
  Date: new Date().toISOString(),
  Type: "", VNo: "", ChequeNo: "",
  BankReconciliation: "", CashAndBank: "", BankNameCashName: "", Description: "",
  CostDrivers: "", TopSheet: "", Parent: "", Function: "",
  ConstructionExpenses: "", SalaryAndBenefits: "", DirectorEmployee: "", SalariesBenefits: "",
  CounterParty: "", Site: "", EmployeeName: "", AssetLoan: "",
  Project: "", RevenueExpenseBalanceSheet: "",
  DealNumber: "", PlotNumber: "", DealValue: "", Sector: "",
  Company: "", CareOfCompany: "", Division: "", SBClassification: "",
  MarketingCampaigns: "", MarketingNaturewise: "", CP: "", PaidTo: "",
  Director: "", LandPlotFees: "", ProjectName: "",
  Debit: "", Credit: "", InstrumentDate: "",
});

// ── Client-side validation (mirrors server NOT NULL rules) ─────────────────
// Returns an errors object { fieldName: "error message" }
// Empty object means valid.
const validateForm = (form) => {
  const errors = {};
  const req = (field, label) => {
    if (!form[field] || String(form[field]).trim() === "") {
      errors[field] = `${label} is required.`;
    }
  };

  // ── NOT NULL fields from DB schema ──
  req("Date", "Date & Time");
  req("Type", "Type");
  req("CashAndBank", "Cash & Bank");
  req("BankNameCashName", "Bank / Cash Name");
  req("Description", "Description");
  req("CostDrivers", "Cost Drivers");
  req("TopSheet", "Top Sheet");
  req("Parent", "Parent");
  req("Function", "Function");
  req("CounterParty", "Counter Party");
  req("Project", "Project");
  req("RevenueExpenseBalanceSheet", "Revenue / Expense / Balance Sheet");
  req("Company", "Company");
  req("Division", "Division");
  req("ProjectName", "Project Name");
  req("InstrumentDate", "Instrument Date");

  // ── Business rule: Debit and Credit cannot both be non-zero ──
  const debit = Number(form.Debit) || 0;
  const credit = Number(form.Credit) || 0;
  if (debit > 0 && credit > 0) {
    errors.Debit = "Cannot have both Debit and Credit.";
    errors.Credit = "Cannot have both Debit and Credit.";
  }

  // ── Business rule: InstrumentDate cannot be after transaction Date ──
  if (form.InstrumentDate && form.Date) {
    const instrDate = new Date(form.InstrumentDate);
    const txnDate = new Date(form.Date);
    if (instrDate > txnDate) {
      errors.InstrumentDate = "Instrument Date cannot be after transaction Date.";
    }
  }

  return errors;
};

// ── Table columns ──────────────────────────────────────────────────────────
const TABLE_COLS = [
  { id: "SrNo", label: "Sr#", minWidth: 60 },
  { id: "Date", label: "Date", minWidth: 160, isDate: true },
  { id: "Type", label: "Type", minWidth: 100 },
  { id: "VNo", label: "V #", minWidth: 190 },
  { id: "ChequeNo", label: "Cheque #", minWidth: 110 },
  { id: "BankReconciliation", label: "Bank Reconciliation", minWidth: 130 },
  { id: "CashAndBank", label: "Cash/Bank", minWidth: 100 },
  { id: "BankNameCashName", label: "Bank/Cash Name", minWidth: 150 },
  { id: "Description", label: "Description", minWidth: 150 },
  { id: "CostDrivers", label: "Cost Drivers", minWidth: 130 },
  { id: "TopSheet", label: "Top Sheet", minWidth: 120 },
  { id: "Parent", label: "Parent", minWidth: 110 },
  { id: "Function", label: "Function", minWidth: 110 },
  { id: "ConstructionExpenses", label: "Construction Expenses", minWidth: 120 },
  { id: "SalaryAndBenefits", label: "Salary & Benefits", minWidth: 130 },
  { id: "DirectorEmployee", label: "Director/Employee", minWidth: 120 },
  { id: "SalariesBenefits", label: "Salaries & Benefits", minWidth: 120 },
  { id: "CounterParty", label: "Counter Party", minWidth: 140 },
  { id: "Site", label: "Site", minWidth: 100 },
  { id: "EmployeeName", label: "Employee Name", minWidth: 130 },
  { id: "AssetLoan", label: "Asset/Loan", minWidth: 120 },
  { id: "Project", label: "Project", minWidth: 100 },
  { id: "RevenueExpenseBalanceSheet", label: "Revenue Expense Balance Sheet", minWidth: 120 },
  { id: "DealNumber", label: "Deal No.", minWidth: 120 },
  { id: "PlotNumber", label: "Plot No.", minWidth: 110 },
  { id: "DealValue", label: "Deal Value", minWidth: 120, isCurrency: true },
  { id: "Sector", label: "Sector", minWidth: 110 },
  { id: "Company", label: "Company", minWidth: 130 },
  { id: "CareOfCompany", label: "Care of Company", minWidth: 120 },
  { id: "Division", label: "Division", minWidth: 110 },
  { id: "SBClassification", label: "SB Classification", minWidth: 110 },
  { id: "MarketingCampaigns", label: "Marketing Campaign", minWidth: 130 },
  { id: "MarketingNaturewise", label: "Marketing Nature", minWidth: 120 },
  { id: "CP", label: "CP", minWidth: 80 },
  { id: "PaidTo", label: "Paid To", minWidth: 130 },
  { id: "Director", label: "Director", minWidth: 120 },
  { id: "LandPlotFees", label: "Land/Plot Fees", minWidth: 130 },
  { id: "ProjectName", label: "Project Name", minWidth: 140 },
  { id: "Debit", label: "Debit", minWidth: 120, isCurrency: true },
  { id: "Credit", label: "Credit", minWidth: 120, isCurrency: true },
  { id: "Amount", label: "Amount", minWidth: 120, isCurrency: true },
  { id: "Balance", label: "Balance", minWidth: 120, isCurrency: true },
  { id: "InstrumentDate", label: "Instrument Date", minWidth: 110, isDateOnly: true },
  { id: "actions", label: "Actions", minWidth: 110, align: "right", sortable: false },
];

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.2, mt: 1 }}>
      {children}
    </Typography>
  );
}

// ── Reusable form field ────────────────────────────────────────────────────
function FF({ label, name, form, errors, onChange, type = "text", ...rest }) {
  return (
    <TextField
      label={label} name={name} value={form[name] ?? ""} onChange={onChange}
      error={!!errors[name]} helperText={errors[name]} fullWidth size="small"
      type={type} InputLabelProps={type === "date" ? { shrink: true } : undefined}
      {...rest}
    />
  );
}

// ── DateTimeField ──────────────────────────────────────────────────────────
function DateTimeField({ label, name, form, errors, onChange }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        label={label}
        value={form[name] ? dayjs(form[name]) : null}
        onChange={(newValue) =>
          onChange({
            target: {
              name,
              value: newValue && newValue.isValid() ? newValue.toISOString() : "",
            },
          })
        }
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            error: !!errors?.[name],
            helperText: errors?.[name],
          },
        }}
      />
    </LocalizationProvider>
  );
}

// ── DateField ──────────────────────────────────────────────────────────────
function DateField({ label, name, form, errors, onChange }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={form[name] ? dayjs(form[name]) : null}
        onChange={(newValue) =>
          onChange({
            target: {
              name,
              value: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
            },
          })
        }
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            error: !!errors?.[name],
            helperText: errors?.[name],
          },
        }}
      />
    </LocalizationProvider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function CashAndBank() {
  const theme = useTheme();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ type: "", project: "", counterParty: "", cashAndBank: "", BankNameCashName: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: "SrNo", direction: "desc" });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(makeEmptyForm());
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteDlg, setDeleteDlg] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const resetForm = () => {
    setForm(makeEmptyForm());
    setEditingItem(null);
    setFormErrors({});
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await getCashAndBank();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRecords(data);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Form handlers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    // Clear error for this field on change
    if (formErrors[name]) setFormErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const f = {};
    Object.keys(makeEmptyForm()).forEach((k) => {
      if (k === "Date") {
        f[k] = item[k] ? new Date(item[k]).toISOString() : new Date().toISOString();
      } else if (k === "InstrumentDate") {
        f[k] = item[k] ? String(item[k]).split("T")[0] : "";
      } else {
        f[k] = item[k] ?? "";
      }
    });
    setForm(f);
    setFormErrors({});
    setShowModal(true);
  };

  // ── Submit with client-side validation ───────────────────────────────────
  const handleSubmit = async () => {
    // Run validation before hitting the API
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showMsg(
        `Please fix ${Object.keys(errors).length} required field(s) before saving.`,
        "error"
      );
      return; // stop here — don't call API
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!editingItem) delete payload.VNo;

      ["Debit", "Credit", "DealValue"].forEach((k) => {
        payload[k] = form[k] !== "" && form[k] != null ? Math.round(Number(form[k])) : null;
      });
      delete payload.Amount;
      delete payload.Balance;

      payload.Date = form.Date
        ? new Date(form.Date).toISOString()
        : new Date().toISOString();

      payload.InstrumentDate = form.InstrumentDate
        ? form.InstrumentDate.split("T")[0]
        : null;

      if (editingItem) {
        await updateCashAndBank(editingItem.SrNo, payload);
        showMsg("Record updated successfully!");
      } else {
        await createCashAndBank(payload);
        showMsg("Record created successfully!");
      }
      setShowModal(false);
      resetForm();
      fetchAll();
    } catch (err) {
      // Show server validation errors if returned as structured array
      const serverErrors = err.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        showMsg(serverErrors.join(" | "), "error");
      } else {
        showMsg(err.response?.data?.message || "Error saving record.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCashAndBank(toDelete.SrNo);
      showMsg("Record deleted!");
      setDeleteDlg(false); setToDelete(null);
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || "Error deleting record.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    if (records.length === 0) { showMsg("No data to export", "warning"); return; }
    setExporting(true);
    try {
      await exportCashAndBank();
      showMsg("Export downloaded!");
    } catch (err) {
      showMsg("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await bulkImportCashAndBank(fd);
      setImportResults(res.data.data);
      showMsg(res.data.message, res.data.data.failed > 0 ? "warning" : "success");
      fetchAll();
    } catch (err) {
      showMsg(err.response?.data?.message || "Import failed.", "error");
    } finally {
      setImporting(false);
    }
  };

  // ── Filters ──────────────────────────────────────────────────────────────
  const uniq = (key) => [...new Set(records.map((r) => r[key]).filter(Boolean).sort())];
  const uniqueTypes = uniq("Type");
  const uniqueProjects = uniq("Project");
  const uniqueCounterParty = uniq("CounterParty");
  const uniqueCashAndBank = uniq("CashAndBank");
  const uniqueBankNameCashName = uniq("BankNameCashName");

  const filtered = records.filter((r) => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(s));
    const matchType = !filters.type || r.Type === filters.type;
    const matchProject = !filters.project || r.Project === filters.project;
    const matchCounterParty = !filters.counterParty || r.CounterParty === filters.counterParty;
    const matchCashAndBank = !filters.cashAndBank || r.CashAndBank === filters.cashAndBank;
    const matchBankNameCashName = !filters.BankNameCashName || r.BankNameCashName === filters.BankNameCashName;
    return matchSearch && matchType && matchProject && matchCounterParty && matchCashAndBank && matchBankNameCashName;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortConfig.key] ?? "", bv = b[sortConfig.key] ?? "";
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const handleSort = (key) =>
    setSortConfig((p) => ({ key, direction: p.key === key && p.direction === "asc" ? "desc" : "asc" }));

  // ── Cell renderer ─────────────────────────────────────────────────────────
  const renderCell = (col, item) => {
    if (col.id === "actions") return (
      <TableCell key="actions" align="right" sx={{ whiteSpace: "nowrap" }}>
        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
          <Tooltip title="Print Voucher">
            <IconButton size="small" onClick={() => printVoucher(item)} sx={{ color: theme.palette.success.main }}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(item)} sx={{ color: theme.palette.info.main }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => { setToDelete(item); setDeleteDlg(true); }} sx={{ color: theme.palette.error.main }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    );
    const value = item[col.id];
    const display = col.isDate ? fDate(value) : col.isCurrency ? fCurrency(value) : fStr(value);
    return (
      <TableCell key={col.id} align={col.align || "left"} sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
        {display}
      </TableCell>
    );
  };

  const selectedBankBalance = React.useMemo(() => {
    if (!filters.BankNameCashName) return 0;
    return records
      .filter(r => r.BankNameCashName === filters.BankNameCashName)
      .reduce((sum, r) => sum + (Number(r.Amount) || 0), 0);
  }, [records, filters.BankNameCashName]);

  // ── Count required errors for save button badge ───────────────────────────
  const errorCount = Object.keys(formErrors).length;

  if (loading)
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;



  // ── Bank / Cash Name options ───────────────────────────────────────────────
  const BankCashNameOptions = [
    // "HBL - Main Account",
    // "MCB - Payroll",
    // "Cash - Head Office",
  ];
  // ── Cost Drivers options ───────────────────────────────────────────────
  const CostDriversOptions = [];
  // ── Top Sheet options ───────────────────────────────────────────────
  const TopSheetOptions = [];
  // ── Parent options ───────────────────────────────────────────────
  const ParentOptions = [];
  // ── Function options ───────────────────────────────────────────────
  const FunctionOptions = [];
  // ── Construction Expenses options ───────────────────────────────────────────────
  const ConstructionExpensesOptions = [];
  // ── Salary Benefits options ───────────────────────────────────────────────
  const SalaryBenefitsOptions = [];
  // ── Director / Employee options ───────────────────────────────────────────────
  const DirectorEmployeeOptions = [];
  // ── Salaries Benefits options ───────────────────────────────────────────────
  const SalariesBenefitsOptions = [];
  // ── Revenue Expense Balance Sheet Options ───────────────────────────────────────────────
  const RevenueExpenseBSOptions = [];

  // ── ProjectNameOptions ───────────────────────────────────────────────
  const ProjectNameOptions = [];
  // ── SectorOptions ───────────────────────────────────────────────
  const SectorOptions = [];
  // ── CompanyOptions ───────────────────────────────────────────────
  const CompanyOptions = [];
  // ── CareOfCompanyOptions ───────────────────────────────────────────────
  const CareOfCompanyOptions = [];
  // ── DivisionOptions ───────────────────────────────────────────────
  const DivisionOptions = [];
  // ── CPOptions ───────────────────────────────────────────────
  const CPOptions = [];
  // ── LandPlotFeesOptions ───────────────────────────────────────────────
  const LandPlotFeesOptions = [];

  return (
    <Container maxWidth="xxl" sx={{ py: { md: 0 }, px: { xs: 2, sm: 3, md: 0 } }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 8, md: 9 }}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 }, }}>
            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={3500}
              onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}>
              <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
                {snackbar.message}
              </Alert>
            </Snackbar>

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <Paper elevation={0} sx={{
              p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 }, borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AccountBalanceIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Cash &amp; Bank</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {records.length.toLocaleString()} total records
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: "flex", gap: 1, justifyContent: { md: "flex-end" }, flexWrap: "wrap" }}>
                  <Tooltip title="Refresh">
                    <IconButton onClick={fetchAll} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Excel">
                    <IconButton onClick={handleExport} disabled={exporting || records.length === 0}
                      sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      {exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Import Excel">
                    <IconButton onClick={() => { setImportDialog(true); setImportResults(null); setImportFile(null); }}
                      disabled={importing} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      {importing ? <CircularProgress size={20} /> : <UploadIcon />}
                    </IconButton>
                  </Tooltip>
                  {/* <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => { resetForm(); setShowModal(true); }}
                    sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
                    Add Record
                  </Button> */}
                  {/* <Button
                    onClick={() => {
                      resetForm();
                      navigate("/cash-and-bank/new");
                    }}
                  >
                    Add Record
                  </Button> */}
                </Grid>
              </Grid>
            </Paper>

            {/* ── Search & Filters ─────────────────────────────────────────────── */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField fullWidth placeholder="Search all fields…" value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                    variant="outlined" size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary" }} /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} md={12}>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {[
                        { label: "Cash/Bank", key: "cashAndBank", opts: uniqueCashAndBank },
                        { label: "Type", key: "type", opts: uniqueTypes },
                        { label: "Project", key: "project", opts: uniqueProjects },
                        { label: "Counter Party", key: "counterParty", opts: uniqueCounterParty },
                        { label: "Bank/Cash Name", key: "BankNameCashName", opts: uniqueBankNameCashName },
                      ].map(({ label, key, opts }) => (
                        <FormControl key={key} size="small" sx={{ minWidth: 140 }}>
                          <InputLabel>{label}</InputLabel>
                          <Select value={filters[key] || ""} label={label}
                            onChange={(e) => { setFilters((p) => ({ ...p, [key]: e.target.value })); setPage(0); }}>
                            <MenuItem value="">All</MenuItem>
                            {opts.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                          </Select>
                        </FormControl>
                      ))}
                      <Button variant="outlined" startIcon={<FilterIcon />} size="small"
                        onClick={() => setFilters({ type: "", project: "", counterParty: "", cashAndBank: "", BankNameCashName: "" })}>
                        Clear
                      </Button>
                    </Box>
                    {filters.BankNameCashName && (
                      <Paper variant="outlined" sx={{
                        px: 2, py: 0.5, display: "flex", alignItems: "center", gap: 1,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderColor: theme.palette.success.light,
                      }}>
                        <Typography variant="body2" color="text.secondary">Current Balance:</Typography>
                        <Typography variant="subtitle2" fontWeight="bold"
                          color={selectedBankBalance >= 0 ? "success.main" : "error.main"}>
                          Rs. {fCurrency(selectedBankBalance)}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* ── Table ──────────────────────────────────────────────────────────── */}
            <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, overflow: "hidden" }}>
              <TableContainer sx={{ maxHeight: "80vh" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {TABLE_COLS.map((col) => (
                        <TableCell key={col.id} align={col.align || "left"} sx={{
                          fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap",
                          minWidth: col.minWidth, backgroundColor: theme.palette.background.paper,
                        }}>
                          {col.sortable !== false
                            ? <TableSortLabel active={sortConfig.key === col.id}
                              direction={sortConfig.key === col.id ? sortConfig.direction : "asc"}
                              onClick={() => handleSort(col.id)}>{col.label}</TableSortLabel>
                            : col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={TABLE_COLS.length} align="center" sx={{ py: 6 }}>
                          <AccountBalanceIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4, display: "block", mx: "auto", mb: 1 }} />
                          <Typography color="text.secondary">No records found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((item) => (
                      <TableRow key={item.SrNo} hover sx={{ "&:nth-of-type(even)": { backgroundColor: alpha(theme.palette.action.hover, 0.02) } }}>
                        {TABLE_COLS.map((col) => renderCell(col, item))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={sorted.length} page={page}
                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100, 200]} />
            </Paper>

            {/* ══════════════════════════════════════════════════════════════════════
          Add / Edit Dialog
      ══════════════════════════════════════════════════════════════════════ */}
            <Dialog open={showModal} onClose={() => { setShowModal(false); resetForm(); }}
              maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
              <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h5" fontWeight={600}>{editingItem ? "Edit Record" : "Add New Record"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {editingItem ? `Editing Sr# ${editingItem.SrNo}` : "Fill in the cash & bank details"}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => { setShowModal(false); resetForm(); }}><CloseIcon /></IconButton>
              </DialogTitle>

              <DialogContent sx={{ pt: 3 }}>

                {/* ── Validation summary banner (shows after first failed submit) ── */}
                {errorCount > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <strong>{errorCount} required field{errorCount > 1 ? "s are" : " is"} missing.</strong>{" "}
                    Fields marked with * below must be filled in.
                  </Alert>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

                  {/* ── Basic Info ──────────────────────────────────────────────── */}
                  <SectionLabel>Basic Info</SectionLabel>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <DateTimeField label="Date & Time *" name="Date" form={form} errors={formErrors} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.Type}>
                        <InputLabel>Type *</InputLabel>
                        <Select name="Type" value={form.Type ?? ""} label="Type *" onChange={handleChange}>
                          {["BPV", "BRV", "CPV", "CRV", "JV", "BTV"].map((t) => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.Type && (
                          <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.Type}</Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <TextField
                        label="V #" name="VNo"
                        value={editingItem ? (form.VNo || editingItem.VNo || "") : "Auto-generated"}
                        fullWidth size="small"
                        InputProps={{ readOnly: true }}
                        sx={{
                          "& .MuiInputBase-input": { color: "text.secondary", fontStyle: editingItem ? "normal" : "italic" },
                          bgcolor: (t) => t.palette.action.hover,
                        }}
                        helperText={editingItem ? "Voucher number (locked)" : `e.g. ${form.Type || "BPV"}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FF label="Cheque #" name="ChequeNo" form={form} errors={formErrors} onChange={handleChange} />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 0.5 }} />

                  {/* ── Bank / Cash Info ─────────────────────────────────────────── */}
                  <SectionLabel>Bank / Cash Info</SectionLabel>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Bank Reconciliation" name="BankReconciliation" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Cash And Bank *" name="CashAndBank" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.BankNameCashName}>
                        <InputLabel>Bank/Cash Name *</InputLabel>
                        <Select
                          name="BankNameCashName"
                          value={form.BankNameCashName ?? ""}
                          label="Bank/Cash Name *"
                          onChange={handleChange}
                        >
                          {BankCashNameOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.BankNameCashName && (
                          <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                            {formErrors.BankNameCashName}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Description *" name="Description" form={form} errors={formErrors} onChange={handleChange} multiline rows={2} /></Grid>
                  </Grid>

                  <Divider sx={{ my: 0.5 }} />

                  {/* ── Classification ──────────────────────────────────────────── */}
                  <SectionLabel>Classification</SectionLabel>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.CostDrivers}>
                        <InputLabel>Cost Drivers *</InputLabel>
                        <Select name="CostDrivers" value={form.CostDrivers ?? ""} label="Cost Drivers *" onChange={handleChange}>
                          {CostDriversOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.CostDrivers && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.CostDrivers}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.TopSheet}>
                        <InputLabel>Top Sheet *</InputLabel>
                        <Select name="TopSheet" value={form.TopSheet ?? ""} label="Top Sheet *" onChange={handleChange}>
                          {TopSheetOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.TopSheet && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.TopSheet}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.Parent}>
                        <InputLabel>Parent *</InputLabel>
                        <Select name="Parent" value={form.Parent ?? ""} label="Parent *" onChange={handleChange}>
                          {ParentOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.Parent && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.Parent}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.Function}>
                        <InputLabel>Function *</InputLabel>
                        <Select name="Function" value={form.Function ?? ""} label="Function *" onChange={handleChange}>
                          {FunctionOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.Function && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.Function}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.ConstructionExpenses}>
                        <InputLabel>Construction Expenses</InputLabel>
                        <Select name="ConstructionExpenses" value={form.ConstructionExpenses ?? ""} label="Construction Expenses" onChange={handleChange}>
                          {ConstructionExpensesOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.ConstructionExpenses && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.ConstructionExpenses}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.SalaryAndBenefits}>
                        <InputLabel>Salary & Benefits</InputLabel>
                        <Select name="SalaryAndBenefits" value={form.SalaryAndBenefits ?? ""} label="Salary & Benefits" onChange={handleChange}>
                          {SalaryBenefitsOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.SalaryAndBenefits && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.SalaryAndBenefits}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.DirectorEmployee}>
                        <InputLabel>Director/Employee</InputLabel>
                        <Select name="DirectorEmployee" value={form.DirectorEmployee ?? ""} label="Director/Employee" onChange={handleChange}>
                          {DirectorEmployeeOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.DirectorEmployee && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.DirectorEmployee}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.SalariesBenefits}>
                        <InputLabel>Salaries/Benefits</InputLabel>
                        <Select name="SalariesBenefits" value={form.SalariesBenefits ?? ""} label="Salaries/Benefits" onChange={handleChange}>
                          {SalariesBenefitsOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.SalariesBenefits && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.SalariesBenefits}</Typography>}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.RevenueExpenseBalanceSheet}>
                        <InputLabel>Revenue/Expense/BS *</InputLabel>
                        <Select name="RevenueExpenseBalanceSheet" value={form.RevenueExpenseBalanceSheet ?? ""} label="Revenue/Expense/BS *" onChange={handleChange}>
                          {RevenueExpenseBSOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.RevenueExpenseBalanceSheet && <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.RevenueExpenseBalanceSheet}</Typography>}
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 0.5 }} />

                  {/* ── Party & Location ────────────────────────────────────────── */}
                  <SectionLabel>Party &amp; Location</SectionLabel>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Counter Party *" name="CounterParty" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Site" name="Site" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Employee Name" name="EmployeeName" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Asset/Loan" name="AssetLoan" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><FF label="Project *" name="Project" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.ProjectName}>
                        <InputLabel>Project Name *</InputLabel>
                        <Select name="ProjectName" value={form.ProjectName ?? ""} label="Project Name *" onChange={handleChange}>
                          {ProjectNameOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                        {formErrors.ProjectName && (
                          <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                            {formErrors.ProjectName}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 0.5 }} />

                  {/* ── Deal Info ───────────────────────────────────────────────── */}
                  <SectionLabel>Deal Info</SectionLabel>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}><FF label="Deal Number" name="DealNumber" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid item xs={6} sm={3}><FF label="Plot Number" name="PlotNumber" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid item xs={6} sm={3}><FF label="Deal Value" name="DealValue" type="number" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.Sector}>
                        <InputLabel>Sector</InputLabel>
                        <Select
                          name="Sector"
                          value={form.Sector ?? ""}
                          label="Sector"
                          onChange={handleChange}
                        >
                          {SectorOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.Sector && (
                          <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                            {formErrors.Sector}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 0.5 }} />

                  {/* ── Company & Marketing ─────────────────────────────────────── */}
                  <SectionLabel>Company &amp; Marketing</SectionLabel>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.Company}>
                        <InputLabel>Company</InputLabel>
                        <Select
                          name="Company"
                          value={form.Company ?? ""}
                          label="Company"
                          onChange={handleChange}
                        >
                          {CompanyOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.CareOfCompany}>
                        <InputLabel>Care Of Company *</InputLabel>
                        <Select
                          name="Sector"
                          value={form.CareOfCompany ?? ""}
                          label="Sector"
                          onChange={handleChange}
                        >
                          {CareOfCompanyOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.CareOfCompany && (
                          <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                            {formErrors.CareOfCompany}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FormControl size="small" fullWidth error={!!formErrors.Division}>
                        <InputLabel>Division *</InputLabel>
                        <Select
                          name="Division"
                          value={form.Division ?? ""}
                          label="Division"
                          onChange={handleChange}
                        >
                          {DivisionOptions.map((opt) => (
                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                        {formErrors.Division && (
                          <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                            {formErrors.Division}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3}><FF label="SB Classification" name="SBClassification" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid item xs={6} sm={3}><FF label="Marketing Campaigns" name="MarketingCampaigns" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid item xs={6} sm={3}><FF label="Marketing Naturewise" name="MarketingNaturewise" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControl size="small" fullWidth >
                        <InputLabel>CP</InputLabel>
                        <Select name="CP" value={form.CP ?? ""} label="CP" onChange={handleChange}>
                          <MenuItem value="">— None —</MenuItem>
                          {CPOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} sm={3}><FF label="Paid To" name="PaidTo" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid item xs={6} sm={3}><FF label="Director" name="Director" form={form} errors={formErrors} onChange={handleChange} /></Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Land/Plot Fees</InputLabel>
                        <Select name="LandPlotFees" fullWidth value={form.LandPlotFees ?? ""} label="Land/Plot Fees" onChange={handleChange}>
                          <MenuItem value="">— None —</MenuItem>
                          {LandPlotFeesOptions.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 0.5 }} />

                  {/* ── Financials ──────────────────────────────────────────────── */}
                  <SectionLabel>Financials</SectionLabel>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FF label="Debit" name="Debit" type="number" form={form} errors={formErrors} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <FF label="Credit" name="Credit" type="number" form={form} errors={formErrors} onChange={handleChange} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <TextField
                        label="Amount (auto)"
                        value={(() => {
                          const d = Number(form.Debit) || (editingItem ? Number(editingItem.Debit) : 0) || 0;
                          const c = Number(form.Credit) || (editingItem ? Number(editingItem.Credit) : 0) || 0;
                          return (form.Debit !== "" || form.Credit !== "")
                            ? Math.round(d - c).toLocaleString("en-PK")
                            : editingItem?.Amount != null
                              ? Math.round(Number(editingItem.Amount)).toLocaleString("en-PK")
                              : "—";
                        })()}
                        fullWidth size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ "& .MuiInputBase-input": { color: "text.secondary", fontStyle: "italic" }, bgcolor: (t) => t.palette.action.hover }}
                        helperText="Auto: Debit − Credit"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <TextField
                        label="Balance (auto)"
                        value={editingItem?.Balance != null
                          ? Math.round(Number(editingItem.Balance)).toLocaleString("en-PK")
                          : "Auto-calculated"}
                        fullWidth size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ "& .MuiInputBase-input": { color: "text.secondary", fontStyle: "italic" }, bgcolor: (t) => t.palette.action.hover }}
                        helperText="Auto: running sum of Amount"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      {/* NOT NULL — marked with * */}
                      <DateField label="Instrument Date *" name="InstrumentDate" form={form} errors={formErrors} onChange={handleChange} />
                    </Grid>
                  </Grid>

                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                {/* Error count badge next to save button */}
                {errorCount > 0 && (
                  <Typography variant="caption" color="error" sx={{ mr: "auto" }}>
                    ⚠ {errorCount} field{errorCount > 1 ? "s" : ""} need attention
                  </Typography>
                )}
                <Button onClick={() => { setShowModal(false); resetForm(); }} variant="outlined">Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} /> : null}
                  sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
                  {saving ? "Saving…" : editingItem ? "Update Record" : "Create Record"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* ── Delete Dialog ─────────────────────────────────────────────────── */}
            <Dialog open={deleteDlg} onClose={() => setDeleteDlg(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
              <DialogTitle fontWeight={600}>Delete Record</DialogTitle>
              <DialogContent>
                <Typography>Delete Sr# <strong>{toDelete?.SrNo}</strong>? This cannot be undone.</Typography>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setDeleteDlg(false)} disabled={deleting} color="inherit" variant="outlined">Cancel</Button>
                <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                  startIcon={deleting ? <CircularProgress size={16} /> : null}>
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* ── Import Dialog ─────────────────────────────────────────────────── */}
            <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
              <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Bulk Import — Cash &amp; Bank</Typography>
                  <Typography variant="body2" color="text.secondary">Upload Excel (.xlsx) or CSV (.csv)</Typography>
                </Box>
                <IconButton size="small" onClick={() => setImportDialog(false)}><CloseIcon /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Alert severity="info" sx={{ fontSize: "0.8rem" }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>Required columns:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
                      Date, Type, CashAndBank, BankNameCashName, Description, CostDrivers, TopSheet,
                      Parent, Function, CounterParty, Project, RevenueExpenseBalanceSheet,
                      Company, Division, ProjectName, InstrumentDate
                    </Typography>
                  </Alert>
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth sx={{ py: 2, borderStyle: "dashed" }}>
                    {importFile ? importFile.name : "Click to select Excel or CSV file"}
                    <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0] || null)} />
                  </Button>
                  {importResults && (
                    <Box>
                      <Alert severity={importResults.failed > 0 ? "warning" : "success"}>
                        ✅ {importResults.success} imported &nbsp;|&nbsp; ❌ {importResults.failed} failed
                      </Alert>
                      {importResults.errors?.length > 0 && (
                        <Box sx={{ mt: 1, maxHeight: 150, overflowY: "auto", bgcolor: "background.default", borderRadius: 1, p: 1 }}>
                          {importResults.errors.map((e, i) => (
                            <Typography key={i} variant="caption" color="error" display="block">
                              Row {e.row}: {e.error}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={() => setImportDialog(false)} variant="outlined">Close</Button>
                <Button onClick={handleImport} variant="contained" disabled={!importFile || importing}
                  startIcon={importing ? <CircularProgress size={16} /> : <UploadIcon />}
                  sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
                  {importing ? "Importing…" : "Import"}
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Grid>
        <Grid size={{ xs: 4, md: 3 }}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 }, }}>
            <BankBalances
              banks={["HBL - Main Account", "Meezan Bank", "Cash - Head Office"]}
              onBankClick={(name) => setFilters(p => ({ ...p, BankNameCashName: name }))}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}