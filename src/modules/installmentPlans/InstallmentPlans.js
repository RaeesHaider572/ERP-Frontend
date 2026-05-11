import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  useTheme,
  alpha,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Upload as UploadIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import {
  getInstallmentPlans,
  createInstallmentPlan,
  updateInstallmentPlan,
  deleteInstallmentPlan,
  bulkImportInstallmentPlans,
  getUnitCustomerInfo,
} from "../../services/installmentPlanService";
import InstallmentPlansTable from "./InstallmentPlansTable";
import InstallmentPlanForm from "./InstallmentPlanForm";
import InstallmentPlanStats from "./InstallmentPlanStats";

function InstallmentPlans() {
  const theme = useTheme();
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    unitNo: "",
    customerName: "",
    project: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "PlanID",
    direction: "desc",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    unitId: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state
  const [form, setForm] = useState({
    unit_id: "",
    customer_name: "",
    project: "",
    due_date: "",
    inst_no: "",
    payment_plan: "",
    mapped_receipt: "",
    total_unpaid: "",
    default_surcharge: "",
    lps: "",
  });

  const [unitInfo, setUnitInfo] = useState(null);
const [unitInfoLoading, setUnitInfoLoading] = useState(false);
const handleUnitIdChange = async (unitId) => {
  setForm((prev) => ({ ...prev, unit_id: unitId }));
  setUnitInfo(null);

  if (!unitId?.trim()) return;

  try {
    setUnitInfoLoading(true);
    const response = await getUnitCustomerInfo(unitId.trim());
    const data = response.data?.data;

    if (data) {
      setUnitInfo(data);
      setForm((prev) => ({
        ...prev,
        customer_name: data.customer_name || prev.customer_name,
        project:       data.project       || prev.project,
      }));
    }
  } catch (err) {
    console.error("[handleUnitIdChange]", err.message);
  } finally {
    setUnitInfoLoading(false);
  }
};
  // Fetch installment plans
  const fetchInstallmentPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      // eslint-disable-next-line no-console
      console.log("Fetching installment plans from API...");
      const response = await getInstallmentPlans();
      // eslint-disable-next-line no-console
      console.log("API Response:", response);

      let plansData = [];
      if (Array.isArray(response.data)) {
        plansData = response.data;
      } else if (response.data?.status === "success" && Array.isArray(response.data.data)) {
        plansData = response.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        plansData = response.data.data;
      }

      if (!Array.isArray(plansData)) {
        // eslint-disable-next-line no-console
        console.warn("Unexpected API response structure:", response.data);
        plansData = [];
      }

      // eslint-disable-next-line no-console
      console.log(`Loaded ${plansData.length} installment plans`);
      if (plansData.length > 0) {
        // eslint-disable-next-line no-console
        console.log("Columns in first record:", Object.keys(plansData[0]));
        // eslint-disable-next-line no-console
        console.log("Sample record:", plansData[0]);
      }
      setInstallmentPlans(plansData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching installment plans:", err);
      // eslint-disable-next-line no-console
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const errorMsg = err.response?.data?.message || err.message || "Error fetching installment plans. Please try again.";
      setError(errorMsg);
      showSnackbarMessage(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallmentPlans();
  }, []);

  // Show snackbar
  const showSnackbarMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Form validation
  const validateForm = () => {
    const errors = {};
    // Basic validation - can be extended
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbarMessage("Please fix the form errors", "error");
      return;
    }

    try {
      // Convert form data to API format
      const payload = {
        unit_id: form.unit_id || null,
        customer_name: form.customer_name || null,
        project: form.project || null,
        due_date: form.due_date || null,
        inst_no: form.inst_no ? Number(form.inst_no) : null,
        payment_plan: form.payment_plan ? Number(form.payment_plan) : null,
      mapped_receipt: form.mapped_receipt ? Number(form.mapped_receipt) : null,
      total_unpaid: form.total_unpaid ? Number(form.total_unpaid) : null,
      default_surcharge: form.default_surcharge ? Number(form.default_surcharge) : null,
      lps: form.lps || "0",
    };

      if (editingPlan) {
        await updateInstallmentPlan(editingPlan.PlanID || editingPlan.plan_id || editingPlan.InstallmentId || editingPlan.installment_id, payload);
        showSnackbarMessage("Installment plan updated successfully!", "success");
      } else {
        await createInstallmentPlan(payload);
        showSnackbarMessage("Installment plan created successfully!", "success");
      }
      setShowModal(false);
      resetForm();
      fetchInstallmentPlans();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error saving installment plan";
      setError(errorMsg);
      showSnackbarMessage(errorMsg, "error");
    }
  };

  // Handle edit
  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      unit_id: plan.UnitID || plan.unit_id || "",
      customer_name: plan.CustomerName || plan.customer_name || "",
      project: plan.Project || plan.project || "",
      due_date: plan.DueDate
        ? new Date(plan.DueDate).toISOString().split("T")[0]
        : "",
      inst_no: plan.InstNo || plan.inst_no || "",
      payment_plan: plan.PaymentPlan || plan.payment_plan || "",
      mapped_receipt: plan.MappedReceipt || plan.mapped_receipt || "",
      total_unpaid: plan.TotalUnpaid || plan.total_unpaid || "",
      default_surcharge: plan.DefaultSurcharge || plan.default_surcharge || "",
      lps: plan.LPS || plan.lps || "0",
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.id || deleting) return;

    try {
      setDeleting(true);
      await deleteInstallmentPlan(deleteDialog.id);
      showSnackbarMessage("Installment plan deleted successfully!", "success");
      setDeleteDialog({ open: false, id: null, unitId: null });
      fetchInstallmentPlans();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Error deleting installment plan";
      showSnackbarMessage(`❌ ${errorMsg}`, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Handle export - dynamically export all columns
  const handleExport = () => {
    try {
      if (filteredAndSortedPlans.length === 0) {
        showSnackbarMessage("No data to export", "warning");
        return;
      }

      // Get all column names from the first record
      const firstRecord = filteredAndSortedPlans[0];
      const columnKeys = Object.keys(firstRecord).filter(
        (key) => !key.startsWith("_") && key !== "actions"
      );

      // Create CSV header
      const headers = columnKeys.map((key) =>
        key.replace(/([A-Z])/g, " $1").trim()
      );

      // Create CSV rows
      const rows = filteredAndSortedPlans.map((plan) =>
        columnKeys.map((key) => {
          const value = plan[key];
          if (value === null || value === undefined) return "";
          if (value instanceof Date) {
            return new Date(value).toISOString().split("T")[0];
          }
          return String(value);
        })
      );

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `installment_plans_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSnackbarMessage("Installment plans exported successfully!", "success");
    } catch (err) {
      showSnackbarMessage("Error exporting installment plans", "error");
    }
  };

  /**
   * Handle Excel file import
   * Maps Excel columns to database columns and sends to backend in batches
   */
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxFileSize) {
      showSnackbarMessage(
        `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 20MB`,
        "error"
      );
      event.target.value = "";
      return;
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showSnackbarMessage("Please upload a valid Excel file (.xlsx, .xls) or CSV file", "error");
      event.target.value = "";
      return;
    }

    try {
      setImporting(true);
      setError(null);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON - use raw: false to get formatted cell values (better for text/numbers)
      // This ensures we get the displayed values from Excel, not raw serial numbers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false, // Get formatted values (better for text, numbers, dates as strings)
        defval: "", // Use empty string for empty cells (we'll convert to null later)
        blankrows: false, // Skip completely empty rows
      });

      if (!jsonData || jsonData.length === 0) {
        showSnackbarMessage("Excel file is empty or has no data", "error");
        return;
      }

      // Log first row to debug column names and values
      console.log("=== EXCEL IMPORT DEBUG ===");
      console.log("Total rows:", jsonData.length);
      console.log("Excel column names (from file):", Object.keys(jsonData[0]));
      console.log("First Excel row (formatted):", jsonData[0]);
      console.log("Sample values from first row:", Object.entries(jsonData[0]).slice(0, 10));
      
      // Show all Excel column names with their values from first row
      console.log("All Excel columns with first row values:");
      Object.keys(jsonData[0]).forEach((key) => {
        console.log(`  "${key}": ${JSON.stringify(jsonData[0][key])}`);
      });

      /**
       * Parse date without timezone conversion
       * Excel dates come as serial numbers or date strings in various formats
       */
      const parseDateWithoutTimezone = (value) => {
        if (!value) return null;
        
        // Clean the value
        if (typeof value === "string") {
          value = value.trim();
        }
        
        // If it's already a date string in YYYY-MM-DD format, return as-is
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        
        // If it's an Excel serial date number
        if (typeof value === "number") {
          // Excel epoch is January 1, 1900
          const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899 (Excel's epoch)
          const date = new Date(excelEpoch.getTime() + value * 86400000);
          // Format as YYYY-MM-DD without timezone conversion
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        
        // If it's a date string, parse it carefully
        if (typeof value === "string") {
          // Handle formats like "8-Jun-21", "8-Jun-2021", "08-Jun-21"
          const shortDateMatch = value.match(/(\d{1,2})[-\/]([A-Za-z]{3})[-\/](\d{2,4})/i);
          if (shortDateMatch) {
            const [, day, monthName, year] = shortDateMatch;
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            const monthIndex = monthNames.findIndex(m => monthName.toLowerCase().startsWith(m.toLowerCase()));
            if (monthIndex !== -1) {
              const fullYear = year.length === 2 ? (parseInt(year) < 50 ? `20${year}` : `19${year}`) : year;
              return `${fullYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            }
          }
          
          // Try parsing as YYYY-MM-DD or YYYY/MM/DD
          const dateMatch = value.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
          if (dateMatch) {
            const [, year, month, day] = dateMatch;
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
          
          // Try parsing as DD-MM-YYYY or DD/MM/YYYY
          const dmyMatch = value.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
          if (dmyMatch) {
            const [, day, month, year] = dmyMatch;
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
          
          // Try parsing as Date object but extract date components without timezone
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            // Use local date components to avoid timezone shift
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const day = String(dateObj.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          }
        }
        
        return null;
      };

      // Create comprehensive case-insensitive column mapping
      const createCaseInsensitiveMapping = () => {
        const mapping = {};
        
        // Comprehensive mappings with many variations
        const standardMappings = {
          "UnitID": ["UnitID", "Unit ID", "unit_id", "Unit", "unit", "UnitNo", "Unit No", "unit_no"],
          "Project": ["Project", "project", "ProjectName", "Project Name"],
          "PlanVoucherID": ["PlanVoucherID", "Plan Voucher ID", "plan_voucher_id", "Voucher ID", "VoucherID", "Voucher", "voucher"],
          "UnitType": ["UnitType", "Unit Type", "unit_type", "Type", "type"],
          "CustomerName": ["CustomerName", "Customer Name", "customer_name", "Customer", "customer", "CustomerName", "Name"],
          "DueDate": ["DueDate", "Due Date", "due_date", "Due", "due"],
          "DateName": ["DateName", "Date Name", "date_name", "Date", "date"],
          "InstNo": ["InstNo", "Inst No", "inst_no", "Installment No", "Installment Number", "InstallmentNo", "Installment", "Code", "code"],
          "PaymentType": ["PaymentType", "Payment Type", "payment_type", "Payment Type", "PaymentMethod"],
          "PaymentPlan": ["PaymentPlan", "Payment Plan", "payment_plan", "Plan", "plan", "Amount", "amount"],
          "Discount": ["Discount", "discount", "Disc", "disc"],
          "ActualPaymentPlan": ["ActualPaymentPlan", "Actual Payment Plan", "actual_payment_plan", "Actual Plan", "ActualPlan"],
          "MappedReceipt": ["MappedReceipt", "Mapped Receipt", "mapped_receipt", "Mapped", "mapped"],
          "DueNotDue": ["DueNotDue", "Due Not Due", "due_not_due", "DueStatus", "Due Status"],
          "PPU": ["PPU", "ppu", "Price Per Unit", "PricePerUnit"],
          "Receivables": ["Receivables", "receivables", "Receivable", "receivable"],
          "TotalUnpaid": ["TotalUnpaid", "Total Unpaid", "total_unpaid", "Unpaid", "unpaid", "Total Unpaid Amount"],
          "DefaultSurcharge": ["DefaultSurcharge", "Default Surcharge", "default_surcharge", "Surcharge", "surcharge"],
          "TaxReceived": ["TaxReceived", "Tax Received", "tax_received", "Tax Rec", "TaxRec"],
          "TaxStatus": ["TaxStatus", "Tax Status", "tax_status", "Tax %", "Tax%", "TaxPercent", "Tax Percent"],
          "TaxAccrued": ["TaxAccrued", "Tax Accrued", "tax_accrued", "Accrued Tax"],
          "ApplicableTax_t": ["ApplicableTax_t", "Applicable Tax t", "applicable_tax_t", "ApplicableTax", "Applicable Tax"],
          "ApplicableTaxToday": ["ApplicableTaxToday", "Applicable Tax Today", "applicable_tax_today", "Tax Today"],
          "TaxReceivables": ["TaxReceivables", "Tax Receivables", "tax_receivables", "Tax Receivable"],
          "TaxPPU": ["TaxPPU", "Tax PPU", "tax_ppu", "Tax Price Per Unit"],
          "LPS": ["LPS", "lps", "Lps"],
        };
        
        // Build comprehensive case-insensitive mapping
        Object.keys(standardMappings).forEach((dbColumn) => {
          standardMappings[dbColumn].forEach((excelColumn) => {
            // Exact match
            mapping[excelColumn] = dbColumn;
            // Lowercase
            mapping[excelColumn.toLowerCase()] = dbColumn;
            // Uppercase
            mapping[excelColumn.toUpperCase()] = dbColumn;
            // Title case
            mapping[excelColumn.charAt(0).toUpperCase() + excelColumn.slice(1).toLowerCase()] = dbColumn;
            // Remove spaces and try
            const noSpaces = excelColumn.replace(/\s+/g, "");
            mapping[noSpaces] = dbColumn;
            mapping[noSpaces.toLowerCase()] = dbColumn;
            mapping[noSpaces.toUpperCase()] = dbColumn;
            // Remove underscores and try
            const noUnderscores = excelColumn.replace(/_/g, "");
            mapping[noUnderscores] = dbColumn;
            mapping[noUnderscores.toLowerCase()] = dbColumn;
            mapping[noUnderscores.toUpperCase()] = dbColumn;
          });
        });
        
        return mapping;
      };

      const columnMapping = createCaseInsensitiveMapping();

      // Transform data: map Excel columns to database columns
      const mappedData = jsonData.map((row, rowIndex) => {
        const mappedRow = {};
        const unmappedColumns = [];
        const mappedColumns = [];
        
        Object.keys(row).forEach((excelKey) => {
          const originalValue = row[excelKey];
          
          // Skip if value is undefined (shouldn't happen with defval: "")
          if (originalValue === undefined) {
            return;
          }
          
          // Clean Excel column name (remove leading/trailing spaces)
          const cleanExcelKey = excelKey.trim();
          
          // Try multiple matching strategies using cleaned key
          let dbKey = null;
          
          // Strategy 1: Exact match (case-sensitive) with cleaned key
          if (columnMapping[cleanExcelKey]) {
            dbKey = columnMapping[cleanExcelKey];
          }
          // Strategy 2: Case-insensitive match
          else if (columnMapping[cleanExcelKey.toLowerCase()]) {
            dbKey = columnMapping[cleanExcelKey.toLowerCase()];
          }
          else if (columnMapping[cleanExcelKey.toUpperCase()]) {
            dbKey = columnMapping[cleanExcelKey.toUpperCase()];
          }
          // Strategy 3: Remove all spaces/special chars and try
          else {
            const normalizedKey = cleanExcelKey.replace(/[\s_-]/g, "");
            if (columnMapping[normalizedKey]) {
              dbKey = columnMapping[normalizedKey];
            }
            else if (columnMapping[normalizedKey.toLowerCase()]) {
              dbKey = columnMapping[normalizedKey.toLowerCase()];
            }
            else if (columnMapping[normalizedKey.toUpperCase()]) {
              dbKey = columnMapping[normalizedKey.toUpperCase()];
            }
          }
          
          // Strategy 5: If still no match, check if Excel key matches DB column name exactly
          if (!dbKey) {
            // Exact database column names (excluding PlanID which is auto-generated)
            const dbColumnNames = [
              "UnitID", "Project", "PlanVoucherID", "UnitType", "CustomerName", 
              "DueDate", "DateName", "InstNo", "PaymentType", "PaymentPlan", 
              "Discount", "ActualPaymentPlan", "MappedReceipt", "DueNotDue", 
              "PPU", "Receivables", "TotalUnpaid", "DefaultSurcharge", "LPS",
              "TaxReceived", "TaxStatus", "TaxAccrued", "ApplicableTax_t", 
              "ApplicableTaxToday", "TaxReceivables", "TaxPPU"
            ];
            
            // Check if Excel key matches any DB column (case-insensitive, with variations)
            const matchedDbColumn = dbColumnNames.find((dbCol) => {
              const excelLower = cleanExcelKey.toLowerCase();
              const dbLower = dbCol.toLowerCase();
              
              // Exact match (case-insensitive)
              if (excelLower === dbLower) return true;
              
              // Match with spaces (e.g., "Unit ID" matches "UnitID")
              const dbWithSpaces = dbCol.replace(/([A-Z])/g, " $1").trim().toLowerCase();
              if (excelLower === dbWithSpaces) return true;
              
              // Match without spaces (e.g., "UnitID" matches "Unit ID")
              const excelNoSpaces = cleanExcelKey.replace(/\s+/g, "").toLowerCase();
              if (excelNoSpaces === dbLower) return true;
              
              // Match with underscores (e.g., "unit_id" matches "UnitID")
              const excelNoUnderscores = cleanExcelKey.replace(/_/g, "").toLowerCase();
              if (excelNoUnderscores === dbLower) return true;
              
              return false;
            });
            
            if (matchedDbColumn) {
              dbKey = matchedDbColumn;
            } else {
              // Use cleaned Excel key as-is if it looks like a valid DB column name
              if (/^[A-Za-z][A-Za-z0-9_\s]*$/.test(cleanExcelKey)) {
                // Check if it's close to a DB column name
                const closeMatch = dbColumnNames.find(dbCol => 
                  cleanExcelKey.toLowerCase().includes(dbCol.toLowerCase()) || 
                  dbCol.toLowerCase().includes(cleanExcelKey.toLowerCase())
                );
                if (closeMatch) {
                  dbKey = closeMatch;
                } else {
                  // Use cleaned key (remove spaces for DB column name)
                  dbKey = cleanExcelKey.replace(/\s+/g, "");
                }
              } else {
                unmappedColumns.push({ excelKey: cleanExcelKey, value: originalValue });
                return; // Skip this column
              }
            }
          }
          
          let value = originalValue;
          
          // Clean up value: trim whitespace, handle empty strings
          if (typeof value === "string") {
            value = value.trim();
            // Convert empty string or dash-only strings to null
            if (value === "" || value === "-" || value === " -   " || /^[\s\-]+$/.test(value)) {
              value = null;
            }
          } else if (value === null || value === undefined) {
            value = null;
          }

          // Handle date fields - use timezone-safe parsing
          if (dbKey === "DueDate" && value !== null && value !== undefined && value !== "") {
            value = parseDateWithoutTimezone(value);
          }

          // Text fields that should preserve their string values (even if they look numeric)
          // IMPORTANT: Check text fields FIRST to prevent numeric conversion
          const textFields = [
            "PPU",           // Contains: "Paid", "Partial Payment", "Unpaid", "Payment", "Discrepancy"
            "TaxPPU",        // Contains: "Paid", "Payment", "Unpaid", "Discrepancy"
            "DueNotDue",     // Contains: "Due", "Not Due"
            "PaymentType",   // Contains: "DP", "Installment", "Final Payment"
            "UnitType",      // Contains: "BH-Shop / Office"
            "UnitID",        // Contains: "1F-01", etc.
            "Project",       // Contains: "BHU", etc.
            "PlanVoucherID", // Contains: "1F-01Inst0", etc.
            "CustomerName",  // Contains: "Zain Ul Abidin", etc.
            "DateName",      // Contains: "Zain Ul Abidin44355", etc.
            "TaxStatus",     // Contains: "1%", "2%", "3%" - keep as string with %
            "LPS",           // VARCHAR(100) field: treat as string, default to "0" if empty
          ];
          
          // Handle numeric fields - preserve 0 values, convert valid numbers
          // NOTE: PPU and TaxPPU are TEXT fields (contain "Paid", "Unpaid", etc.), NOT numeric
          const numericFields = [
            "InstNo",
            "PaymentPlan",
            "Discount",
            "ActualPaymentPlan",
            "MappedReceipt",
            "Receivables",
            "TotalUnpaid",
            "DefaultSurcharge",
            "TaxReceived",
            "TaxAccrued",
            "ApplicableTax_t",
            "ApplicableTaxToday",
            "TaxReceivables",
          ];
          
          // Check text fields FIRST to prevent any numeric conversion
          if (textFields.includes(dbKey)) {
            // For text fields, preserve the string value (trimmed)
            if (typeof value === "string") {
              value = value.trim();
              // Convert dash-only or empty to null (except for LPS which defaults to "0")
              if (dbKey === "LPS" && (value === "" || value === "-" || /^[\s\-]+$/.test(value))) {
                value = "0"; // LPS defaults to "0" if empty
              } else if (value === "-" || value === "" || /^[\s\-]+$/.test(value)) {
                value = null;
              }
              // Keep the value as-is (including "Paid", "1%", etc.)
            } else if (value === null || value === undefined) {
              // LPS defaults to "0" if null/undefined
              value = dbKey === "LPS" ? "0" : null;
            } else {
              // Convert non-string to string for text fields (preserve the value)
              value = String(value).trim();
              if (dbKey === "LPS" && (value === "" || value === "-" || value === "NaN" || value === "undefined")) {
                value = "0"; // LPS defaults to "0" if empty
              } else if (value === "" || value === "-" || value === "NaN" || value === "undefined") {
                value = null;
              }
            }
          } else if (numericFields.includes(dbKey)) {
            // Convert to number if value exists and is not empty
            if (value !== null && value !== undefined && value !== "") {
              if (typeof value === "string") {
                // Remove commas, spaces, and other formatting
                let cleanedValue = value.replace(/[,,\s]/g, "");
                
                // Handle percentage strings like "1%", "3%"
                if (cleanedValue.endsWith("%")) {
                  cleanedValue = cleanedValue.replace("%", "");
                }
                
                // Handle dash or text that can't be converted
                if (cleanedValue === "-" || cleanedValue === "" || /^[\s\-]+$/.test(cleanedValue)) {
                  value = null;
                } else {
                  const numValue = Number(cleanedValue);
                  value = isNaN(numValue) ? null : numValue;
                }
              } else if (typeof value === "number") {
                value = isNaN(value) ? null : value;
              } else {
                value = null;
              }
            } else {
              value = null; // Empty cells become null
            }
          } else {
            // For other fields (default), clean up string values
            if (typeof value === "string") {
              value = value.trim();
              // Convert dash-only or empty to null
              if (value === "-" || value === "" || /^[\s\-]+$/.test(value)) {
                value = null;
              }
            }
          }
          
          // Prevent NaN from being added (convert to null)
          if (value !== null && value !== undefined && (typeof value === "number" && isNaN(value))) {
            console.warn(`Warning: NaN detected for ${dbKey}, converting to null. Original value:`, originalValue);
            value = null;
          }

          // Always add the value to mapped row (including null)
          mappedRow[dbKey] = value;
          mappedColumns.push({ excelKey, dbKey, value });
        });
        
        // Log mapping details for first row only
        if (rowIndex === 0) {
          console.log("\n=== COLUMN MAPPING RESULTS ===");
          console.log("Total Excel columns:", Object.keys(row).length);
          console.log("Successfully mapped columns:", mappedColumns.length);
          console.log("Mapped columns detail:", mappedColumns);
          if (unmappedColumns.length > 0) {
            console.warn("⚠️ Unmapped Excel columns (these will be skipped):", unmappedColumns);
            console.warn("💡 Tip: Add these to the column mapping if they contain important data");
          }
          console.log("Mapped row keys:", Object.keys(mappedRow));
          console.log("Mapped row values (first row):", mappedRow);
        }
        
        return mappedRow;
      });

      // Log first mapped row for debugging
      if (mappedData.length > 0) {
        console.log("\n=== FINAL MAPPED DATA (First Row) ===");
        console.log("Keys in mapped row:", Object.keys(mappedData[0]));
        console.log("Total keys:", Object.keys(mappedData[0]).length);
        const nonNullValues = Object.entries(mappedData[0]).filter(([k, v]) => v !== null && v !== "");
        console.log("Non-null values count:", nonNullValues.length);
        console.log("Non-null values:", nonNullValues);
        const nullValues = Object.entries(mappedData[0]).filter(([k, v]) => v === null || v === "");
        if (nullValues.length > 0) {
          console.log("Null/empty values:", nullValues.map(([k]) => k));
        }
        console.log("Full first mapped row:", mappedData[0]);
        console.log("=== END EXCEL IMPORT DEBUG ===\n");
      }

      // Process in batches to avoid payload size issues
      const BATCH_SIZE = 500; // Process 500 rows at a time
      const totalRows = mappedData.length;
      let totalSuccessCount = 0;
      let totalErrorCount = 0;
      const allErrors = [];

      showSnackbarMessage(`Processing ${totalRows} rows in batches of ${BATCH_SIZE}...`, "info");

      // Process batches sequentially
      for (let i = 0; i < mappedData.length; i += BATCH_SIZE) {
        const batch = mappedData.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalRows / BATCH_SIZE);

        try {
          showSnackbarMessage(
            `Importing batch ${batchNumber}/${totalBatches} (rows ${i + 1}-${Math.min(i + BATCH_SIZE, totalRows)})...`,
            "info"
          );

          const response = await bulkImportInstallmentPlans(batch);
          
          const batchSuccessCount = response.data?.successCount || 0;
          const batchErrorCount = response.data?.errorCount || 0;
          
          totalSuccessCount += batchSuccessCount;
          totalErrorCount += batchErrorCount;

          if (response.data?.errors && response.data.errors.length > 0) {
            allErrors.push(...response.data.errors);
          }
        } catch (batchError) {
          console.error(`Error importing batch ${batchNumber}:`, batchError);
          totalErrorCount += batch.length;
          allErrors.push({
            batch: batchNumber,
            error: batchError.response?.data?.message || batchError.message || "Unknown error",
          });
        }
      }

      // Show final results
      if (totalErrorCount > 0) {
        showSnackbarMessage(
          `Import completed: ${totalSuccessCount} imported, ${totalErrorCount} failed. ${allErrors.length > 0 ? "Check console for details." : ""}`,
          "warning"
        );
        if (allErrors.length > 0) {
          console.error("Import errors:", allErrors);
        }
      } else {
        showSnackbarMessage(`Successfully imported ${totalSuccessCount} installment plan(s)!`, "success");
      }

      // Refresh the list
      await fetchInstallmentPlans();

      // Reset file input
      event.target.value = "";
    } catch (err) {
      console.error("Error importing Excel file:", err);
      const errorMsg = err.response?.data?.message || err.message || "Error importing Excel file";
      showSnackbarMessage(`❌ ${errorMsg}`, "error");
    } finally {
      setImporting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      unit_id: "",
      customer_name: "",
      project: "",
      due_date: "",
      inst_no: "",
      payment_plan: "",
      mapped_receipt: "",
      total_unpaid: "",
      default_surcharge: "",
      lps: "",
    });
    setEditingPlan(null);
    setFormErrors({});
    setUnitInfo(null);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  // Filter and sort plans
  const filteredAndSortedPlans = Array.isArray(installmentPlans)
    ? installmentPlans
        .filter((plan) => {
          if (!plan || typeof plan !== "object") return false;

          // Search filter
          const matchesSearch = searchTerm
            ? Object.values(plan).some((value) => {
                if (value == null) return false;
                return value
                  .toString()
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
              })
            : true;

          // Unit No filter (using UnitID field)
          const matchesUnitNo =
            !filters.unitNo ||
            (plan.UnitID || plan.unit_id || plan.UnitNo || plan.unit_no || "")
              .toString()
              .toLowerCase()
              .includes(filters.unitNo.toLowerCase());

          // Customer Name filter
          const matchesCustomerName =
            !filters.customerName ||
            (plan.CustomerName || plan.customer_name || "")
              .toString()
              .toLowerCase()
              .includes(filters.customerName.toLowerCase());

          // Project filter
          const matchesProject =
            !filters.project ||
            (plan.Project || plan.project || "")
              .toString()
              .toLowerCase()
              .includes(filters.project.toLowerCase());

          return (
            matchesSearch &&
            matchesUnitNo &&
            matchesCustomerName &&
            matchesProject
          );
        })
        .sort((a, b) => {
          if (!sortConfig.key) return 0;

          const aValue =
            a[sortConfig.key] || a[sortConfig.key.toLowerCase()];
          const bValue =
            b[sortConfig.key] || b[sortConfig.key.toLowerCase()];

          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return 1;
          if (bValue == null) return -1;

          if (aValue < bValue)
            return sortConfig.direction === "asc" ? -1 : 1;
          if (aValue > bValue)
            return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        })
    : [];

  // Get unique values for filters
  const uniqueUnitNos = Array.isArray(installmentPlans)
    ? [
        ...new Set(
          installmentPlans
            .map((p) => p.UnitID || p.unit_id || p.UnitNo || p.unit_no)
            .filter(Boolean)
            .sort()
        ),
      ]
    : [];

  const uniqueCustomerNames = Array.isArray(installmentPlans)
    ? [
        ...new Set(
          installmentPlans
            .map((p) => p.CustomerName || p.customer_name)
            .filter(Boolean)
            .sort()
        ),
      ]
    : [];

  const uniqueProjects = Array.isArray(installmentPlans)
    ? [
        ...new Set(
          installmentPlans
            .map((p) => p.Project || p.project)
            .filter(Boolean)
            .sort()
        ),
      ]
    : [];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, sm: 3, md: 0 }, px: { xs: 2, sm: 3, md: 0 } }}
    >
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Statistics Cards */}
      {/*<Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <InstallmentPlanStats installmentPlans={installmentPlans} />
      </Box>*/}

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
              Installment Plan Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and organize your installment plans
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: { md: "flex-end" },
              flexWrap: "wrap",
            }}
          >
            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchInstallmentPlans}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export CSV">
              <IconButton
                onClick={handleExport}
                disabled={filteredAndSortedPlans.length === 0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  },
                }}
              >
                <ExportIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import Excel">
              <IconButton
                component="label"
                disabled={importing}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                  },
                }}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  style={{ display: "none" }}
                  disabled={importing}
                />
                {importing ? <CircularProgress size={20} /> : <UploadIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
                },
              }}
            >
              Create Plan
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Search and Filters Section */}
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search installment plans by plan ID, unit, customer, project..."
              value={searchTerm}
              onChange={handleSearch}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Unit No</InputLabel>
                <Select
                  value={filters.unitNo}
                  label="Unit No"
                  onChange={(e) => handleFilterChange("unitNo", e.target.value)}
                >
                  <MenuItem value="">All Units</MenuItem>
                  {uniqueUnitNos.map((unitNo) => (
                    <MenuItem key={unitNo} value={unitNo}>
                      {unitNo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={filters.customerName}
                  label="Customer"
                  onChange={(e) =>
                    handleFilterChange("customerName", e.target.value)
                  }
                >
                  <MenuItem value="">All Customers</MenuItem>
                  {uniqueCustomerNames.map((customerName) => (
                    <MenuItem key={customerName} value={customerName}>
                      {customerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.project}
                  label="Project"
                  onChange={(e) => handleFilterChange("project", e.target.value)}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {uniqueProjects.map((project) => (
                    <MenuItem key={project} value={project}>
                      {project}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() =>
                  setFilters({ unitNo: "", customerName: "", project: "" })
                }
                size="small"
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Installment Plans Table */}
      <InstallmentPlansTable
        installmentPlans={filteredAndSortedPlans}
        onEdit={handleEdit}
        onDelete={(id, unitId) => {
          setDeleteDialog({ open: true, id, unitId });
        }}
        onView={(plan) => {
          // View functionality can be added later if needed
          handleEdit(plan);
        }}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      {/* Add/Edit Modal */}
      <Dialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingPlan ? "Edit Installment Plan" : "Add New Installment Plan"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editingPlan
              ? "Update installment plan information"
              : "Fill in installment plan details"}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <InstallmentPlanForm
            form={form}
            handleChange={handleChange}
            errors={formErrors}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            {editingPlan ? "Update Plan" : "Create Plan"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, id: null, unitId: null })
        }
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Installment Plan</DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete installment plan for unit{" "}
            <strong>{deleteDialog.unitId || "this plan"}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, id: null, unitId: null })
            }
            color="inherit"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
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

export default InstallmentPlans;

