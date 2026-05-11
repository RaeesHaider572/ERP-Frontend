import React from "react";
import { Grid, Paper, Typography, Box, useTheme, alpha } from "@mui/material";
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

// Use 2 decimal places for surcharge totals to match database precision
const formatSurcharge = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const ReceiptStats = ({ receipts = [] }) => {
  const theme = useTheme();
  const safeReceipts = Array.isArray(receipts) ? receipts : [];

  const stats = {
    total: safeReceipts.length,
    totalAmount: safeReceipts.reduce((sum, r) => sum + Number(r.TotalAmount || r.total_amount || 0), 0),
    totalSurcharge: safeReceipts.reduce(
      (sum, r) => sum + Number(r.DefaultSurcharge || r.default_surcharge || 0),
      0
    ),
    thisMonth: safeReceipts.filter((r) => {
      const receiptDate = r.ReceiptDate || r.receipt_date;
      if (!receiptDate) return false;
      const date = new Date(receiptDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  const statCards = [
    {
      title: "Total Receipts",
      value: stats.total,
      icon: <ReceiptIcon />,
      color: theme.palette.primary.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
    },
    {
      title: "Total Amount",
      value: formatAmount(stats.totalAmount),
      icon: <MoneyIcon />,
      color: theme.palette.success.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
    },
    {
      title: "Total Surcharge",
      value: formatSurcharge(stats.totalSurcharge),
      icon: <TrendingUpIcon />,
      color: theme.palette.warning.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
    },
    {
      title: "This Month",
      value: stats.thisMonth,
      icon: <CalendarIcon />,
      color: theme.palette.info.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
    },
  ];

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: stat.bgGradient,
              border: `1px solid ${alpha(stat.color, 0.2)}`,
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: `0 8px 24px ${alpha(stat.color, 0.2)}`,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                  {stat.title}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(stat.color, 0.1),
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default ReceiptStats;

