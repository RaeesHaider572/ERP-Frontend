import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Box,
  useTheme,
  alpha,
  InputAdornment,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  PlaylistAdd as GenerateIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/authService";
import { getReceiptById, createReceipt, updateReceipt } from "../../services/receiptService";

/* ===============================
   CONSTANTS
================================ */
const RECEIPT_TYPE_INSTALLMENT = "INSTALLMENT";
const RECEIPT_TYPE_TAX = "TAX";

/* ===============================
   FORMAT HELPERS
================================ */
const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumberWithCommas = (value) => {
  const numericString = value.replace(/[^0-9]/g, "");
  if (!numericString) return "";
  const number = Number(numericString);
  return formatAmount(number);
};

const parseFormattedNumber = (value) => {
  const numericString = value.replace(/[^0-9]/g, "");
  return numericString === "" ? 0 : Number(numericString);
};

/* ===============================
   MONEY HELPERS
================================ */
const toCents = (v) => Math.round(Number(v || 0) * 100);
const fromCents = (c) => c / 100;
const clampNonNeg = (n) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/* ===============================
   FIFO ALLOCATION
================================ */
function generateAllocationsFIFO({ totalReceipt, schedule, includeTax, taxRatePercent }) {
  // ✅ Always sort by InstNo ascending so earliest installment fills first
  const sorted = [...schedule].sort((a, b) => Number(a.InstNo) - Number(b.InstNo));

  const taxRate = clampNonNeg(Number(taxRatePercent || 0));
  const taxMultiplier = includeTax ? taxRate / 100 : 0;

  // remainingGross is the total pot — net + tax combined
  let remainingGross = toCents(totalReceipt);

  const allocations = [];

  for (const row of sorted) {
    if (remainingGross <= 0) break;

    const dueNet = Number(row.TotalUnpaid || 0);
    if (dueNet <= 0) continue;

    // How much gross does it take to fully pay this installment's net?
    // net + tax = gross  →  gross = net * (1 + taxRate/100)
    const fullGrossToSettle = Math.round(toCents(dueNet) * (1 + taxMultiplier));

    // Only allocate what's needed to FULLY settle this row, or what's left
    const allocGross = Math.min(remainingGross, fullGrossToSettle);

    if (allocGross > 0) {
      allocations.push({ row, grossCents: allocGross });
      remainingGross -= allocGross;
    }
  }

  return allocations;
}

function buildRows({ allocations, includeTax, taxRatePercent }) {
  const rows = [];
  const taxRate = clampNonNeg(Number(taxRatePercent || 0));

  if (!includeTax || taxRate <= 0) {
    // No tax — simple case, just round each row
    let usedTotal = 0;
    const totalGross = Math.round(
      allocations.reduce((s, a) => s + a.grossCents, 0) / 100
    );

    allocations.forEach(({ row, grossCents }, idx) => {
      const isLast = idx === allocations.length - 1;
      const amount = isLast
        ? totalGross - usedTotal           // last row absorbs rounding remainder
        : Math.round(grossCents / 100);
      usedTotal += amount;
      rows.push({
        code: row.InstNo,
        receipt_type: RECEIPT_TYPE_INSTALLMENT,
        knocking: "Yes",
        amount,
      });
    });

    return rows;
  }

  // With tax — track running net and tax totals separately
  // Total gross is the user-entered amount (exact, no rounding)

  // const totalGrossCents = allocations.reduce((s, a) => s + a.grossCents, 0);
  // const totalTaxCents   = Math.floor((totalGrossCents * taxRate) / (100 + taxRate));
  // const totalNetCents   = totalGrossCents - totalTaxCents;

const totalGrossCents = allocations.reduce((s, a) => s + a.grossCents, 0);
const totalTaxCents   = Math.floor((totalGrossCents * taxRate) / (100 + taxRate));
const totalNetCents   = totalGrossCents - totalTaxCents;

  // Convert totals to whole units — these are the EXACT targets
  // const totalNet = Math.round(totalNetCents / 100);
  // const totalTax = Math.round(totalTaxCents / 100);
const totalGross = Math.round(totalGrossCents / 100);   // exact user input
const totalTax   = Math.round(totalTaxCents / 100);
const totalNet   = totalGross - totalTax; 

  let usedNet = 0;
  let usedTax = 0;

  allocations.forEach(({ row, grossCents }, idx) => {
    const isLast = idx === allocations.length - 1;

    let netAmt, taxAmt;

    if (isLast) {
      // Force last row to make totals balance exactly
      netAmt = totalNet - usedNet;
      taxAmt = totalTax - usedTax;
    } else {
      const taxCents = Math.floor((grossCents * taxRate) / (100 + taxRate));
      const netCents = grossCents - taxCents;
      netAmt = Math.round(netCents / 100);
      taxAmt = Math.round(taxCents / 100);
    }

    usedNet += netAmt;
    usedTax += taxAmt;

    rows.push({
      code: row.InstNo,
      receipt_type: RECEIPT_TYPE_INSTALLMENT,
      knocking: "Yes",
      amount: netAmt,
    });
    rows.push({
      code: row.InstNo,
      receipt_type: RECEIPT_TYPE_TAX,
      knocking: "No",
      amount: taxAmt,
    });
  });

  return rows;
}

/* ===============================
   EMPTY LINE
================================ */
const emptySectionTwo = {
  code: null,
  receipt_type: "",
  knocking: "No",
  amount: 0,
};

/* ===============================
   COMPONENT
================================ */
const ReceiptForm = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [sectionOne, setSectionOne] = useState({
    project: "",
    receipt_voucher_no: "",
    old_voucher_no: "",
    receipt_date: "",
    unit_no: "",
    customer_name: "",
    collection_by: "",
    source: "",
    receipt_mode: "",
    narration: "",
    remarks: "",
  });

  const [sectionTwoList, setSectionTwoList] = useState([{ ...emptySectionTwo }]);
  const [schedule, setSchedule] = useState([]);
  const [totalReceipt, setTotalReceipt] = useState(0);
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [response, setResponse] = useState(null);
  const [lastPayment, setLastPayment] = useState(null);
  const [totalReceived, setTotalReceived] = useState(0);
  const [saleAmount, setSaleAmount] = useState(0);
  const [sftVarified, setSftVarified] = useState(null);
  const [totalDefaultSurcharge, setTotalDefaultSurcharge] = useState(0);

  // ─── NEW: track whether lines have ever been generated/loaded ────────────────
  // This prevents auto-reallocation from wiping a freshly-loaded edit before
  // the user intentionally changes anything.
  const [linesInitialized, setLinesInitialized] = useState(false);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const totalUnpaidAmount = schedule.reduce(
    (sum, row) => sum + Number(row.TotalUnpaid || 0),
    0
  );
  const remainingUnpaid = Math.max(
    totalUnpaidAmount - Number(totalReceipt || 0),
    0
  );
  const totalReceivedPercent = saleAmount > 0
    ? ((totalReceived / saleAmount) * 100).toFixed(2)
    : "0.00";
  const totalUnpaidPercent = saleAmount > 0
    ? ((totalUnpaidAmount / saleAmount) * 100).toFixed(2)
    : "0.00";

  /* -----------------------------
     FETCH RECEIPT DATA (EDIT MODE)
  ----------------------------- */
  useEffect(() => {
    if (!isEditMode || !id) return;
    const fetchReceipt = async () => {
      try {
        setFetching(true);
        const response = await getReceiptById(id);
        if (response.data?.status === "success" && response.data.data) {
          const receipt = response.data.data;
          console.log("Editing receipt (MappingID from backend):", receipt.MappingID || receipt.mapping_id);

          setSectionOne({
            project: receipt.Project || receipt.project || "",
            receipt_voucher_no: receipt.receipt_voucher_no || receipt.voucher_no || "",
            old_voucher_no: receipt.OldVoucherNo || receipt.old_voucher_no || "",
            receipt_date: receipt.ReceiptDate
              ? new Date(receipt.ReceiptDate).toISOString().split('T')[0]
              : receipt.receipt_date || "",
            unit_no: receipt.UnitNo || receipt.unit_no || "",
            customer_name: receipt.CustomerName || receipt.customer_name || "",
            cnic: receipt.CNIC || receipt.cnic || "",
            collection_by: receipt.CollectionBy || receipt.collection_by || "",
            source: receipt.Source || receipt.source || "",
            receipt_mode: receipt.ReceiptMode || receipt.receipt_mode || "",
            narration: receipt.Narration || receipt.narration || "",
            remarks: receipt.Remarks || receipt.remarks || "",
          });

          if (receipt.lines && Array.isArray(receipt.lines) && receipt.lines.length > 0) {
            const mappedLines = receipt.lines.map((line) => ({
              mapping_id: line.MappingID || line.mapping_id || null,
              code: line.Code || line.code || null,
              receipt_type: line.ReceiptType || line.receipt_type || "",
              knocking: line.Knocking || line.knocking || "No",
              amount: Number(line.Amount || line.amount || 0),
            }));
            setSectionTwoList(mappedLines);
            const total = mappedLines.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            setTotalReceipt(total);
          } else if (receipt.sectionTwoList && Array.isArray(receipt.sectionTwoList) && receipt.sectionTwoList.length > 0) {
            const mappedLines = receipt.sectionTwoList.map((line) => ({
              mapping_id: line.mapping_id || line.MappingID || null,
              code: line.code ?? line.Code ?? null,
              receipt_type: line.receipt_type ?? line.ReceiptType ?? "",
              knocking: line.knocking ?? line.Knocking ?? "No",
              amount: Number(line.amount ?? line.Amount ?? 0),
              default_surcharge: Number(line.default_surcharge ?? line.DefaultSurcharge ?? 0),
            }));
            setSectionTwoList(mappedLines);
            const total = mappedLines.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            setTotalReceipt(total);
          } else {
            setSectionTwoList([{ ...emptySectionTwo }]);
            if (receipt.total_amount || receipt.TotalAmount) {
              setTotalReceipt(Number(receipt.total_amount || receipt.TotalAmount || 0));
            }
          }

          // Mark lines as initialized AFTER state is set, so the live effect
          // sees linesInitialized=true on the NEXT render, not the same batch.
          // Using setTimeout(0) ensures React has committed the state above first.
          setTimeout(() => setLinesInitialized(true), 0);
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
        showSnackbar(
          error.response?.data?.message || "Failed to load receipt data",
          "error"
        );
      } finally {
        setFetching(false);
      }
    };
    fetchReceipt();
  }, [id, isEditMode]);

  /* -----------------------------
     AUTO FETCH UNIT INFO
  ----------------------------- */
  useEffect(() => {
    if (!sectionOne.unit_no) return;
    api
      .get("/installment-plan/unit-info", { params: { unitId: sectionOne.unit_no } })
      .then((res) => {
        if (res.data?.status === "success") {
          const info = res.data.data || {};
          setSectionOne((prev) => ({
            ...prev,
            customer_name: info.customer_name || "",
            project: info.project || "",
          }));
        }
      })
      .catch(() => {
        setSectionOne((prev) => ({ ...prev, customer_name: "", project: "" }));
      });
  }, [sectionOne.unit_no]);

  /* -----------------------------
     FETCH UNPAID SCHEDULE
  ----------------------------- */
  useEffect(() => {
    if (!sectionOne.unit_no) return;
    api
      .get("/installment-plan/unpaid-schedule", { params: { unitId: sectionOne.unit_no } })
      .then((res) => {
        if (res.data?.status === "success") setSchedule(res.data.data || []);
      })
      .catch(() => setSchedule([]));
  }, [sectionOne.unit_no]);

  /* -----------------------------
     FETCH LAST PAYMENT
  ----------------------------- */
  useEffect(() => {
    if (!sectionOne.unit_no) { setLastPayment(null); return; }
    api
      .get("/installment-plan/last-payment", { params: { unitId: sectionOne.unit_no } })
      .then((res) => { if (res.data?.status === "success") setLastPayment(res.data.data || null); })
      .catch(() => setLastPayment(null));
  }, [sectionOne.unit_no]);

  /* -----------------------------
     FETCH TOTAL RECEIVED
  ----------------------------- */
  useEffect(() => {
    if (!sectionOne.unit_no) { setTotalReceived(0); return; }
    api
      .get("/installment-plan/total-received", { params: { unitId: sectionOne.unit_no } })
      .then((res) => { if (res.data?.status === "success") setTotalReceived(res.data.data?.totalReceived || 0); })
      .catch(() => setTotalReceived(0));
  }, [sectionOne.unit_no]);

  /* -----------------------------
     FETCH SALE AMOUNT
  ----------------------------- */
  useEffect(() => {
    if (!sectionOne.unit_no) { setSaleAmount(0); return; }
    api
      .get("/installment-plan/sale-amount", { params: { unitId: sectionOne.unit_no } })
      .then((res) => { if (res.data?.status === "success") setSaleAmount(res.data.data?.saleAmount || 0); })
      .catch(() => setSaleAmount(0));
  }, [sectionOne.unit_no]);

  /* -----------------------------
     FETCH SFT VERIFIED
  ----------------------------- */
  useEffect(() => {
    if (!sectionOne.unit_no) { setSftVarified(null); return; }
    api
      .get("/installment-plan/sft-verified", { params: { unitId: sectionOne.unit_no } })
      .then((res) => {
        if (res.data?.status === "success") {
          const sftValue = res.data.data?.sftVarified;
          setSftVarified(sftValue !== null && sftValue !== undefined ? sftValue : null);
        }
      })
      .catch(() => setSftVarified(null));
  }, [sectionOne.unit_no]);

  /* -----------------------------
     FETCH TOTAL DEFAULT SURCHARGE
  ----------------------------- */
  useEffect(() => {
    if (!sectionOne.unit_no) { setTotalDefaultSurcharge(0); return; }
    api
      .get("/installment-plan/total-default-surcharge", { params: { unitId: sectionOne.unit_no } })
      .then((res) => { if (res.data?.status === "success") setTotalDefaultSurcharge(res.data.data?.totalDefaultSurcharge || 0); })
      .catch(() => setTotalDefaultSurcharge(0));
  }, [sectionOne.unit_no]);

  /* ═══════════════════════════════════════════════════════════════════════════
     ✅ FIX — LIVE RE-ALLOCATION
     Strategy differs by mode:

     CREATE MODE  → re-run FIFO against the unpaid schedule (needs schedule loaded)
     EDIT MODE    → redistribute the new totalReceipt proportionally across the
                    already-loaded rows (no schedule needed, preserves mapping_ids,
                    preserves receipt_type / knocking / code on every row)

     Triggers whenever: totalReceipt, taxRate, or includeTax change AND
     linesInitialized is true (set after first Generate or after edit data loads).
  ═══════════════════════════════════════════════════════════════════════════ */

  // Keep a stable ref to sectionTwoList so we can read it inside the effect
  // without adding it to the dependency array (which would cause infinite loops).
  const sectionTwoListRef = useRef(sectionTwoList);
  useEffect(() => { sectionTwoListRef.current = sectionTwoList; }, [sectionTwoList]);

  useEffect(() => {
    if (!linesInitialized) return;
    if (totalReceipt <= 0) return;

    // ── EDIT MODE: proportional redistribution across existing rows ──────────
    if (isEditMode) {
      const currentRows = sectionTwoListRef.current;
      if (!currentRows || currentRows.length === 0) return;

      // Separate INSTALLMENT rows from TAX rows
      const installmentRows = currentRows.filter(
        (r) => r.receipt_type === RECEIPT_TYPE_INSTALLMENT
      );
      const taxRows = currentRows.filter(
        (r) => r.receipt_type === RECEIPT_TYPE_TAX
      );

      // Total cents to distribute
      let remainingCents = Math.round(totalReceipt * 100);

      let updatedRows;

      if (!includeTax || taxRate <= 0) {
        // ── No tax: distribute totalReceipt across INSTALLMENT rows only ──────
        // Each row gets a share proportional to its original amount.
        // If all original amounts are 0, split equally.
        const origInstTotal = installmentRows.reduce(
          (s, r) => s + Number(r.amount || 0), 0
        );

        const newInstRows = installmentRows.map((row, idx) => {
          let alloc;
          if (idx === installmentRows.length - 1) {
            // Last row gets the remainder to avoid rounding drift
            alloc = Math.floor(remainingCents / 100);
          } else if (origInstTotal > 0) {
            alloc = Math.round(
              (Number(row.amount || 0) / origInstTotal) * totalReceipt
            );
          } else {
            alloc = Math.round(totalReceipt / installmentRows.length);
          }
          remainingCents -= Math.round(alloc * 100);
          return { ...row, amount: alloc };
        });

        // Drop old TAX rows when tax is disabled
        updatedRows = newInstRows;

      } else {
        // ── With tax: gross = totalReceipt, split into net + tax per row ──────
        const taxRateDecimal = taxRate / 100;

        // How many installment rows do we have?
        // Keep the same count; if there were no TAX rows before, create them.
        const origInstTotal = installmentRows.reduce(
          (s, r) => s + Number(r.amount || 0), 0
        );

        updatedRows = [];
        let usedGross = 0;

        installmentRows.forEach((instRow, idx) => {
          // Proportional gross for this row
          let rowGross;
          if (idx === installmentRows.length - 1) {
            rowGross = totalReceipt - usedGross; // last gets remainder
          } else if (origInstTotal > 0) {
            rowGross = Math.round(
              (Number(instRow.amount || 0) / origInstTotal) * totalReceipt
            );
          } else {
            rowGross = Math.round(totalReceipt / installmentRows.length);
          }
          usedGross += rowGross;

          const taxAmt  = Math.floor(rowGross * taxRateDecimal);
          const netAmt  = rowGross - taxAmt;

          // Find the matching TAX row by index (same position as instRow)
          const matchingTaxRow = taxRows[idx] || {
            code:         instRow.code,
            receipt_type: RECEIPT_TYPE_TAX,
            knocking:     "No",
            mapping_id:   undefined,
          };

          updatedRows.push({ ...instRow,       amount: netAmt });
          updatedRows.push({ ...matchingTaxRow, amount: taxAmt });
        });
      }

      setSectionTwoList(updatedRows);
      return;
    }

    // ── CREATE MODE: full FIFO re-allocation against unpaid schedule ─────────
    if (schedule.length === 0) return;
    if (includeTax && (!taxRate || taxRate <= 0)) return;

    const allocations = generateAllocationsFIFO({
      totalReceipt,
      schedule,
      includeTax,
      taxRatePercent: taxRate,
    });

    const newRows = buildRows({ allocations, includeTax, taxRatePercent: taxRate });
    setSectionTwoList(newRows);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalReceipt, taxRate, includeTax, linesInitialized]);
  // NOTE: sectionTwoList deliberately excluded — reading via ref to avoid loop
  // NOTE: schedule deliberately excluded from edit-mode path (not needed there)

  /* -----------------------------
     VALIDATION
  ----------------------------- */
  const validateForm = () => {
    const newErrors = {};
    if (!sectionOne.unit_no?.trim()) newErrors.unit_no = "Unit No is required";
    if (!sectionOne.receipt_date?.trim()) newErrors.receipt_date = "Receipt Date is required";
    if (!sectionOne.collection_by?.trim()) newErrors.collection_by = "Collection By is required";
    if (!sectionOne.source?.trim()) newErrors.source = "Source is required";
    if (!sectionOne.receipt_mode?.trim()) newErrors.receipt_mode = "Receipt Mode is required";
    if (totalReceipt <= 0) newErrors.totalReceipt = "Total Receipt must be greater than 0";
    if (includeTax && (!taxRate || taxRate <= 0)) newErrors.taxRate = "Tax Rate is required when Include Tax is checked";
    if (sectionTwoList.length === 0 || sectionTwoList.every((row) => !row.amount || row.amount === 0)) {
      newErrors.sectionTwoList = "Please generate receipt lines before submitting";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGenerate = () => {
    const newErrors = {};
    if (!sectionOne.unit_no?.trim()) newErrors.unit_no = "Unit No is required";
    if (totalReceipt <= 0) newErrors.totalReceipt = "Total Receipt must be greater than 0";
    if (includeTax && (!taxRate || taxRate <= 0)) newErrors.taxRate = "Tax Rate is required when Include Tax is checked";
    if (schedule.length === 0) newErrors.schedule = "No unpaid schedule found for this unit";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* -----------------------------
     MANUAL GENERATE (Generate Lines button)
  ----------------------------- */
  const handleGenerate = () => {
    if (!validateGenerate()) {
      showSnackbar("Please fix validation errors before generating lines", "error");
      return;
    }

    const allocations = generateAllocationsFIFO({
      totalReceipt,
      schedule,
      includeTax,
      taxRatePercent: taxRate,
    });

    let rows = buildRows({
      allocations,
      includeTax,
      taxRatePercent: taxRate,
    });

    if (isEditMode) {
      const existingMappingIds = sectionTwoList
        .map((line) => line.mapping_id)
        .filter((v) => v !== null && v !== undefined);

      console.log("Generate lines in edit mode. Existing MappingIDs:", existingMappingIds, "New rows:", rows);

      if (existingMappingIds.length > 0) {
        if (existingMappingIds.length !== rows.length) {
          showSnackbar(
            "Cannot change number of receipt lines in edit mode because MappingID is fixed. Please keep the same line count.",
            "error"
          );
          return;
        }
        rows = rows.map((row, index) => ({
          ...row,
          mapping_id: existingMappingIds[index],
        }));
      }
    }

    setSectionTwoList(replaceExisting ? rows : [...sectionTwoList, ...rows]);

    // Mark as initialized so live-reallocation stays active going forward
    setLinesInitialized(true);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.totalReceipt;
      delete newErrors.taxRate;
      delete newErrors.schedule;
      return newErrors;
    });

    showSnackbar(`✅ ${rows.length} receipt rows generated successfully`, "success");
  };

  /* -----------------------------
     SUBMIT HANDLER
  ----------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showSnackbar("Please fix validation errors before submitting", "error");
      return;
    }
    setLoading(true);
    try {
      const { entry_date, ...sectionOneWithoutEntryDate } = sectionOne;
      const payload = { sectionOne: sectionOneWithoutEntryDate, sectionTwoList };

      console.log(
        isEditMode ? "Updating receipt with MappingID (route id):" : "Creating new receipt. Route id:",
        id,
        "Payload first line mapping_id:",
        Array.isArray(sectionTwoList) && sectionTwoList.length > 0 ? sectionTwoList[0].mapping_id : null
      );

      if (isEditMode) {
        await updateReceipt(id, payload);
        showSnackbar("✅ Receipt updated successfully", "success");
        setTimeout(() => navigate("/receipts"), 1500);
      } else {
        const res = await createReceipt(payload);
        setResponse(res.data);
        showSnackbar("✅ Receipt created successfully", "success");
        setTimeout(() => {
          setSectionOne({
            project: "", receipt_voucher_no: "", old_voucher_no: "", receipt_date: "",
            unit_no: "", customer_name: "", collection_by: "", source: "",
            receipt_mode: "", narration: "", remarks: "",
          });
          setSectionTwoList([{ ...emptySectionTwo }]);
          setTotalReceipt(0);
          setIncludeTax(false);
          setTaxRate(0);
          setLinesInitialized(false);
          setErrors({});
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error saving receipt";
      showSnackbar(`❌ ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFieldChange = (field, value) => {
    setSectionOne((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  /* -----------------------------
     RENDER
  ----------------------------- */
  if (fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, sm: 3, md: 0 }, px: { xs: 2, sm: 3, md: 0 } }}>
      {/* Breadcrumb */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 1, "& .MuiBreadcrumbs-separator": { color: theme.palette.text.secondary } }}
        >
          <Link
            component="button" underline="hover" color="inherit"
            onClick={() => navigate("/")}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover": { color: theme.palette.primary.main }, border: "none", background: "none", padding: 0, font: "inherit" }}
          >
            <HomeIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2">Home</Typography>
          </Link>
          <Link
            component="button" underline="hover" color="inherit"
            onClick={() => navigate("/receipts")}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover": { color: theme.palette.primary.main }, border: "none", background: "none", padding: 0, font: "inherit" }}
          >
            <ReceiptIcon sx={{ fontSize: 20 }} />
            <Typography variant="body2">Receipts</Typography>
          </Link>
          <Typography variant="body2" color="text.primary" sx={{ display: "flex", alignItems: "center", fontWeight: 600 }}>
            {isEditMode ? "Edit Receipt" : "Add Receipt"}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <ReceiptIcon sx={{ fontSize: 36, color: theme.palette.primary.main }} />
        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
          {isEditMode ? "Edit Receipt" : "Create Receipt"}
        </Typography>
      </Stack>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3} sx={{ alignItems: "flex-start", flexWrap: { xs: "wrap", md: "nowrap" } }}>
          {/* ── Left Column (70%) ── */}
          <Grid item xs={12} md={8} lg={8} sx={{ minWidth: 0, width: { md: "70%" } }}>
            <Grid container spacing={3}>

              {/* Receipt Information */}
              <Grid item xs={12} sx={{ width: "100%" }}>
                <Card elevation={2} sx={{ width: "100%", borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.3s ease", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }}>
                  <CardHeader
                    title={<Stack direction="row" alignItems="center" spacing={1}><ReceiptIcon color="primary" /><Typography variant="h6" sx={{ fontWeight: 600 }}>Receipt Information</Typography></Stack>}
                    sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}
                  />
                  <CardContent sx={{ pt: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Unit No" value={sectionOne.unit_no} onChange={(e) => handleFieldChange("unit_no", e.target.value)} required error={!!errors.unit_no} helperText={errors.unit_no}
                          InputProps={{ startAdornment: <InputAdornment position="start"><InfoIcon fontSize="small" color="action" /></InputAdornment> }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Receipt Date" type="date" value={sectionOne.receipt_date} onChange={(e) => handleFieldChange("receipt_date", e.target.value)} required error={!!errors.receipt_date} helperText={errors.receipt_date} InputLabelProps={{ shrink: true }} />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Old Voucher No" value={sectionOne.old_voucher_no} onChange={(e) => handleFieldChange("old_voucher_no", e.target.value)} placeholder="Enter old voucher number (if applicable)" />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Collection By" value={sectionOne.collection_by} onChange={(e) => handleFieldChange("collection_by", e.target.value)} required error={!!errors.collection_by} helperText={errors.collection_by} />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Source" value={sectionOne.source} onChange={(e) => handleFieldChange("source", e.target.value)} required error={!!errors.source} helperText={errors.source} />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Receipt Mode" value={sectionOne.receipt_mode} onChange={(e) => handleFieldChange("receipt_mode", e.target.value)} required error={!!errors.receipt_mode} helperText={errors.receipt_mode} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Narration" value={sectionOne.narration} onChange={(e) => handleFieldChange("narration", e.target.value)} multiline rows={2} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Remarks" value={sectionOne.remarks} onChange={(e) => handleFieldChange("remarks", e.target.value)} multiline rows={2} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Customer Information */}
              <Grid item xs={12} sx={{ width: "100%" }}>
                <Card elevation={2} sx={{ width: "100%", borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.3s ease", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }}>
                  <CardHeader
                    title={<Stack direction="row" alignItems="center" spacing={1}><PersonIcon color="primary" /><Typography variant="h6" sx={{ fontWeight: 600 }}>Customer Information</Typography></Stack>}
                    sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}
                  />
                  <CardContent sx={{ pt: 3 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Customer Name" value={sectionOne.customer_name} InputProps={{ readOnly: true }} variant="filled" />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Project" value={sectionOne.project} InputProps={{ readOnly: true }} variant="filled" />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* ── Amount Allocation ── */}
              <Grid item xs={12} sx={{ width: "100%" }}>
                <Card elevation={2} sx={{ width: "100%", borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.3s ease", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }}>
                  <CardHeader
                    title={<Stack direction="row" alignItems="center" spacing={1}><Typography variant="h6" sx={{ fontWeight: 600 }}>Amount Allocation</Typography></Stack>}
                    sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}
                  />
                  <CardContent sx={{ pt: 3 }}>
                    <Grid container spacing={3} alignItems="flex-end">
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Total Receipt"
                          value={formatAmount(totalReceipt)}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === "") {
                              setTotalReceipt(0);
                              if (errors.totalReceipt) setErrors((prev) => { const e = { ...prev }; delete e.totalReceipt; return e; });
                              return;
                            }
                            const numericValue = parseFormattedNumber(inputValue);
                            if (!isNaN(numericValue) && numericValue >= 0) {
                              setTotalReceipt(numericValue);
                              // ✅ Mark lines as initialized so live-reallocation triggers
                              if (!linesInitialized && numericValue > 0) setLinesInitialized(true);
                              if (errors.totalReceipt) setErrors((prev) => { const e = { ...prev }; delete e.totalReceipt; return e; });
                            }
                          }}
                          onBlur={(e) => {
                            const numericValue = parseFormattedNumber(e.target.value);
                            if (!isNaN(numericValue) && numericValue >= 0) setTotalReceipt(numericValue);
                          }}
                          required
                          error={!!errors.totalReceipt}
                          helperText={
                            errors.totalReceipt ||
                            (linesInitialized && totalReceipt > 0
                              ? "✓ Allocation rows update automatically"
                              : "Enter amount then click Generate Lines")
                          }
                          inputProps={{ inputMode: "numeric", pattern: "[0-9,]*" }}
                        />
                        <Stack spacing={1} sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total Unpaid:{" "}
                            <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                              {formatAmount(totalUnpaidAmount)}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Remaining Unpaid After Receipt:{" "}
                            <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                              {formatAmount(remainingUnpaid)}
                            </Typography>
                          </Typography>
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={includeTax}
                              onChange={(e) => {
                                setIncludeTax(e.target.checked);
                                if (!e.target.checked) {
                                  setTaxRate(0);
                                  setErrors((prev) => { const er = { ...prev }; delete er.taxRate; return er; });
                                }
                              }}
                            />
                          }
                          label="Include Tax"
                        />
                      </Grid>

                      {includeTax && (
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            label="Tax %"
                            type="number"
                            value={taxRate}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              setTaxRate(value);
                              if (errors.taxRate) setErrors((prev) => { const er = { ...prev }; delete er.taxRate; return er; });
                            }}
                            required={includeTax}
                            error={!!errors.taxRate}
                            helperText={errors.taxRate}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                      )}

                      <Grid item xs={12} md={3}>
                        <FormControlLabel
                          control={<Checkbox checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} />}
                          label="Replace Existing Lines"
                        />
                      </Grid>

                      {errors.schedule && (
                        <Grid item xs={12}>
                          <Alert severity="error">{errors.schedule}</Alert>
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <Stack direction="row" justifyContent="flex-end" spacing={2}>
                          <Button
                            variant="outlined"
                            startIcon={<GenerateIcon />}
                            onClick={handleGenerate}
                            size="large"
                            sx={{ minWidth: 180, borderRadius: 2 }}
                          >
                            Generate Lines
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* ── Receipt Allocation (live table) ── */}
              <Grid item xs={12} sx={{ width: "100%" }}>
                <Card elevation={2} sx={{ width: "100%", borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.3s ease", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }}>
                  <CardHeader
                    title={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ReceiptIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Receipt Allocation</Typography>
                        {sectionTwoList.length > 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            ({sectionTwoList.length} line{sectionTwoList.length !== 1 ? "s" : ""})
                          </Typography>
                        )}
                        {/* ✅ Live indicator */}
                        {linesInitialized && totalReceipt > 0 && (
                          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main", animation: "pulse 2s infinite", "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                              Live
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    }
                    sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}
                  />
                  <CardContent sx={{ pt: 3 }}>
                    {errors.sectionTwoList && (
                      <Alert severity="error" sx={{ mb: 2 }}>{errors.sectionTwoList}</Alert>
                    )}
                    {sectionTwoList.length > 0 && sectionTwoList.some((r) => r.amount > 0) ? (
                      <>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Receipt Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Knocking</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {sectionTwoList.map((row, index) => (
                                <TableRow key={index} hover sx={{ "&:nth-of-type(even)": { backgroundColor: alpha(theme.palette.action.hover, 0.05) } }}>
                                  <TableCell>
                                    {(row.code === 0 || row.code === "0" || row.code === null || row.code === undefined || row.code === "-") ? "0" : row.code}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: row.receipt_type === RECEIPT_TYPE_INSTALLMENT ? 600 : 400, color: row.receipt_type === RECEIPT_TYPE_INSTALLMENT ? theme.palette.primary.main : theme.palette.text.secondary }}>
                                      {row.receipt_type || "-"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{row.knocking || "-"}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                                    {row.amount ? formatAmount(row.amount) : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {/* ✅ Total row */}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5, pr: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total Allocated:{" "}
                            <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                              {formatAmount(sectionTwoList.reduce((s, r) => s + Number(r.amount || 0), 0))}
                            </Typography>
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Alert severity="info">
                        No receipt lines generated yet. Fill in the amount and click "Generate Lines", or simply type the amount — rows update automatically once initialized.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Actions */}
              <Grid item xs={12} sx={{ width: "100%" }}>
                <Card elevation={2} sx={{ width: "100%", borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "box-shadow 0.3s ease", "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="outlined" size="large"
                        onClick={() => {
                          setSectionOne({ project: "", receipt_voucher_no: "", receipt_date: "", unit_no: "", customer_name: "", collection_by: "", source: "", receipt_mode: "", narration: "", remarks: "" });
                          setSectionTwoList([{ ...emptySectionTwo }]);
                          setTotalReceipt(0);
                          setIncludeTax(false);
                          setTaxRate(0);
                          setLinesInitialized(false);
                          setErrors({});
                        }}
                        sx={{ minWidth: 120, borderRadius: 2 }}
                      >
                        Reset
                      </Button>
                      <Button
                        type="submit" variant="contained" size="large" disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{ minWidth: 180, borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, boxShadow: "0 4px 12px rgba(99,102,241,0.3)", "&:hover": { boxShadow: "0 6px 20px rgba(99,102,241,0.4)" } }}
                      >
                        {loading ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Receipt" : "Submit Receipt")}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* ── Right Sidebar (30%) ── */}
          <Grid item xs={12} md={4} lg={4} sx={{ display: "flex", flexDirection: "column", minWidth: 0, width: { md: "30%" }, pl: { md: 2 } }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Card elevation={4} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`, position: { md: "sticky" }, top: { md: 20 }, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)` }}>
                <CardHeader
                  title={<Stack direction="row" alignItems="center" spacing={1}><InfoIcon color="primary" /><Typography variant="h6" sx={{ fontWeight: 600 }}>Unit Information</Typography></Stack>}
                  sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05), borderBottom: `1px solid ${theme.palette.divider}` }}
                />
                <CardContent sx={{ pt: 2.5, px: { xs: 2, sm: 2.5, md: 2 }, pb: 2.5 }}>
                  <Stack spacing={2.5}>
                    <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.08), border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <Stack spacing={1.5}>
                        {[["Unit No", sectionOne.unit_no], ["Customer Name", sectionOne.customer_name], ["Project Name", sectionOne.project]].map(([label, val]) => (
                          <Box key={label}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>{label}</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: "0.95rem", sm: "1rem" }, color: theme.palette.text.primary }}>{val || "-"}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                    <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }} />
                    <Grid container spacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                      {[
                        { label: "Sale Amount", val: formatAmount(saleAmount), color: "info" },
                        { label: "Total Received", val: formatAmount(totalReceived), color: "success" },
                        { label: "Total Unpaid", val: formatAmount(totalUnpaidAmount), color: "warning" },
                        { label: "Unpaid Installments", val: schedule.length, color: "secondary" },
                        { label: "Received %", val: `${totalReceivedPercent}%`, color: "success" },
                        { label: "Unpaid %", val: `${totalUnpaidPercent}%`, color: "error" },
                        { label: "SFT Verified", val: sftVarified !== null ? sftVarified.toFixed(2) : "N/A", color: "primary" },
                        { label: "Total Surcharge", val: new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(totalDefaultSurcharge || 0)), color: "warning" },
                      ].map(({ label, val, color }) => (
                        <Grid item size={6} key={label} sx={{ display: "flex" }}>
                          <Box sx={{ p: { xs: 1.75, sm: 2 }, borderRadius: 2.5, backgroundColor: alpha(theme.palette[color].main, 0.08), border: `2px solid ${alpha(theme.palette[color].main, 0.25)}`, width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.25s ease", "&:hover": { backgroundColor: alpha(theme.palette[color].main, 0.12), borderColor: alpha(theme.palette[color].main, 0.4), transform: "translateY(-1px)" } }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500, fontSize: { xs: "0.7rem", sm: "0.75rem" }, lineHeight: 1.2 }}>{label}</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette[color].main, fontSize: { xs: "1rem", sm: "1.15rem" }, lineHeight: 1.2 }}>{val}</Typography>
                          </Box>
                        </Grid>
                      ))}
                      {/* Last Payment — special because it has two lines */}
                      <Grid item size={6} sx={{ display: "flex" }}>
                        <Box sx={{ p: { xs: 1.75, sm: 2 }, borderRadius: 2.5, backgroundColor: alpha(theme.palette.success.main, 0.08), border: `2px solid ${alpha(theme.palette.success.main, 0.25)}`, width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.25s ease", "&:hover": { backgroundColor: alpha(theme.palette.success.main, 0.12), borderColor: alpha(theme.palette.success.main, 0.4), transform: "translateY(-1px)" } }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500, fontSize: { xs: "0.7rem", sm: "0.75rem" }, lineHeight: 1.2 }}>Last Payment</Typography>
                          {lastPayment ? (
                            <>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main, fontSize: { xs: "1rem", sm: "1.15rem" }, lineHeight: 1.2 }}>{formatAmount(lastPayment.lastPaymentAmount)}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block", fontWeight: 500, fontSize: { xs: "0.65rem", sm: "0.7rem" } }}>
                                {lastPayment.lastPaymentDate ? new Date(lastPayment.lastPaymentDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: { xs: "1rem", sm: "1.15rem" }, lineHeight: 1.2 }}>No payment yet</Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    {Object.keys(errors).length > 0 && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Validation Errors</Typography>
                        <Typography variant="caption">Please fix {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? "s" : ""} before submitting</Typography>
                      </Alert>
                    )}
                    {includeTax && taxRate > 0 && (
                      <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                        <Typography variant="body2" color="text.secondary">Tax Rate: <strong>{taxRate}%</strong></Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default ReceiptForm;