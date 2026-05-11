import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

const formatAmount = (value) =>
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

const generateColumnsFromData = (data) => {
  // Define the exact column order and metadata as requested
  const desiredOrder = [
    "PlanID",
    "UnitID",
    "Project",
    "PlanVoucherID",
    "UnitType",
    "CustomerName",
    "DueDate",
    "DateName",
    "InstNo",
    "PaymentType",
    "PaymentPlan",
    "Discount",
    "ActualPaymentPlan",
    "MappedReceipt",
    "DueNotDue",
    "PPU",
    "Receivables",
    "TotalUnpaid",
    "DefaultSurcharge",
    "LPS",
    "TaxReceived",
    "TaxStatus",
    "TaxAccrued",
    "ApplicableTax_t",
    "ApplicableTaxToday",
    "TaxReceivables",
    "TaxPPU",
  ];

  // Column metadata for labels, alignment and formatting
  const columnMetadata = {
    PlanID: { label: "ID", minWidth: 80, align: "left" },
    UnitID: { label: "Unit ID", minWidth: 120, align: "left" },
    PlanVoucherID: { label: "Plan Voucher ID", minWidth: 140, align: "left" },
    UnitType: { label: "Unit Type", minWidth: 120, align: "left" },
    CustomerName: { label: "Customer", minWidth: 180, align: "left" },
    Project: { label: "Project", minWidth: 120, align: "left" },
    DueDate: { label: "Due Date", minWidth: 120, align: "left", isDate: true },
    DateName: { label: "Date Name", minWidth: 120, align: "left" },
    InstNo: { label: "Inst No", minWidth: 100, align: "left" },
    PaymentType: { label: "Payment Type", minWidth: 120, align: "left" },
    PaymentPlan: { label: "Payment Plan", minWidth: 140, align: "right", isAmount: true },
    Discount: { label: "Discount", minWidth: 120, align: "right", isAmount: true },
    ActualPaymentPlan: { label: "Actual Payment Plan", minWidth: 160, align: "right", isAmount: true },
    MappedReceipt: { label: "Mapped Receipt", minWidth: 140, align: "right", isAmount: true },
    DueNotDue: { label: "Due/Not Due", minWidth: 120, align: "left" },
    PPU: { label: "PPU", minWidth: 140, align: "left" }, // TEXT field: "Paid", "Unpaid", "Partial Payment", "Discrepancy"
    Receivables: { label: "Receivables", minWidth: 140, align: "right", isAmount: true },
    TotalUnpaid: { label: "Total Unpaid", minWidth: 140, align: "right", isAmount: true },
    DefaultSurcharge: { label: "Surcharge", minWidth: 140, align: "right", isAmount: true },
    // LPS represents a monetary surcharge; display it as a 2‑decimal amount.
    LPS: { label: "LPS", minWidth: 120, align: "right", isAmount: true },
    TaxReceived: { label: "Tax Received", minWidth: 140, align: "right", isAmount: true },
    TaxStatus: { label: "Tax Status", minWidth: 120, align: "left" },
    TaxAccrued: { label: "Tax Accrued", minWidth: 140, align: "right", isAmount: true },
    ApplicableTax_t: { label: "Applicable Tax (t)", minWidth: 160, align: "right", isAmount: true },
    ApplicableTaxToday: { label: "Applicable Tax Today", minWidth: 170, align: "right", isAmount: true },
    TaxReceivables: { label: "Tax Receivables", minWidth: 150, align: "right", isAmount: true },
    TaxPPU: { label: "Tax PPU", minWidth: 120, align: "right", isAmount: true },
  };

  // Build columns strictly in the requested order.
  // If some fields are missing in the data, they will still appear with "-" values.
  const columns = desiredOrder.map((key) => {
    const metadata = columnMetadata[key] || {};
    return {
      id: key,
      label: metadata.label || key.replace(/([A-Z])/g, " $1").trim(),
      minWidth: metadata.minWidth || 120,
      align: metadata.align || "left",
      sortable: true,
      isDate: metadata.isDate || false,
      isAmount: metadata.isAmount || false,
      isNumeric: metadata.isNumeric !== undefined ? metadata.isNumeric : false,
    };
  });

  // Add Actions column at the end
  columns.push({
    id: "actions",
    label: "Actions",
    minWidth: 120,
    align: "right",
    sortable: false,
  });

  return columns;
};

const InstallmentPlansTable = ({
  installmentPlans = [],
  onEdit,
  onDelete,
  onView,
  sortConfig,
  onSort,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Dynamically generate columns from data
  const columns = generateColumnsFromData(installmentPlans);

  const safePlans = Array.isArray(installmentPlans) ? installmentPlans : [];

  const sortedPlans = [...safePlans].sort((a, b) => {
    if (!sortConfig?.key) return 0;

    const aValue = a[sortConfig.key] || a[sortConfig.key.toLowerCase()];
    const bValue = b[sortConfig.key] || b[sortConfig.key.toLowerCase()];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedPlans = sortedPlans.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        <Table size="small" stickyHeader>
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
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortConfig?.key === column.id}
                      direction={
                        sortConfig?.key === column.id
                          ? sortConfig.direction
                          : "asc"
                      }
                      onClick={() => onSort && onSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <CalendarIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      No installment plans found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPlans.map((plan) => {
                const planId = plan.PlanID || plan.plan_id || plan.PlanId || plan.InstallmentId || plan.installment_id;

                return (
                  <TableRow
                    key={planId}
                    hover
                    sx={{
                      "&:nth-of-type(even)": {
                        backgroundColor: alpha(theme.palette.action.hover, 0.02),
                      },
                    }}
                  >
                    {columns.map((column) => {
                      if (column.id === "actions") {
                        const unitId = plan.UnitID || plan.unit_id || plan.UnitID || "-";
                        return (
                          <TableCell key={column.id} align={column.align}>
                            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                              {onView && (
                                <Tooltip title="View">
                                  <IconButton
                                    size="small"
                                    onClick={() => onView(plan)}
                                    sx={{ color: theme.palette.primary.main }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {onEdit && (
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => onEdit(plan)}
                                    sx={{ color: theme.palette.info.main }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {onDelete && (
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => onDelete(planId, unitId)}
                                    sx={{ color: theme.palette.error.main }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        );
                      }

                      // Get value from plan (try both camelCase and original case)
                      const value = plan[column.id] !== undefined
                        ? plan[column.id]
                        : plan[column.id.toLowerCase()] !== undefined
                        ? plan[column.id.toLowerCase()]
                        : null;

                      // Format value based on type
                      let displayValue = "-";
                      if (value !== null && value !== undefined && value !== "") {
                        if (column.isDate) {
                          displayValue = formatDate(value);
                        } else if (column.isAmount || (column.isNumeric && typeof value === "number")) {
                          displayValue = formatAmount(value);
                        } else {
                          displayValue = String(value);
                        }
                      } else if (column.id === "LPS") {
                        // LPS field: default to "0.00" when empty/null
                        displayValue = formatAmount(0);
                      }

                      // Determine cell styling
                      const cellSx = {
                        fontWeight: column.isAmount ? 500 : 400,
                        color:
                          column.id === "TotalUnpaid"
                            ? theme.palette.warning.main
                            : column.id === "DefaultSurcharge"
                            ? theme.palette.error.main
                            : "inherit",
                      };

                      return (
                        <TableCell key={column.id} align={column.align} sx={cellSx}>
                          {displayValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sortedPlans.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
};

export default InstallmentPlansTable;

