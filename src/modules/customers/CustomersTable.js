// src/components/Customers/CustomersTable.jsx
import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TableSortLabel, Paper, IconButton, Tooltip,
  Avatar, Box, Typography, useTheme, alpha,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Visibility as ViewIcon,
  PersonOutline as CustomerIcon,
} from "@mui/icons-material";

const CustomersTable = ({ customers = [], onEdit, onDelete, onView, sortConfig, onSort }) => {
  const theme = useTheme();
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => setPage(0), [customers]);

  const handleChangePage        = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const getGenderIcon = (gender) => {
    switch ((gender || "").toLowerCase()) {
      case "male":   return <MaleIcon   sx={{ color: theme.palette.info.main }} />;
      case "female": return <FemaleIcon sx={{ color: theme.palette.secondary.main }} />;
      default:       return null;
    }
  };

  // Column IDs match DB column names exactly
  const columns = [
    { id: "MembershipId", label: "MRN",        minWidth: 130, sortable: true  },
    { id: "Name",         label: "Name",        minWidth: 200, sortable: true  },
    { id: "SDW",          label: "S/D/W of",    minWidth: 150, sortable: true  },
    { id: "ContactNo",    label: "Contact No",  minWidth: 140, sortable: true  },
    { id: "CNIC",         label: "CNIC",        minWidth: 150, sortable: true  },
    { id: "Gender",       label: "Gender",      minWidth: 100, sortable: true  },
    { id: "UnitID",       label: "Unit ID",     minWidth: 150, sortable: true  },
    { id: "Address",      label: "Address",     minWidth: 200, sortable: true  },
    { id: "actions",      label: "Actions",     minWidth: 120, align: "right", sortable: false },
  ];

  const safeCustomers    = Array.isArray(customers) ? customers : [];
  const paginatedCustomers = safeCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2 }}>
      <TableContainer sx={{ maxHeight: "70vh", overflowX: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                    backgroundColor: alpha(theme.palette.primary.main, 0.07),
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortConfig?.key === column.id}
                      direction={sortConfig?.key === column.id ? sortConfig.direction : "asc"}
                      onClick={() => onSort && onSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <CustomerIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.4 }} />
                    <Typography variant="body1" color="text.secondary">No customers found</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow
                  key={customer.MembershipId}   // PK is now MembershipId
                  hover
                  sx={{ "&:nth-of-type(even)": { backgroundColor: alpha(theme.palette.action.hover, 0.03) } }}
                >
                  {columns.map((column) => {
                    if (column.id === "actions") {
                      return (
                        <TableCell key="actions" align="right">
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                            {onView && (
                              <Tooltip title="View">
                                <IconButton size="small" onClick={() => onView(customer)} sx={{ color: theme.palette.primary.main }}>
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {onEdit && (
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => onEdit(customer)} sx={{ color: theme.palette.info.main }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {onDelete && (
                              <Tooltip title="Delete">
                                {/* Pass MembershipId (PK) to delete handler */}
                                <IconButton size="small" onClick={() => onDelete(customer.MembershipId)} sx={{ color: theme.palette.error.main }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      );
                    }

                    const value = customer[column.id] ?? "-";

                    if (column.id === "Name") {
                      return (
                        <TableCell key={column.id} sx={{ whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.12),
                              color: theme.palette.primary.main,
                              width: 32, height: 32, fontSize: "0.875rem", fontWeight: 700,
                            }}>
                              {(value || "?").charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">{value}</Typography>
                          </Box>
                        </TableCell>
                      );
                    }

                    if (column.id === "Gender") {
                      return (
                        <TableCell key={column.id} sx={{ whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {getGenderIcon(value)}
                            <Typography variant="body2">{value || "N/A"}</Typography>
                          </Box>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={column.id} align={column.align} sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2">{value}</Typography>
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
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={safeCustomers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      />
    </Paper>
  );
};

export default CustomersTable;