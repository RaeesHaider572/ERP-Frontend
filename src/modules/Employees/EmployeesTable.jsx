import React from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, IconButton, Tooltip,
  Chip, Box, useTheme, alpha
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { formatCurrency, formatDate, getStatusColor } from "../../services/employeeService";

const TABLE_COLS = [
  { id: "EmployeeCode", label: "Employee Code", minWidth: 130 },
  { id: "Name", label: "Name", minWidth: 150 },
  { id: "CNIC", label: "CNIC", minWidth: 130 },
  { id: "Designation", label: "Designation", minWidth: 130 },
  { id: "Department", label: "Department", minWidth: 130 },
  { id: "Email", label: "Email", minWidth: 180 },
  { id: "Phone", label: "Phone", minWidth: 120 },
  { id: "Salary", label: "Salary", minWidth: 120, isCurrency: true },
  { id: "JoiningDate", label: "Joining Date", minWidth: 110, isDate: true },
  { id: "Status", label: "Status", minWidth: 100, isStatus: true },
  { id: "actions", label: "Actions", minWidth: 100, align: "right", sortable: false }
];

function EmployeesTable({ employees, onEdit, onDelete, sortConfig, onSort, pagination, onPageChange, onRowsPerPageChange }) {
  const theme = useTheme();

  const renderCell = (col, employee) => {
    if (col.id === "actions") {
      return (
        <TableCell key="actions" align="right" sx={{ whiteSpace: "nowrap" }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(employee)} sx={{ color: theme.palette.info.main }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(employee.EmployeeCode)} sx={{ color: theme.palette.error.main }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      );
    }

    if (col.id === "Status") {
      const color = getStatusColor(employee.Status);
      return (
        <TableCell key={col.id}>
          <Chip label={employee.Status} size="small" color={color} />
        </TableCell>
      );
    }

    const value = employee[col.id];
    let display = value || "-";
    if (col.isCurrency) display = formatCurrency(value);
    if (col.isDate) display = formatDate(value);

    return (
      <TableCell key={col.id} align={col.align || "left"} sx={{ fontSize: "0.85rem" }}>
        {display}
      </TableCell>
    );
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: "70vh" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {TABLE_COLS.map(col => (
                <TableCell key={col.id} align={col.align || "left"} sx={{
                  fontWeight: 700, backgroundColor: theme.palette.background.paper,
                  whiteSpace: "nowrap", minWidth: col.minWidth
                }}>
                  {col.sortable !== false ? (
                    <TableSortLabel active={sortConfig.key === col.id}
                      direction={sortConfig.key === col.id ? sortConfig.direction : "asc"}
                      onClick={() => onSort(col.id)}>
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLS.length} align="center" sx={{ py: 6 }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography color="text.secondary">No employees found</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.EmployeeCode} hover>
                  {TABLE_COLS.map(col => renderCell(col, employee))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={pagination.limit}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </Paper>
  );
}

export default EmployeesTable;