import React from "react";
import { Grid, Paper, Typography, Box, useTheme, alpha } from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BalanceIcon,
} from "@mui/icons-material";

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const InstallmentPlanStats = ({ installmentPlans = [] }) => {
  const theme = useTheme();
  const safePlans = Array.isArray(installmentPlans) ? installmentPlans : [];

  const stats = {
    total: safePlans.length,
    totalPaymentPlan: safePlans.reduce((sum, p) => sum + Number(p.PaymentPlan || p.payment_plan || 0), 0),
    totalMappedReceipt: safePlans.reduce((sum, p) => sum + Number(p.MappedReceipt || p.mapped_receipt || 0), 0),
    totalUnpaid: safePlans.reduce((sum, p) => sum + Number(p.TotalUnpaid || p.total_unpaid || 0), 0),
    totalSurcharge: safePlans.reduce((sum, p) => sum + Number(p.DefaultSurcharge || p.default_surcharge || 0), 0),
  };

  const statCards = [
    {
      title: "Total Plans",
      value: stats.total,
      icon: <CalendarIcon />,
      color: theme.palette.primary.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
    },
    {
      title: "Total Payment Plan",
      value: formatAmount(stats.totalPaymentPlan),
      icon: <MoneyIcon />,
      color: theme.palette.success.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
    },
    {
      title: "Total Mapped Receipt",
      value: formatAmount(stats.totalMappedReceipt),
      icon: <TrendingUpIcon />,
      color: theme.palette.info.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
    },
    {
      title: "Total Unpaid",
      value: formatAmount(stats.totalUnpaid),
      icon: <BalanceIcon />,
      color: theme.palette.warning.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
    },
    {
      title: "Total Surcharge",
      value: formatAmount(stats.totalSurcharge),
      icon: <MoneyIcon />,
      color: theme.palette.error.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.light, 0.05)} 100%)`,
    },
  ];

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
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
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
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

export default InstallmentPlanStats;

