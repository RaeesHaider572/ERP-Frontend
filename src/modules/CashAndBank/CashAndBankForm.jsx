import React, { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, Grid, IconButton, InputLabel, MenuItem,
  Select, TextField, Typography, Alert, CircularProgress,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DatePicker }     from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs }  from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { createCashAndBank, updateCashAndBank } from "../../services/cashAndBankService";

// ── Empty form factory ────────────────────────────────────────────────────
export const makeEmptyForm = () => ({
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

// ── Client-side validation ────────────────────────────────────────────────
export const validateForm = (form) => {
  const errors = {};
  const req = (field, label) => {
    if (!form[field] || String(form[field]).trim() === "")
      errors[field] = `${label} is required.`;
  };

  req("Date",                       "Date & Time");
  req("Type",                       "Type");
  req("CashAndBank",                "Cash & Bank");
  req("BankNameCashName",           "Bank / Cash Name");
  req("Description",                "Description");
  req("CostDrivers",                "Cost Drivers");
  req("TopSheet",                   "Top Sheet");
  req("Parent",                     "Parent");
  req("Function",                   "Function");
  req("CounterParty",               "Counter Party");
  req("Project",                    "Project");
  req("RevenueExpenseBalanceSheet", "Revenue / Expense / Balance Sheet");
  req("Company",                    "Company");
  req("Division",                   "Division");
  req("ProjectName",                "Project Name");
  req("InstrumentDate",             "Instrument Date");

  const debit  = Number(form.Debit)  || 0;
  const credit = Number(form.Credit) || 0;
  if (debit > 0 && credit > 0) {
    errors.Debit  = "Cannot have both Debit and Credit.";
    errors.Credit = "Cannot have both Debit and Credit.";
  }

  if (form.InstrumentDate && form.Date) {
    if (new Date(form.InstrumentDate) > new Date(form.Date))
      errors.InstrumentDate = "Instrument Date cannot be after transaction Date.";
  }

  return errors;
};

// ── Sub-components ────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.2, mt: 1 }}>
      {children}
    </Typography>
  );
}

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

function DateTimeField({ label, name, form, errors, onChange }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        label={label}
        value={form[name] ? dayjs(form[name]) : null}
        onChange={(v) =>
          onChange({ target: { name, value: v?.isValid() ? v.toISOString() : "" } })
        }
        slotProps={{
          textField: { size: "small", fullWidth: true, error: !!errors?.[name], helperText: errors?.[name] },
        }}
      />
    </LocalizationProvider>
  );
}

function DateField({ label, name, form, errors, onChange }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={form[name] ? dayjs(form[name]) : null}
        onChange={(v) =>
          onChange({ target: { name, value: v?.isValid() ? v.format("YYYY-MM-DD") : "" } })
        }
        slotProps={{
          textField: { size: "small", fullWidth: true, error: !!errors?.[name], helperText: errors?.[name] },
        }}
      />
    </LocalizationProvider>
  );
}

// ── Dropdown option lists (populate from your data / API as needed) ───────
const TYPES              = ["BPV", "BRV", "CPV", "CRV", "JV", "BTV"];
const BankCashNameOpts   = [];
const CostDriversOpts    = [];
const TopSheetOpts       = [];
const ParentOpts         = [];
const FunctionOpts       = [];
const ConstructionExpOpts= [];
const SalaryBenOpts      = [];
const DirEmpOpts         = [];
const SalariesBenOpts    = [];
const RevenueExpBSOpts   = [];
const ProjectNameOpts    = [];
const SectorOpts         = [];
const CompanyOpts        = [];
const CareOfCompanyOpts  = [];
const DivisionOpts       = [];
const CPOpts             = [];
const LandPlotFeesOpts   = [];

// ══════════════════════════════════════════════════════════════════════════════
export default function CashAndBankForm({ open, onClose, onSaved, editingItem }) {
  const [form,       setForm]       = useState(makeEmptyForm());
  const [formErrors, setFormErrors] = useState({});
  const [saving,     setSaving]     = useState(false);
  const [submitMsg,  setSubmitMsg]  = useState(null); // { text, severity }

  // ── Populate form when editing ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      const f = {};
      Object.keys(makeEmptyForm()).forEach((k) => {
        if (k === "Date")
          f[k] = editingItem[k] ? new Date(editingItem[k]).toISOString() : new Date().toISOString();
        else if (k === "InstrumentDate")
          f[k] = editingItem[k] ? String(editingItem[k]).split("T")[0] : "";
        else
          f[k] = editingItem[k] ?? "";
      });
      setForm(f);
    } else {
      setForm(makeEmptyForm());
    }
    setFormErrors({});
    setSubmitMsg(null);
  }, [open, editingItem]);

  // ── Field change handler ────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name])
      setFormErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitMsg({ text: `${Object.keys(errors).length} required field(s) need attention.`, severity: "error" });
      return;
    }

    setSaving(true);
    setSubmitMsg(null);
    try {
      const payload = { ...form };
      if (!editingItem) delete payload.VNo;

      ["Debit", "Credit", "DealValue"].forEach((k) => {
        payload[k] = form[k] !== "" && form[k] != null ? Math.round(Number(form[k])) : null;
      });
      delete payload.Amount;
      delete payload.Balance;

      payload.Date           = new Date(form.Date).toISOString();
      payload.InstrumentDate = form.InstrumentDate ? form.InstrumentDate.split("T")[0] : null;

      if (editingItem)
        await updateCashAndBank(editingItem.SrNo, payload);
      else
        await createCashAndBank(payload);

      onSaved(editingItem ? "Record updated successfully!" : "Record created successfully!");
      onClose();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      const msg = Array.isArray(serverErrors) && serverErrors.length
        ? serverErrors.join(" | ")
        : err.response?.data?.message || "Error saving record.";
      setSubmitMsg({ text: msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.keys(formErrors).length;

  // ── Computed amount ─────────────────────────────────────────────────────
  const computedAmount = (() => {
    const d = Number(form.Debit)  || 0;
    const c = Number(form.Credit) || 0;
    if (form.Debit !== "" || form.Credit !== "")
      return Math.round(d - c).toLocaleString("en-PK");
    if (editingItem?.Amount != null)
      return Math.round(Number(editingItem.Amount)).toLocaleString("en-PK");
    return "—";
  })();

  // ── Helper: simple select field ─────────────────────────────────────────
  const SelectField = ({ label, name, opts, required }) => (
    <FormControl size="small" fullWidth error={!!formErrors[name]}>
      <InputLabel>{label}{required ? " *" : ""}</InputLabel>
      <Select name={name} value={form[name] ?? ""} label={`${label}${required ? " *" : ""}`} onChange={handleChange}>
        {!required && <MenuItem value="">— None —</MenuItem>}
        {opts.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </Select>
      {formErrors[name] && (
        <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors[name]}</Typography>
      )}
    </FormControl>
  );

  // ────────────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* ── Dialog Title ── */}
      <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            {editingItem ? "Edit Record" : "Add New Record"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editingItem ? `Editing Sr# ${editingItem.SrNo}` : "Fill in the cash & bank details"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      {/* ── Dialog Content ── */}
      <DialogContent sx={{ pt: 3 }}>

        {/* Validation / server error banner */}
        {submitMsg && (
          <Alert severity={submitMsg.severity} sx={{ mb: 2 }} onClose={() => setSubmitMsg(null)}>
            {submitMsg.text}
          </Alert>
        )}
        {errorCount > 0 && !submitMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>{errorCount} required field{errorCount > 1 ? "s are" : " is"} missing.</strong>{" "}
            Fields marked with * below must be filled in.
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

          {/* ── Basic Info ─────────────────────────────────────────────── */}
          <SectionLabel>Basic Info</SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <DateTimeField label="Date & Time *" name="Date" form={form} errors={formErrors} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FormControl size="small" fullWidth error={!!formErrors.Type}>
                <InputLabel>Type *</InputLabel>
                <Select name="Type" value={form.Type ?? ""} label="Type *" onChange={handleChange}>
                  {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
                {formErrors.Type && (
                  <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>{formErrors.Type}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                label="V #"
                value={editingItem ? (form.VNo || editingItem.VNo || "") : "Auto-generated"}
                fullWidth size="small"
                InputProps={{ readOnly: true }}
                sx={{
                  "& .MuiInputBase-input": { color: "text.secondary", fontStyle: editingItem ? "normal" : "italic" },
                  bgcolor: (t) => t.palette.action.hover,
                }}
                helperText={editingItem ? "Voucher number (locked)" : `e.g. ${form.Type || "BPV"}-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-0001`}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FF label="Cheque #" name="ChequeNo" form={form} errors={formErrors} onChange={handleChange} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* ── Bank / Cash Info ──────────────────────────────────────── */}
          <SectionLabel>Bank / Cash Info</SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <FF label="Bank Reconciliation" name="BankReconciliation" form={form} errors={formErrors} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FF label="Cash And Bank *" name="CashAndBank" form={form} errors={formErrors} onChange={handleChange} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <SelectField label="Bank/Cash Name" name="BankNameCashName" opts={BankCashNameOpts} required />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <FF label="Description *" name="Description" form={form} errors={formErrors} onChange={handleChange} multiline rows={2} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* ── Classification ───────────────────────────────────────── */}
          <SectionLabel>Classification</SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Cost Drivers"               name="CostDrivers"                opts={CostDriversOpts}   required /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Top Sheet"                  name="TopSheet"                   opts={TopSheetOpts}       required /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Parent"                     name="Parent"                     opts={ParentOpts}         required /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Function"                   name="Function"                   opts={FunctionOpts}       required /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Construction Expenses"      name="ConstructionExpenses"       opts={ConstructionExpOpts}         /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Salary & Benefits"          name="SalaryAndBenefits"          opts={SalaryBenOpts}               /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Director/Employee"          name="DirectorEmployee"           opts={DirEmpOpts}                  /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Salaries/Benefits"          name="SalariesBenefits"           opts={SalariesBenOpts}             /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Revenue/Expense/BS"         name="RevenueExpenseBalanceSheet" opts={RevenueExpBSOpts}   required /></Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* ── Party & Location ─────────────────────────────────────── */}
          <SectionLabel>Party &amp; Location</SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Counter Party *"  name="CounterParty"  form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Site"             name="Site"          form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Employee Name"    name="EmployeeName"  form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Asset/Loan"       name="AssetLoan"     form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Project *"        name="Project"       form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Project Name" name="ProjectName" opts={ProjectNameOpts} required /></Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* ── Deal Info ────────────────────────────────────────────── */}
          <SectionLabel>Deal Info</SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Deal Number" name="DealNumber" form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Plot Number" name="PlotNumber" form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Deal Value"  name="DealValue"  type="number" form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Sector" name="Sector" opts={SectorOpts} /></Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* ── Company & Marketing ──────────────────────────────────── */}
          <SectionLabel>Company &amp; Marketing</SectionLabel>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Company"          name="Company"        opts={CompanyOpts}       required /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Care Of Company"  name="CareOfCompany"  opts={CareOfCompanyOpts}         /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Division"         name="Division"       opts={DivisionOpts}      required /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="SB Classification"   name="SBClassification"  form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Marketing Campaigns" name="MarketingCampaigns" form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Marketing Naturewise"name="MarketingNaturewise"form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="CP"           name="CP"           opts={CPOpts}           /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Paid To"    name="PaidTo"    form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><FF label="Director"   name="Director"  form={form} errors={formErrors} onChange={handleChange} /></Grid>
            <Grid size={{ xs: 6, md: 3 }}><SelectField label="Land/Plot Fees" name="LandPlotFees" opts={LandPlotFeesOpts} /></Grid>
          </Grid>

          <Divider sx={{ my: 0.5 }} />

          {/* ── Financials ───────────────────────────────────────────── */}
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
                value={computedAmount}
                fullWidth size="small"
                InputProps={{ readOnly: true }}
                sx={{ "& .MuiInputBase-input": { color: "text.secondary", fontStyle: "italic" }, bgcolor: (t) => t.palette.action.hover }}
                helperText="Auto: Debit − Credit"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                label="Balance (auto)"
                value={editingItem?.Balance != null ? Math.round(Number(editingItem.Balance)).toLocaleString("en-PK") : "Auto-calculated"}
                fullWidth size="small"
                InputProps={{ readOnly: true }}
                sx={{ "& .MuiInputBase-input": { color: "text.secondary", fontStyle: "italic" }, bgcolor: (t) => t.palette.action.hover }}
                helperText="Auto: running sum of Amount"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <DateField label="Instrument Date *" name="InstrumentDate" form={form} errors={formErrors} onChange={handleChange} />
            </Grid>
          </Grid>

        </Box>
      </DialogContent>

      {/* ── Dialog Actions ── */}
      <DialogActions sx={{ p: 3, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
        {errorCount > 0 && (
          <Typography variant="caption" color="error" sx={{ mr: "auto" }}>
            ⚠ {errorCount} field{errorCount > 1 ? "s" : ""} need attention
          </Typography>
        )}
        <Button onClick={onClose} variant="outlined" disabled={saving}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
          sx={{ background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)` }}
        >
          {saving ? "Saving…" : editingItem ? "Update Record" : "Create Record"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}