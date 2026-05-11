import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  useTheme,
  alpha,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
  Upload as UploadIcon,
  Receipt as ReceiptIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import {
  getReceipts,
  deleteReceipt,
  bulkImportReceipts,
} from "../../services/receiptService";
import ReceiptsTable from "./ReceiptsTable";
import ReceiptStats from "./ReceiptStats";
import ReceiptDetailView from "./ReceiptDetailView";

function Receipts() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    unitNo: "",
    customerName: "",
    project: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "MappingID",
    direction: "desc",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    receiptId: null,
    receiptNo: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Import error dialog state
  const [importErrorDialog, setImportErrorDialog] = useState({
    open: false,
    errors: [],
    totalErrors: 0,
    totalRows: 0,
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /**
   * Group flat ReceiptFlat data by ReceiptID
   * Each receipt can have multiple rows (line items), this groups them together
   */
  const groupReceiptsByReceiptID = (flatData) => {
    if (!Array.isArray(flatData) || flatData.length === 0) {
      return [];
    }

    // Group by ReceiptID
    const grouped = {};
    
    flatData.forEach((row) => {
      const receiptId = row.ReceiptID || row.receipt_id;
      if (!receiptId) return;

      if (!grouped[receiptId]) {
        // First row for this ReceiptID - create receipt header
        grouped[receiptId] = {
          ReceiptID: receiptId,
          EntryID: row.EntryID || row.entry_id,
          MappingID: row.MappingID || row.mapping_id,
          Project: row.Project || row.project,
          VoucherNo: row.VoucherNo || row.voucher_no,
          ReceiptDate: row.ReceiptDate || row.receipt_date,
          EntryDate: row.EntryDate || row.entry_date,
          UnitNo: row.UnitNo || row.unit_no,
          CustomerName: row.CustomerName || row.customer_name,
          CNIC: row.CNIC || row.cnic,
          Narration: row.Narration || row.narration,
          CollectionBy: row.CollectionBy || row.collection_by,
          Source: row.Source || row.source,
          ReceiptMode: row.ReceiptMode || row.receipt_mode,
          Remarks: row.Remarks || row.remarks,
          CreatedAt: row.CreatedAt || row.created_at,
          // Initialize totals
          TotalAmount: 0,
          TotalSurcharge: 0,
          TotalLines: 0,
          lines: [],
        };
      }

      // Add line item data
      const amount = Number(row.Amount || row.amount || 0);
      const surcharge = Number(row.DefaultSurcharge || row.default_surcharge || 0);
      
      grouped[receiptId].TotalAmount += amount + surcharge;
      grouped[receiptId].TotalSurcharge += surcharge;
      grouped[receiptId].TotalLines += 1;
      
      grouped[receiptId].lines.push({
        MappingID: row.MappingID || row.mapping_id,
        Code: row.Code || row.code,
        ReceiptType: row.ReceiptType || row.receipt_type,
        Knocking: row.Knocking || row.knocking,
        Amount: amount,
        DefaultSurcharge: surcharge,
      });
    });

    // Convert to array and add LineCount for compatibility
    return Object.values(grouped).map((receipt) => ({
      ...receipt,
      LineCount: receipt.TotalLines,
    }));
  };

  // Fetch receipts
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReceipts();
      
      let receiptsData = [];
      if (Array.isArray(response.data)) {
        receiptsData = response.data;
      } else if (response.data?.status === "success" && Array.isArray(response.data.data)) {
        receiptsData = response.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        receiptsData = response.data.data;
      }
      
      if (!Array.isArray(receiptsData)) {
        receiptsData = [];
      }
      
      // Use flat data directly - show all rows with all columns
      setReceipts(receiptsData);
    } catch (err) {
      setError("Error fetching receipts. Please try again.");
      showSnackbarMessage("Error fetching receipts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Show snackbar
  const showSnackbarMessage = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
  };

  // Handle sort - default to descending order for new columns
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "desc"
          ? "asc"
          : "desc", // Default to descending for new columns
    });
  };

  // Handle view
  const handleView = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailView(true);
  };

  // Handle edit
  const handleEdit = (receipt) => {
    // Prefer MappingID for editing, since backend getById expects MappingID
    // Fallback to ReceiptID only if MappingID is not available
    const mappingId = receipt.MappingID || receipt.mapping_id;
    const receiptId = receipt.ReceiptID || receipt.receipt_id || receipt.id;
    const idForEdit = mappingId ?? receiptId;

    // Debug log to verify MappingID used for edit matches database
    // eslint-disable-next-line no-console
    console.log("Edit receipt clicked. MappingID:", mappingId, "ReceiptID:", receiptId, "Using idForEdit:", idForEdit);

    if (!idForEdit) {
      // If for some reason we still don't have an id, show an error and do nothing
      setError("Cannot edit this receipt because it has no valid identifier (MappingID/ReceiptID).");
      showSnackbarMessage("Cannot edit this receipt: missing identifier.", "error");
      return;
    }

    navigate(`/receipts/edit/${idForEdit}`);
  };


// Handle delete
const handleDelete = async () => {
  if (!deleteDialog.receiptId || deleting) return;

  try {
    setDeleting(true);
    
    // The deleteDialog.receiptId is the MappingID from the clicked row
    const mappingIdToDelete = deleteDialog.receiptId;
    
    // First, get the receipt ID from the mapping ID to know which receipt we're deleting
    const receiptToDelete = receipts.find(receipt => 
      (receipt.MappingID || receipt.mapping_id) == mappingIdToDelete
    );
    
    if (!receiptToDelete) {
      throw new Error("Receipt not found");
    }
    
    // Get the ReceiptID from the found receipt
    const receiptIdToDelete = receiptToDelete.ReceiptID || receiptToDelete.receipt_id;
    
    // Call backend API to delete the receipt (which deletes all lines with same ReceiptID)
    await deleteReceipt(mappingIdToDelete);
    
    // Update local state by filtering out ALL rows with the same ReceiptID
    setReceipts(prevReceipts => {
      if (!Array.isArray(prevReceipts)) return prevReceipts;
      
      // Filter out all rows that have the same ReceiptID
      const updatedReceipts = prevReceipts.filter(receipt => {
        const receiptId = receipt.ReceiptID || receipt.receipt_id;
        return receiptId !== receiptIdToDelete;
      });
      
      console.log(`Deleted receipt ${receiptIdToDelete}. Before: ${prevReceipts.length}, After: ${updatedReceipts.length}`);
      return updatedReceipts;
    });
    
    showSnackbarMessage("✅ Receipt deleted successfully!", "success");
    setDeleteDialog({ open: false, receiptId: null, receiptNo: null });
    
  } catch (err) {
    console.error("Error deleting receipt:", err);
    const errorMsg = err.response?.data?.message || err.message || "Error deleting receipt";
    showSnackbarMessage(`❌ ${errorMsg}`, "error");
  } finally {
    setDeleting(false);
  }
};

// Handle delete (for single line deletion)
// const handleDelete = async () => {
//   if (!deleteDialog.receiptId || deleting) return;

//   try {
//     setDeleting(true);
    
//     // The deleteDialog.receiptId is the MappingID from the clicked row
//     const mappingIdToDelete = deleteDialog.receiptId;
    
//     // Call backend API to delete the specific line
//     await deleteReceipt(mappingIdToDelete);
    
//     // Update local state by filtering out the specific MappingID
//     setReceipts(prevReceipts => {
//       if (!Array.isArray(prevReceipts)) return prevReceipts;
      
//       // Filter using multiple possible ID fields
//       const updatedReceipts = prevReceipts.filter(receipt => {
//         // Try multiple ID fields
//         const mappingId = receipt.MappingID || receipt.mapping_id;
//         const receiptId = receipt.ReceiptID || receipt.receipt_id;
//         const id = receipt.id;
        
//         // Convert to string for comparison
//         const receiptIds = [
//           mappingId?.toString(),
//           receiptId?.toString(),
//           id?.toString()
//         ].filter(Boolean);
        
//         // Only remove if MappingID matches (single line deletion)
//         const shouldKeep = mappingId?.toString() !== mappingIdToDelete.toString();
        
//         return shouldKeep;
//       });
      
//       console.log(`Deleted line with MappingID: ${mappingIdToDelete}. Before: ${prevReceipts.length}, After: ${updatedReceipts.length}`);
//       return updatedReceipts;
//     });
    
//     showSnackbarMessage("✅ Receipt line deleted successfully!", "success");
//     setDeleteDialog({ open: false, receiptId: null, receiptNo: null });
    
//   } catch (err) {
//     console.error("Error deleting receipt:", err);
//     const errorMsg = err.response?.data?.message || err.message || "Error deleting receipt";
//     showSnackbarMessage(`❌ ${errorMsg}`, "error");
//   } finally {
//     setDeleting(false);
//   }
// };

  // Handle import
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    const maxFileSize = 20 * 1024 * 1024;
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showSnackbarMessage("Please upload a valid Excel file (.xlsx, .xls) or CSV file", "error");
      event.target.value = "";
      return;
    }

    try {
      setImporting(true);
      setError(null);

      // Read file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: "",
        blankrows: false,
      });

      if (!jsonData || jsonData.length === 0) {
        showSnackbarMessage("Excel file is empty or has no data", "error");
        return;
      }

      // Parse date helper - handles multiple date formats including M/D/YY
      const parseDateSafe = (value) => {
        if (!value) return null;
        
        // Already in YYYY-MM-DD format
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        
        // Handle Excel date serial numbers
        if (typeof value === "number") {
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + value * 86400000);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        
        // Handle string dates
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return null;
          
          // Try YYYY-MM-DD or YYYY/MM/DD format first
          const fullYearMatch = trimmed.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
          if (fullYearMatch) {
            const [, year, month, day] = fullYearMatch;
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
          
          // Handle M/D/YY or M/D/YYYY format (e.g., "1/15/24" or "1/15/2024")
          // This handles formats like: 1/15/24, 01/15/24, 1/15/2024, 1-15-24
          // Match pattern: M/D/YY or M/D/YYYY (with optional leading zeros)
          // Try both with and without anchors to be more flexible
          const shortYearMatch1 = trimmed.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
          const shortYearMatch2 = trimmed.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
          const shortYearMatch = shortYearMatch1 || shortYearMatch2;
          
          if (shortYearMatch) {
            const [, month, day, year] = shortYearMatch;
            let fullYear;
            if (year.length === 2) {
              // 2-digit year: assume 2000-2099 range (24 = 2024, 99 = 2099, 00-23 = 2000-2023)
              const yearNum = parseInt(year, 10);
              fullYear = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
            } else {
              fullYear = parseInt(year, 10);
            }
            const monthNum = parseInt(month, 10);
            const dayNum = parseInt(day, 10);
            // Validate month and day ranges
            if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
              const result = `${fullYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              return result;
            }
          }
          
          // Try to parse as Date object (handles various formats including M/D/YY)
          // JavaScript Date constructor can parse "1/15/24" format
          // Note: Some browsers interpret 2-digit years as 1900s, so we need to correct it
          const dateObj = new Date(trimmed);
          if (!isNaN(dateObj.getTime())) {
            let year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const day = dateObj.getDate();
            
            // Check if the original string had a 2-digit year at the end
            const twoDigitYearMatch = trimmed.match(/[-\/](\d{2})$/);
            if (twoDigitYearMatch) {
              const twoDigitYear = parseInt(twoDigitYearMatch[1], 10);
              
              // If year is in 1900s but the 2-digit year suggests 2000s, correct it
              if (year >= 1900 && year < 2000 && twoDigitYear < 50) {
                year = 2000 + twoDigitYear;
              }
              // If year is already in 2000s, use as-is
              // If year is in 1900s and twoDigitYear >= 50, keep as 1900s (1950-1999)
            }
            
            // Return if year is in valid range (1900-2099)
            if (year >= 1900 && year < 2100) {
              return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            }
          }
        }
        
        return null;
      };

      // Helper functions
      const toSafeString = (value) => {
        if (value === null || value === undefined || value === "") return null;
        const trimmed = String(value).trim();
        return trimmed === "" ? null : trimmed;
      };

      const toSafeNumber = (value) => {
        // Allow 0 as a valid value (needed for Code field in DP/Tax receipts)
        if (value === 0 || value === "0") return 0;
        if (value === null || value === undefined || value === "") return null;
        if (typeof value === "number") return isNaN(value) ? null : value;
        const num = Number(String(value).replace(/[,,\s]/g, ""));
        // Allow 0 from string conversion
        if (num === 0) return 0;
        return isNaN(num) ? null : num;
      };

      // Column mapping for receipts
      // NOTE: ReceiptID, EntryID, VoucherNo, DefaultSurcharge are AUTO-GENERATED - do not include in Excel
      const columnMapping = {
        "Project": ["Project", "project"],
        "OldVoucherNo": ["OldVoucherNo", "Old Voucher No", "old_voucher_no"],
        "ReceiptDate": ["ReceiptDate", "Receipt Date", "receipt_date"],
        "UnitNo": ["UnitNo", "Unit No", "unit_no", "UnitID", "Unit ID"],
        "CustomerName": ["CustomerName", "Customer Name", "customer_name", "Customer"],
        "CNIC": ["CNIC", "cnic"],
        "Narration": ["Narration", "narration"],
        "CollectionBy": ["CollectionBy", "Collection By", "collection_by"],
        "Source": ["Source", "source"],
        "ReceiptMode": ["ReceiptMode", "Receipt Mode", "receipt_mode"],
        "Remarks": ["Remarks", "remarks"],
        "Code": ["Code", "code", "InstNo", "Inst No"],
        "ReceiptType": ["ReceiptType", "Receipt Type", "receipt_type"],
        "Knocking": ["Knocking", "knocking"],
        "Amount": ["Amount", "amount"],
      };

      // Auto-generated columns that should be ignored if present in Excel
      const autoGeneratedColumns = [
        "ReceiptID", "Receipt ID", "receipt_id",
        "EntryID", "Entry ID", "entry_id",
        "VoucherNo", "Voucher No", "voucher_no", "Voucher",
        "DefaultSurcharge", "Default Surcharge", "default_surcharge", "Surcharge",
        "EntryDate", "Entry Date", "entry_date",
        "CreatedAt", "Created At", "created_at", "Created",
        "MappingID", "Mapping ID", "mapping_id", "ID"
      ];

      // Find column mapping
      const findColumn = (excelKey) => {
        const cleanKey = excelKey.trim();
        for (const [dbCol, variations] of Object.entries(columnMapping)) {
          for (const variant of variations) {
            if (cleanKey.toLowerCase() === variant.toLowerCase() ||
                cleanKey.replace(/\s+/g, "").toLowerCase() === variant.replace(/\s+/g, "").toLowerCase()) {
              return dbCol;
            }
          }
        }
        return null;
      };

      // Group rows by receipt (if ReceiptID exists) or treat each row as separate receipt
      const receiptsMap = new Map();
      const rowErrors = [];

      // Log Excel file structure for debugging
      if (jsonData.length > 0) {
        console.log("=== EXCEL FILE ANALYSIS ===");
        console.log("Total rows in Excel:", jsonData.length);
        console.log("Excel headers detected:", Object.keys(jsonData[0]));
        console.log("First row sample:", jsonData[0]);
        console.log("=== END ANALYSIS ===");
      }

      jsonData.forEach((row, index) => {
        const rowNumber = index + 1;
        try {
          // Helper to get value from row using column mapping
          const getValueByColumn = (dbColName) => {
            for (const [excelKey, value] of Object.entries(row)) {
              const mappedCol = findColumn(excelKey);
              if (mappedCol === dbColName) {
                return value;
              }
            }
            return null;
          };

          // Extract key fields using findColumn to handle header name variations
          const receiptId = getValueByColumn("ReceiptID") || null;
          const unitNo = toSafeString(getValueByColumn("UnitNo"));
          const rawReceiptDate = getValueByColumn("ReceiptDate");
          const receiptDate = parseDateSafe(rawReceiptDate);
          
          // Debug for first row
          if (index === 0) {
            console.log("Initial extraction:", {
              rawReceiptDate,
              rawReceiptDateType: typeof rawReceiptDate,
              receiptDate,
              unitNo,
            });
          }
          
          // Create a key for grouping: 
          // - If ReceiptID is provided, use it to group multiple rows into one receipt
          // - Otherwise, treat each row as a separate receipt (use row index to ensure uniqueness)
          // This ensures each Excel row becomes a separate receipt unless explicitly grouped by ReceiptID
          const receiptKey = receiptId || `ROW_${rowNumber}`;
          
          if (!receiptsMap.has(receiptKey)) {
            receiptsMap.set(receiptKey, {
              _rowNumber: rowNumber, // Track which Excel row this receipt came from
              Project: null,
              OldVoucherNo: null,
              ReceiptDate: null,
              UnitNo: null,
              CustomerName: null,
              CNIC: null,
              Narration: null,
              CollectionBy: null,
              Source: null,
              ReceiptMode: null,
              Remarks: null,
              Lines: [],
            });
          }

          const receipt = receiptsMap.get(receiptKey);
          const lineItem = { Code: null, ReceiptType: null, Knocking: null, Amount: null };

          // Map all columns
          let mappedColumnsCount = 0;
          let unmappedColumns = [];
          
          Object.keys(row).forEach((excelKey) => {
            // Ignore auto-generated columns if present in Excel
            const cleanKey = excelKey.trim().toLowerCase();
            const isAutoGenerated = autoGeneratedColumns.some(autoCol => 
              cleanKey === autoCol.toLowerCase() || 
              cleanKey.replace(/\s+/g, "") === autoCol.replace(/\s+/g, "").toLowerCase()
            );
            
            if (isAutoGenerated) {
              // Log warning for first row only
              if (index === 0) {
                console.warn(`⚠️ Column "${excelKey}" is auto-generated and will be ignored. Please remove it from your Excel file.`);
              }
              return; // Skip auto-generated columns
            }
            
            const dbCol = findColumn(excelKey);
            if (!dbCol) {
              if (index === 0) {
                unmappedColumns.push(excelKey);
              }
              return;
            }
            
            mappedColumnsCount++;

            let value = row[excelKey];
            
            // Clean value
            if (typeof value === "string") {
              value = value.trim();
              if (value === "" || value === "-" || /^[\s\-]+$/.test(value)) {
                value = null;
              }
            } else if (value === null || value === undefined) {
              value = null;
            }

            // Handle header fields - only set if not already set (preserve first non-null value)
            if (["Project", "OldVoucherNo", "UnitNo", "CustomerName", "CNIC", "Narration", 
                 "CollectionBy", "Source", "ReceiptMode", "Remarks"].includes(dbCol)) {
              if (receipt[dbCol] === null || receipt[dbCol] === undefined || receipt[dbCol] === "") {
                const safeValue = toSafeString(value);
                receipt[dbCol] = safeValue;
                // Debug logging for first few rows and required fields
                if (index < 3 && ["UnitNo", "CollectionBy", "Source", "ReceiptMode"].includes(dbCol)) {
                  console.log(`Setting ${dbCol} for row ${index + 1}:`, {
                    rawValue: value,
                    rawValueType: typeof value,
                    safeValue: safeValue,
                    excelKey: excelKey,
                  });
                }
              }
            } else if (dbCol === "ReceiptDate") {
              if (receipt[dbCol] === null || receipt[dbCol] === undefined) {
                // Parse the date value - make sure we're using the actual value from the row
                let dateValue = value;
                
                // If value is null/undefined, try to get it directly from the row
                if (!dateValue) {
                  // Try to find ReceiptDate in the row using column mapping
                  for (const [excelKey, rowValue] of Object.entries(row)) {
                    const mappedCol = findColumn(excelKey);
                    if (mappedCol === "ReceiptDate") {
                      dateValue = rowValue;
                      break;
                    }
                  }
                }
                
                const parsedDate = parseDateSafe(dateValue);
                
                // Debug logging for first few rows
                if (index < 3) {
                  console.log(`Date parsing for row ${index + 1}:`, {
                    rawValue: value,
                    dateValue: dateValue,
                    rawValueType: typeof value,
                    dateValueType: typeof dateValue,
                    trimmedValue: typeof dateValue === "string" ? dateValue.trim() : dateValue,
                    parsedDate: parsedDate,
                    receiptDateBefore: receipt[dbCol],
                  });
                }
                
                // Set the parsed date (even if null, so we can see it in validation)
                receipt[dbCol] = parsedDate;
                
                // If parsing failed, log a warning
                if (!parsedDate && dateValue) {
                  console.warn(`⚠️ Failed to parse ReceiptDate for row ${index + 1}: "${dateValue}" (type: ${typeof dateValue})`);
                  // Try alternative parsing
                  console.warn(`  Attempting alternative parsing methods...`);
                  const alt1 = parseDateSafe(String(dateValue));
                  const alt2 = parseDateSafe(dateValue?.toString());
                  console.warn(`  Alternative results:`, { alt1, alt2 });
                }
              }
            }
            // Handle line item fields
            else if (["Code", "ReceiptType", "Knocking", "Amount"].includes(dbCol)) {
              if (dbCol === "Amount") {
                lineItem[dbCol] = toSafeNumber(value);
              } else if (dbCol === "Code") {
                // Code can be 0 (valid for DP/Tax), so handle 0 explicitly
                if (value === 0 || value === "0") {
                  lineItem[dbCol] = 0;
                } else {
                  lineItem[dbCol] = toSafeNumber(value);
                }
              } else {
                lineItem[dbCol] = toSafeString(value);
              }
            }
          });

          // Log mapping info for first row
          if (index === 0) {
            console.log("=== COLUMN MAPPING INFO ===");
            console.log(`✅ Mapped ${mappedColumnsCount} columns from ${Object.keys(row).length} total columns`);
            if (unmappedColumns.length > 0) {
              console.warn(`⚠️ Unmapped columns (will be ignored):`, unmappedColumns);
            }
            console.log("Raw row keys:", Object.keys(row));
            const rawReceiptDate = getValueByColumn("ReceiptDate");
            const rawUnitNo = getValueByColumn("UnitNo");
            const rawCollectionBy = getValueByColumn("CollectionBy");
            const rawSource = getValueByColumn("Source");
            const rawReceiptMode = getValueByColumn("ReceiptMode");
            console.log("Extracted values for row 1:", {
              unitNo,
              receiptDate,
              receiptId,
              rawUnitNo: rawUnitNo,
              rawCollectionBy: rawCollectionBy,
              rawSource: rawSource,
              rawReceiptMode: rawReceiptMode,
              rawReceiptDateValue: rawReceiptDate,
              rawReceiptDateType: typeof rawReceiptDate,
              parsedReceiptDate: receipt.ReceiptDate,
              parseDateSafeResult: parseDateSafe(rawReceiptDate),
              lineItemCode: lineItem.Code,
              lineItemCodeType: typeof lineItem.Code,
              lineItemReceiptType: lineItem.ReceiptType,
              lineItemReceiptTypeType: typeof lineItem.ReceiptType,
              lineItemAmount: lineItem.Amount,
              lineItemAmountType: typeof lineItem.Amount,
            });
            console.log("Receipt object after mapping:", {
              UnitNo: receipt.UnitNo,
              ReceiptDate: receipt.ReceiptDate,
              CollectionBy: receipt.CollectionBy,
              Source: receipt.Source,
              ReceiptMode: receipt.ReceiptMode,
              LinesCount: receipt.Lines.length,
            });
            console.log("=== END MAPPING INFO ===");
          }

          // Normalize ReceiptType to uppercase for validation
          let normalizedReceiptType = lineItem.ReceiptType ? String(lineItem.ReceiptType).toUpperCase().trim() : "";
          if (normalizedReceiptType === "INST" || normalizedReceiptType === "INSTALLMENT") {
            normalizedReceiptType = "INSTALLMENT";
          } else if (normalizedReceiptType === "TAX") {
            normalizedReceiptType = "TAX";
          } else if (normalizedReceiptType === "DP" || normalizedReceiptType === "DOWN PAYMENT") {
            normalizedReceiptType = "DP";
          } else if (normalizedReceiptType === "FINAL PAYMENT" || normalizedReceiptType === "FINAL") {
            normalizedReceiptType = "FINAL PAYMENT";
          }
          lineItem.ReceiptType = normalizedReceiptType;

          // Auto-correct Code based on ReceiptType business rules
          // Business Rule:
          // - If ReceiptType is DP, TAX, or FINAL PAYMENT, Code must be 0 (auto-correct if invalid)
          // - If ReceiptType is INSTALLMENT, Code must be > 0 (installment number)
          if (normalizedReceiptType === "DP" || normalizedReceiptType === "TAX" || normalizedReceiptType === "FINAL PAYMENT") {
            // Auto-correct: Force Code to 0 for DP/TAX receipts
            // Convert to number first to handle string "0" or other types
            const codeAsNumber = typeof lineItem.Code === "number" ? lineItem.Code : (lineItem.Code === "0" || lineItem.Code === 0 ? 0 : Number(lineItem.Code));
            if (!isNaN(codeAsNumber) && codeAsNumber !== 0) {
              console.warn(`⚠️ Auto-correcting Code from ${lineItem.Code} (${typeof lineItem.Code}) to 0 for ${normalizedReceiptType} receipt (Row ${index + 1})`);
              lineItem.Code = 0;
            } else if (lineItem.Code === null || lineItem.Code === undefined || isNaN(codeAsNumber)) {
              lineItem.Code = 0;
            } else {
              // Ensure it's exactly 0 (not "0" string)
              lineItem.Code = 0;
            }
          }

          // Add line item if it has required fields
          const hasValidCode = (lineItem.Code === 0) || (lineItem.Code !== null && lineItem.Code !== undefined && typeof lineItem.Code === "number");
          const hasValidReceiptType = normalizedReceiptType !== "" && ["INSTALLMENT", "DP", "TAX", "FINAL PAYMENT"].includes(normalizedReceiptType);
          const hasValidAmount = lineItem.Amount !== null && lineItem.Amount !== undefined && typeof lineItem.Amount === "number";
          
          // Validate Code based on ReceiptType (after auto-correction)
          let codeValidationError = null;
          if (hasValidCode && hasValidReceiptType) {
            if ((normalizedReceiptType === "DP" || normalizedReceiptType === "TAX" || normalizedReceiptType === "FINAL PAYMENT") && lineItem.Code !== 0) {
              codeValidationError = `Code must be 0 for ${normalizedReceiptType} receipts`;
            } else if (normalizedReceiptType === "INSTALLMENT" && (lineItem.Code === null || lineItem.Code === undefined || lineItem.Code === 0)) {
              codeValidationError = "Code must be greater than 0 for INSTALLMENT receipts (installment number)";
            }
          }
          
          if (hasValidCode && hasValidReceiptType && hasValidAmount && !codeValidationError) {
            // Set defaults for optional fields
            if (lineItem.Knocking === null || lineItem.Knocking === undefined) {
              lineItem.Knocking = "No";
            }
            // Add the line item (Code = 0 is valid for DP/Tax)
            receipt.Lines.push({
              Code: lineItem.Code, // 0 for DP/TAX, >0 for INSTALLMENT
              ReceiptType: normalizedReceiptType,
              Knocking: lineItem.Knocking || "No",
              Amount: lineItem.Amount,
            });
          } else {
            // Log missing required fields or validation errors with detailed information
            const missingFields = [];
            const codeValue = getValueByColumn("Code");
            const receiptTypeValue = getValueByColumn("ReceiptType");
            const amountValue = getValueByColumn("Amount");
            
            if (!hasValidCode) {
              if (lineItem.Code === null || lineItem.Code === undefined) {
                missingFields.push(`Code (value: ${codeValue || "empty"}, type: ${typeof codeValue})`);
              }
            }
            if (!hasValidReceiptType) {
              missingFields.push(`ReceiptType (value: ${receiptTypeValue || "empty"}, type: ${typeof receiptTypeValue}) - must be INSTALLMENT, DP, TAX, or FINAL PAYMENT`);
            }
            if (!hasValidAmount) {
              missingFields.push(`Amount (value: ${amountValue || "empty"}, type: ${typeof amountValue})`);
            }
            if (codeValidationError) {
              missingFields.push(codeValidationError);
            }
            
            const errorDetails = {
              row: index + 1,
              unitNo: unitNo || "N/A",
              receiptDate: receiptDate || "N/A",
              error: missingFields.length > 0 
                ? `Validation error: ${missingFields.join(", ")}`
                : "Missing required line item fields",
              lineItem: {
                Code: lineItem.Code,
                CodeType: typeof lineItem.Code,
                ReceiptType: lineItem.ReceiptType,
                ReceiptTypeType: typeof lineItem.ReceiptType,
                Amount: lineItem.Amount,
                AmountType: typeof lineItem.Amount,
              },
              rawRow: index < 3 ? row : undefined, // Include raw row for first 3 errors
            };
            
            console.error(`❌ Row ${index + 1} validation failed:`, errorDetails);
            rowErrors.push(errorDetails);
          }
        } catch (rowError) {
          rowErrors.push({
            row: index + 1,
            error: `Row processing error: ${rowError.message}`,
          });
        }
      });

      // Convert to array and validate receipts
      const receiptsArray = [];
      const receiptKeys = Array.from(receiptsMap.keys());
      
      console.log(`=== RECEIPT GROUPING SUMMARY ===`);
      console.log(`Total rows in Excel: ${jsonData.length}`);
      console.log(`Total receipts created (before validation): ${receiptsMap.size}`);
      console.log(`Receipt keys:`, receiptKeys);
      
      // Track which rows created receipts
      const rowToReceiptMap = new Map();
      Array.from(receiptsMap.entries()).forEach(([key, receipt]) => {
        const rowNum = receipt._rowNumber || "unknown";
        rowToReceiptMap.set(rowNum, key);
      });
      
      // Find rows that didn't create receipts
      const missingRows = [];
      for (let i = 1; i <= jsonData.length; i++) {
        if (!rowToReceiptMap.has(i)) {
          missingRows.push(i);
        }
      }
      if (missingRows.length > 0) {
        console.warn(`⚠️ WARNING: ${missingRows.length} row(s) did not create receipts:`, missingRows);
      }
      
      Array.from(receiptsMap.entries()).forEach(([key, receipt], receiptIndex) => {
        // Validate required header fields
        // Check for null, undefined, or empty string
        const missingFields = [];
        if (!receipt.UnitNo || receipt.UnitNo === "" || receipt.UnitNo === null || receipt.UnitNo === undefined) {
          missingFields.push("UnitNo");
        }
        if (!receipt.ReceiptDate || receipt.ReceiptDate === "" || receipt.ReceiptDate === null || receipt.ReceiptDate === undefined) {
          missingFields.push("ReceiptDate");
        }
        if (!receipt.CollectionBy || receipt.CollectionBy === "" || receipt.CollectionBy === null || receipt.CollectionBy === undefined) {
          missingFields.push("CollectionBy");
        }
        if (!receipt.Source || receipt.Source === "" || receipt.Source === null || receipt.Source === undefined) {
          missingFields.push("Source");
        }
        // ReceiptMode is optional - can be null/empty
        
        if (missingFields.length > 0) {
          // Find the original row(s) that contributed to this receipt
          const rowNum = receipt._rowNumber || "unknown";
          const contributingRows = [];
          jsonData.forEach((r, idx) => {
            const rUnitNo = toSafeString(r.UnitNo || r["Unit No"] || r["UnitNo"] || r.unit_no);
            const rReceiptDate = parseDateSafe(r.ReceiptDate || r["Receipt Date"] || r.receipt_date);
            if (rUnitNo === receipt.UnitNo || idx + 1 === Number(rowNum)) {
              contributingRows.push({
                rowIndex: idx + 1,
                rawReceiptDate: r.ReceiptDate || r["Receipt Date"] || r.receipt_date,
                parsedReceiptDate: rReceiptDate,
                rawUnitNo: r.UnitNo || r["Unit No"] || r["UnitNo"] || r.unit_no,
                rawCollectionBy: r.CollectionBy || r["Collection By"] || r.collection_by,
                rawSource: r.Source || r.source,
                rawReceiptMode: r.ReceiptMode || r["Receipt Mode"] || r.receipt_mode,
              });
            }
          });
          
          const errorMessage = `Missing required header fields: ${missingFields.join(", ")}`;
          const errorDetails = {
            receipt: key,
            receiptIndex: receiptIndex + 1,
            rowNumber: rowNum,
            unitNo: receipt.UnitNo || "N/A",
            receiptDate: receipt.ReceiptDate || "N/A",
            error: errorMessage,
            receiptData: {
              UnitNo: receipt.UnitNo,
              ReceiptDate: receipt.ReceiptDate,
              ReceiptDateType: typeof receipt.ReceiptDate,
              CollectionBy: receipt.CollectionBy,
              Source: receipt.Source,
              ReceiptMode: receipt.ReceiptMode,
              LinesCount: receipt.Lines?.length || 0,
            },
            contributingRows: contributingRows,
          };
          
          // Log detailed error message
          console.error(`❌ Receipt validation failed (${key}, Excel Row ${rowNum}): ${errorMessage}`);
          console.error(`   Missing fields: ${missingFields.join(", ")}`);
          console.error(`   Receipt data:`, {
            UnitNo: receipt.UnitNo || "NULL",
            ReceiptDate: receipt.ReceiptDate || "NULL",
            CollectionBy: receipt.CollectionBy || "NULL",
            Source: receipt.Source || "NULL",
            ReceiptMode: receipt.ReceiptMode || "NULL",
          });
          if (contributingRows.length > 0 && contributingRows[0]) {
            console.error(`   Raw Excel row data:`, contributingRows[0]);
          }
          
          rowErrors.push(errorDetails);
          return; // Skip this receipt
        }

        // Validate that receipt has at least one line
        if (!receipt.Lines || receipt.Lines.length === 0) {
          const rowNum = receipt._rowNumber || "unknown";
          const errorDetails = {
            receipt: key,
            rowNumber: rowNum,
            unitNo: receipt.UnitNo || "N/A",
            receiptDate: receipt.ReceiptDate || "N/A",
            error: `Receipt must have at least one line item (Row ${rowNum} from Excel had no valid line items)`,
            receiptData: {
              UnitNo: receipt.UnitNo,
              ReceiptDate: receipt.ReceiptDate,
              LinesCount: receipt.Lines?.length || 0,
            },
          };
          console.error(`❌ Receipt has no line items (${key}, Excel Row ${rowNum}):`, errorDetails);
          console.error(`   This receipt was created from Excel row ${rowNum}, but the line item validation failed.`);
          console.error(`   Check the row-level validation errors above to see why the line item was rejected.`);
          rowErrors.push(errorDetails);
          return;
        }

        // Validate each line item
        receipt.Lines.forEach((line, lineIndex) => {
          const lineMissingFields = [];
          const receiptType = String(line.ReceiptType || "").toUpperCase().trim();
          const rowNum = receipt._rowNumber || "unknown";
          
          // Code validation based on ReceiptType
          // Business Rule: DP/TAX/FINAL PAYMENT must have Code=0, INSTALLMENT must have Code>0
          if (line.Code === null || line.Code === undefined) {
            lineMissingFields.push("Code");
          } else if ((receiptType === "DP" || receiptType === "TAX" || receiptType === "FINAL PAYMENT") && line.Code !== 0) {
            lineMissingFields.push(`Code must be 0 for ${receiptType} receipts (current: ${line.Code})`);
          } else if (receiptType === "INSTALLMENT" && (line.Code === 0 || line.Code === null || line.Code === undefined)) {
            lineMissingFields.push(`Code must be greater than 0 for INSTALLMENT receipts (installment number, current: ${line.Code})`);
          }
          
          if (!line.ReceiptType || String(line.ReceiptType).trim() === "") {
            lineMissingFields.push("ReceiptType");
          } else if (!["INSTALLMENT", "DP", "TAX", "FINAL PAYMENT"].includes(receiptType)) {
            lineMissingFields.push(`ReceiptType must be INSTALLMENT, DP, TAX, or FINAL PAYMENT (current: ${line.ReceiptType})`);
          }
          
          if (line.Amount === null || line.Amount === undefined) {
            lineMissingFields.push("Amount");
          }
          
          if (lineMissingFields.length > 0) {
            const rowNum = receipt._rowNumber || "unknown";
            const errorDetails = {
              receipt: key,
              rowNumber: rowNum,
              unitNo: receipt.UnitNo || "N/A",
              receiptDate: receipt.ReceiptDate || "N/A",
              line: lineIndex + 1,
              error: `Line item missing required fields: ${lineMissingFields.join(", ")}`,
              lineData: {
                Code: line.Code,
                CodeType: typeof line.Code,
                ReceiptType: line.ReceiptType,
                ReceiptTypeType: typeof line.ReceiptType,
                Amount: line.Amount,
                AmountType: typeof line.Amount,
              },
            };
            console.error(`❌ Line item validation failed (${key}, Excel Row ${rowNum}, line ${lineIndex + 1}):`, errorDetails);
            rowErrors.push(errorDetails);
          }
        });

        receiptsArray.push(receipt);
      });
      
      console.log(`=== VALIDATION SUMMARY ===`);
      console.log(`Total receipts after validation: ${receiptsArray.length}`);
      console.log(`Total receipts rejected: ${receiptsMap.size - receiptsArray.length}`);
      console.log(`Total line items across all receipts: ${receiptsArray.reduce((sum, r) => sum + (r.Lines?.length || 0), 0)}`);
      
      // Show which receipts were rejected
      const rejectedReceipts = Array.from(receiptsMap.entries())
        .filter(([key, receipt]) => {
          const hasValidHeader = receipt.UnitNo && receipt.ReceiptDate && receipt.CollectionBy && receipt.Source && receipt.ReceiptMode;
          const hasLines = receipt.Lines && receipt.Lines.length > 0;
          return !hasValidHeader || !hasLines;
        })
        .map(([key, receipt]) => ({
          key,
          rowNumber: receipt._rowNumber || "unknown",
          unitNo: receipt.UnitNo || "N/A",
          receiptDate: receipt.ReceiptDate || "N/A",
          hasValidHeader: !!(receipt.UnitNo && receipt.ReceiptDate && receipt.CollectionBy && receipt.Source && receipt.ReceiptMode),
          linesCount: receipt.Lines?.length || 0,
        }));
      
      if (rejectedReceipts.length > 0) {
        console.warn(`⚠️ Rejected receipts (${rejectedReceipts.length}):`, rejectedReceipts);
      }
      
      console.log(`=== END VALIDATION SUMMARY ===`);

      // Log errors before import with detailed breakdown
      if (rowErrors.length > 0) {
        console.error("=== VALIDATION ERRORS DETAILED ===");
        console.error(`Total validation errors: ${rowErrors.length}`);
        console.error("All errors:", rowErrors);
        
        // Group errors by type
        const errorTypes = {};
        rowErrors.forEach((err, idx) => {
          const errorKey = err.error || "Unknown error";
          if (!errorTypes[errorKey]) {
            errorTypes[errorKey] = [];
          }
          errorTypes[errorKey].push({
            row: err.row || err.receipt || "N/A",
            unitNo: err.unitNo || "N/A",
            details: err,
          });
        });
        
        console.error("Errors grouped by type:", errorTypes);
        console.error("=== END VALIDATION ERRORS ===");
        
        // REJECT ENTIRE IMPORT if ANY errors found - Do not import ANY data
        const errorSummary = rowErrors.slice(0, 10).map(err => 
          `Row ${err.row || err.rowNumber || err.receipt || "N/A"}: ${err.error}`
        ).join("; ");
        
        const errorMessage = `Import rejected: ${rowErrors.length} formatting/validation error(s) detected. All rows must be valid.`;
        
        // Show error dialog instead of snackbar
        setImportErrorDialog({
          open: true,
          errors: rowErrors,
          totalErrors: rowErrors.length,
          totalRows: jsonData.length,
        });
        
        showSnackbarMessage(errorMessage, "error");
        console.error("=== RECEIPT IMPORT REJECTED ===");
        console.error(`Total rows processed: ${jsonData.length}`);
        console.error(`Total validation errors: ${rowErrors.length}`);
        console.error(`Reason: Import rejected because one or more rows have formatting/validation errors.`);
        console.error(`Action: Fix all errors in the Excel file and try importing again.`);
        console.error(`Policy: All rows must be valid - no partial imports allowed.`);
        console.error("All validation errors:", rowErrors);
        console.error("=== END ERROR REPORT ===");
        return; // Stop import completely - do not import any data
      }

      if (receiptsArray.length === 0) {
        const errorMsg = rowErrors.length > 0 
          ? `No valid receipts found. ${rowErrors.length} error(s) detected. Check console (F12) for details.`
          : "No valid receipt data found in file";
        showSnackbarMessage(errorMsg, "error");
        console.error("=== RECEIPT VALIDATION FAILED ===");
        console.error(`Total rows processed: ${jsonData.length}`);
        console.error(`Total receipts created: ${receiptsArray.length}`);
        console.error(`Total errors: ${rowErrors.length}`);
        console.error("All validation errors:", rowErrors);
        console.error("=== END ERROR REPORT ===");
        return;
      }

      // Log summary before import
      console.log("=== RECEIPT IMPORT SUMMARY ===");
      console.log(`Total rows in Excel file: ${jsonData.length}`);
      console.log(`Total receipts to import: ${receiptsArray.length}`);
      console.log(`Total validation errors: ${rowErrors.length} (All rows validated successfully - proceeding with import)`);
      console.log(`Total line items: ${receiptsArray.reduce((sum, r) => sum + (r.Lines?.length || 0), 0)}`);
      
      // Verify all rows were successfully processed (no errors)
      if (receiptsArray.length !== jsonData.length) {
        const missingCount = jsonData.length - receiptsArray.length;
        const errorMsg = `Import rejected: ${missingCount} row(s) failed validation. All rows must be valid. Expected ${jsonData.length} receipts, but only ${receiptsArray.length} are valid.`;
        showSnackbarMessage(errorMsg, "error");
        console.error("=== RECEIPT IMPORT REJECTED ===");
        console.error(`Total rows in Excel: ${jsonData.length}`);
        console.error(`Valid receipts: ${receiptsArray.length}`);
        console.error(`Missing receipts: ${missingCount}`);
        console.error(`Policy: All rows must be valid - no partial imports allowed.`);
        console.error("=== END ERROR REPORT ===");
        return; // Stop import completely
      }
      
      // Log each receipt with its line count
      receiptsArray.forEach((r, idx) => {
        console.log(`Receipt ${idx + 1}/${receiptsArray.length}:`, {
          UnitNo: r.UnitNo,
          ReceiptDate: r.ReceiptDate,
          LinesCount: r.Lines?.length || 0,
          CollectionBy: r.CollectionBy,
          Source: r.Source,
          ReceiptMode: r.ReceiptMode,
        });
      });
      
      console.log("✅ All rows validated successfully. Proceeding with import...");
      console.log("=== END SUMMARY ===");

      // Process in batches
      const BATCH_SIZE = 100;
      let totalSuccessCount = 0;
      let totalErrorCount = 0;
      const allErrors = [];

      showSnackbarMessage(`Processing ${receiptsArray.length} receipts in batches of ${BATCH_SIZE}...`, "info");

      for (let i = 0; i < receiptsArray.length; i += BATCH_SIZE) {
        const batch = receiptsArray.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(receiptsArray.length / BATCH_SIZE);

        try {
          showSnackbarMessage(
            `Importing batch ${batchNumber}/${totalBatches} (receipts ${i + 1}-${Math.min(i + BATCH_SIZE, receiptsArray.length)})...`,
            "info"
          );

          const response = await bulkImportReceipts(batch);
          
          // Extract success/error counts from response
          const batchSuccessCount = response.data?.data?.successCount ?? response.data?.successCount ?? 0;
          const batchErrorCount = response.data?.data?.errorCount ?? response.data?.errorCount ?? 0;
          
          console.log(`Batch ${batchNumber} results:`, {
            batchSize: batch.length,
            successCount: batchSuccessCount,
            errorCount: batchErrorCount,
            responseData: response.data,
          });
          
          totalSuccessCount += batchSuccessCount;
          totalErrorCount += batchErrorCount;

          const errors = response.data?.data?.errors || response.data?.errors || [];
          if (errors.length > 0) {
            allErrors.push(...errors);
            console.error(`Batch ${batchNumber} errors:`, errors);
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

      // Show final results with detailed error information
      console.log("=== FINAL IMPORT RESULTS ===");
      console.log(`Excel rows: ${jsonData.length}`);
      console.log(`Receipts created (frontend): ${receiptsArray.length}`);
      console.log(`Receipts successfully imported (backend): ${totalSuccessCount}`);
      console.log(`Receipts failed (backend): ${totalErrorCount}`);
      
      // Calculate expected vs actual
      const expectedReceipts = jsonData.length;
      const actualReceipts = totalSuccessCount;
      const missingReceipts = expectedReceipts - actualReceipts;
      
      if (missingReceipts > 0) {
        console.warn(`⚠️ WARNING: ${missingReceipts} receipt(s) are missing!`);
        console.warn(`   Expected: ${expectedReceipts} receipts (one per Excel row)`);
        console.warn(`   Imported: ${actualReceipts} receipts`);
        console.warn(`   Check validation errors and backend errors above.`);
      }
      
      if (totalErrorCount > 0) {
        console.error("=== IMPORT ERRORS ===");
        console.error("Total errors:", allErrors.length);
        allErrors.forEach((err, idx) => {
          console.error(`Error ${idx + 1}:`, err);
        });
        console.error("=== END IMPORT ERRORS ===");
        
        showSnackbarMessage(
          `Import completed: ${totalSuccessCount}/${expectedReceipts} imported, ${totalErrorCount} failed. Check console (F12) for details.`,
          "warning"
        );
      } else {
        if (actualReceipts === expectedReceipts) {
          showSnackbarMessage(`Successfully imported all ${totalSuccessCount} receipt(s)!`, "success");
        } else {
          showSnackbarMessage(
            `Imported ${totalSuccessCount} receipt(s), but expected ${expectedReceipts}. Check console for details.`,
            "warning"
          );
        }
      }

      // Refresh the list
      await fetchReceipts();

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

  // Handle export
  const handleExport = () => {
    try {
      const csvContent = [
        [
          "MappingID",
          "ReceiptID",
          "EntryID",
          "VoucherNo",
          "ReceiptDate",
          "EntryDate",
          "UnitNo",
          "CustomerName",
          "Project",
          "CNIC",
          "CollectionBy",
          "Source",
          "ReceiptMode",
          "Code",
          "ReceiptType",
          "Knocking",
          "Amount",
          "DefaultSurcharge",
          "Narration",
          "Remarks",
          "CreatedAt",
        ],
        ...filteredAndSortedReceipts.map((r) => [
          r.MappingID || r.mapping_id || "",
          r.ReceiptID || r.receipt_id || r.id || "",
          r.EntryID || r.entry_id || "",
          r.VoucherNo || r.voucher_no || "",
          r.ReceiptDate || r.receipt_date || "",
          r.EntryDate || r.entry_date || "",
          r.UnitNo || r.unit_no || "",
          r.CustomerName || r.customer_name || "",
          r.Project || r.project || "",
          r.CNIC || r.cnic || "",
          r.CollectionBy || r.collection_by || "",
          r.Source || r.source || "",
          r.ReceiptMode || r.receipt_mode || "",
          r.Code || r.code || "",
          r.ReceiptType || r.receipt_type || "",
          r.Knocking || r.knocking || "",
          r.Amount || r.amount || 0,
          r.DefaultSurcharge || r.default_surcharge || 0,
          r.Narration || r.narration || "",
          r.Remarks || r.remarks || "",
          r.CreatedAt || r.created_at || "",
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `receipts_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSnackbarMessage("Receipts exported successfully!", "success");
    } catch (err) {
      showSnackbarMessage("Error exporting receipts", "error");
    }
  };

  // Filter and sort receipts
  const filteredAndSortedReceipts = Array.isArray(receipts)
    ? receipts
        .filter((receipt) => {
          if (!receipt || typeof receipt !== "object") return false;

          // Search filter
          const matchesSearch = searchTerm
            ? Object.values(receipt).some((value) => {
                if (value == null) return false;
                return value
                  .toString()
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
              })
            : true;

          // Unit No filter
          const matchesUnitNo =
            !filters.unitNo ||
            (receipt.UnitNo || receipt.unit_no || "")
              .toLowerCase()
              .includes(filters.unitNo.toLowerCase());

          // Customer Name filter
          const matchesCustomerName =
            !filters.customerName ||
            (receipt.CustomerName || receipt.customer_name || "")
              .toLowerCase()
              .includes(filters.customerName.toLowerCase());

          // Project filter
          const matchesProject =
            !filters.project ||
            (receipt.Project || receipt.project || "")
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

          let aValue = a[sortConfig.key] || a[sortConfig.key.toLowerCase()];
          let bValue = b[sortConfig.key] || b[sortConfig.key.toLowerCase()];

          // Handle null/undefined values
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return 1;
          if (bValue == null) return -1;

          // Convert to numbers if both values are numeric (for MappingID, Amount, etc.)
          const aNum = Number(aValue);
          const bNum = Number(bValue);
          if (!isNaN(aNum) && !isNaN(bNum) && aValue !== "" && bValue !== "") {
            aValue = aNum;
            bValue = bNum;
          } else {
            // For string comparisons, convert to string and lowercase
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
          }

          // Apply sort direction
          if (aValue < bValue)
            return sortConfig.direction === "asc" ? -1 : 1;
          if (aValue > bValue)
            return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        })
    : [];

  // Get unique values for filters
  const uniqueUnitNos = Array.isArray(receipts)
    ? [...new Set(receipts.map((r) => r.UnitNo || r.unit_no).filter(Boolean).sort())]
    : [];

  const uniqueCustomerNames = Array.isArray(receipts)
    ? [
        ...new Set(
          receipts
            .map((r) => r.CustomerName || r.customer_name)
            .filter(Boolean)
            .sort()
        ),
      ]
    : [];

  const uniqueProjects = Array.isArray(receipts)
    ? [
        ...new Set(
          receipts.map((r) => r.Project || r.project).filter(Boolean).sort()
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
    <Container
      maxWidth="xxl"
      sx={{
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3 },
      }}
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
      {/* <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <ReceiptStats receipts={receipts} />
      </Box> */}

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
              Receipt Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and organize your receipts
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
                onClick={fetchReceipts}
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
                disabled={filteredAndSortedReceipts.length === 0}
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
              onClick={() => navigate("/receipts/create")}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
                },
              }}
            >
              Create Receipt
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
              placeholder="Search receipts by receipt no, customer, unit, project..."
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

      {/* Receipts Table */}
      <ReceiptsTable
        receipts={filteredAndSortedReceipts}
        onEdit={handleEdit}
        onDelete={(receiptId, receiptNo) => {
          setDeleteDialog({ open: true, receiptId, receiptNo });
        }}
        onView={handleView}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      {/* Receipt Detail View */}
      <ReceiptDetailView
        receipt={selectedReceipt}
        open={showDetailView}
        onClose={() => {
          setShowDetailView(false);
          setSelectedReceipt(null);
        }}
        onEdit={handleEdit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() =>
          setDeleteDialog({ open: false, receiptId: null, receiptNo: null })
        }
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Receipt</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete receipt{" "}
            <strong>{deleteDialog.receiptNo || "this receipt"}</strong>? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteDialog({ open: false, receiptId: null, receiptNo: null })
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

      {/* Import Error Dialog */}
      <Dialog
        open={importErrorDialog.open}
        onClose={() => setImportErrorDialog({ open: false, errors: [], totalErrors: 0, totalRows: 0 })}
        maxWidth="md"
        fullWidth
        aria-labelledby="import-error-dialog-title"
      >
        <DialogTitle
          id="import-error-dialog-title"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            padding: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorIcon />
            <Typography variant="h6" component="span">
              Import Rejected
            </Typography>
          </Box>
          <IconButton
            onClick={() => setImportErrorDialog({ open: false, errors: [], totalErrors: 0, totalRows: 0 })}
            sx={{ color: theme.palette.error.contrastText }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          <Box sx={{ padding: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Import rejected: {importErrorDialog.totalErrors} formatting/validation error(s) detected
              </Typography>
              <Typography variant="body2">
                All rows must be valid. Please fix all errors in your Excel file and try importing again.
              </Typography>
            </Alert>

            <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                label={`Total Rows: ${importErrorDialog.totalRows}`}
                color="default"
                variant="outlined"
              />
              <Chip
                label={`Errors: ${importErrorDialog.totalErrors}`}
                color="error"
                variant="outlined"
              />
              <Chip
                label={`Valid Rows: ${importErrorDialog.totalRows - importErrorDialog.totalErrors}`}
                color="success"
                variant="outlined"
              />
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Error Details:
            </Typography>

            <TableContainer
              sx={{
                maxHeight: 400,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                borderRadius: 1,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: alpha(theme.palette.error.main, 0.1) }}>
                      Row #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: alpha(theme.palette.error.main, 0.1) }}>
                      Unit No
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: alpha(theme.palette.error.main, 0.1) }}>
                      Receipt Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: alpha(theme.palette.error.main, 0.1) }}>
                      Error Message
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importErrorDialog.errors.map((error, index) => (
                    <TableRow
                      key={index}
                      hover
                      sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: alpha(theme.palette.action.hover, 0.02),
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {error.row || error.rowNumber || error.receipt || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {error.unitNo || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {error.receiptDate || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.error.main,
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                          }}
                        >
                          {error.error || "Unknown error"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {importErrorDialog.errors.length > 50 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Showing all {importErrorDialog.errors.length} errors. Scroll to view all.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 2, backgroundColor: alpha(theme.palette.grey[500], 0.05) }}>
          <Button
            onClick={() => setImportErrorDialog({ open: false, errors: [], totalErrors: 0, totalRows: 0 })}
            variant="contained"
            color="primary"
            autoFocus
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Receipts;
