import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Avatar,
  Chip,
  useTheme,
  alpha,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Edit as EditIcon,
  CalendarToday as DateIcon,
  Person as PersonIcon,
  Home as UnitIcon,
  Business as ProjectIcon,
  AttachMoney as AmountIcon,
  Description as NarrationIcon,
  Note as RemarksIcon,
} from "@mui/icons-material";
import { getReceiptById } from "../../services/receiptService";

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ReceiptDetailView = ({ receipt, open, onClose, onEdit }) => {
  const theme = useTheme();
  const [fullReceipt, setFullReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Use MappingID (row id) when available to get full row from backend
    if (receipt && receipt.MappingID) {
      fetchFullReceipt(receipt.MappingID);
    } else if (receipt) {
      setFullReceipt(receipt);
    }
  }, [open, receipt]);

  const fetchFullReceipt = async (mappingId) => {
    try {
      setLoading(true);
      const response = await getReceiptById(mappingId);
      if (response.data?.status === "success" && response.data.data) {
        setFullReceipt(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching receipt details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!receipt && !fullReceipt) return null;

  const displayReceipt = fullReceipt || receipt;
  const receiptId = displayReceipt.ReceiptID || displayReceipt.receipt_id || displayReceipt.id;
  const voucherNo = displayReceipt.VoucherNo || displayReceipt.voucher_no;
  const receiptNo = voucherNo
    ? voucherNo
    : receiptId && receiptId.length > 8
      ? `REC-${receiptId.substring(0, 8).toUpperCase()}`
      : "N/A";

  const amountValue =
    displayReceipt.TotalAmount ||
    displayReceipt.total_amount ||
    Number(displayReceipt.Amount || displayReceipt.amount || 0) +
      Number(displayReceipt.DefaultSurcharge || displayReceipt.default_surcharge || 0);

  const detailItems = [
    {
      label: "Receipt Date",
      value: formatDate(displayReceipt.ReceiptDate || displayReceipt.receipt_date),
      icon: <DateIcon />,
    },
    {
      label: "Unit No",
      value: displayReceipt.UnitNo || displayReceipt.unit_no || "N/A",
      icon: <UnitIcon />,
    },
    {
      label: "Customer Name",
      value: displayReceipt.CustomerName || displayReceipt.customer_name || "N/A",
      icon: <PersonIcon />,
    },
    {
      label: "Project",
      value: displayReceipt.Project || displayReceipt.project || "N/A",
      icon: <ProjectIcon />,
    },
    {
      label: "Collection By",
      value: displayReceipt.CollectionBy || displayReceipt.collection_by || "N/A",
      icon: <PersonIcon />,
    },
    {
      label: "Source",
      value: displayReceipt.Source || displayReceipt.source || "N/A",
      icon: <ReceiptIcon />,
    },
    {
      label: "Receipt Mode",
      value: displayReceipt.ReceiptMode || displayReceipt.receipt_mode || "N/A",
      icon: <ReceiptIcon />,
    },
    {
      label: "Amount + Surcharge",
      value: formatAmount(amountValue),
      // icon: <AmountIcon />,
    },
    {
      label: "Code",
      value: (() => {
        const codeValue = displayReceipt.Code || displayReceipt.code;
        return (codeValue === 0 || codeValue === "0" || codeValue === null || codeValue === undefined || codeValue === "-") ? "0" : codeValue;
      })(),
      icon: <ReceiptIcon />,
    },
    {
      label: "Receipt Type",
      value: displayReceipt.ReceiptType || displayReceipt.receipt_type || "N/A",
      icon: <ReceiptIcon />,
    },
    {
      label: "Knocking",
      value: displayReceipt.Knocking || displayReceipt.knocking || "N/A",
      icon: <ReceiptIcon />,
    },
    {
      label: "Default Surcharge",
      value: formatAmount(displayReceipt.DefaultSurcharge || displayReceipt.default_surcharge || 0),
      icon: <AmountIcon />,
    },
  ];

  const sectionTwoList = displayReceipt.sectionTwoList || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: theme.palette.primary.main,
              fontSize: "1.5rem",
              fontWeight: 700,
            }}
          >
            <ReceiptIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Receipt Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Receipt No: {receiptNo}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
 
      <DialogContent
        sx={{
          pt: "28px !important", // extra space between header and content
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {detailItems.map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Box sx={{ color: theme.palette.primary.main }}>{item.icon}</Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500, ml: 4 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}

              {(displayReceipt.Narration || displayReceipt.narration) && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <NarrationIcon sx={{ color: theme.palette.primary.main }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Narration
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      {displayReceipt.Narration || displayReceipt.narration}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {(displayReceipt.Remarks || displayReceipt.remarks) && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <RemarksIcon sx={{ color: theme.palette.primary.main }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Remarks
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ ml: 4 }}>
                      {displayReceipt.Remarks || displayReceipt.remarks}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {sectionTwoList.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Receipt Lines
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Receipt Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Knocking</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            Amount
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sectionTwoList.map((line, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              {(() => {
                                const codeValue = line.code;
                                return (codeValue === 0 || codeValue === "0" || codeValue === null || codeValue === undefined || codeValue === "-") ? "0" : codeValue;
                              })()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={line.receipt_type || "-"}
                                size="small"
                                color={line.receipt_type === "INSTALLMENT" ? "primary" : "default"}
                              />
                            </TableCell>
                            <TableCell>{line.knocking || "-"}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 500 }}>
                              {formatAmount(line.amount || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 1,
        }}
      >
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {onEdit && (
          <Button
            onClick={() => {
              onEdit(displayReceipt);
              onClose();
            }}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Edit Receipt
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptDetailView;

