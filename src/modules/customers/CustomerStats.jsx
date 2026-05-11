import React from "react";
import { Grid, Paper, Typography, Box, useTheme, alpha } from "@mui/material";
import {
  People as PeopleIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  HelpOutline as UnknownIcon,
} from "@mui/icons-material";

// Stats derived ONLY from actual DB columns: Gender
const CustomerStats = ({ customers = [] }) => {
  const theme = useTheme();
  const safe = Array.isArray(customers) ? customers : [];

  const total   = safe.length;
  const male    = safe.filter((c) => c?.Gender?.toLowerCase() === "male").length;
  const female  = safe.filter((c) => c?.Gender?.toLowerCase() === "female").length;
  const unknown = total - male - female;

  const statCards = [
    {
      title: "Total Patients",
      value: total,
      icon: <PeopleIcon />,
      color: theme.palette.primary.main,
      bg: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
    },
    {
      title: "Male",
      value: male,
      icon: <MaleIcon />,
      color: theme.palette.info.main,
      bg: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
    },
    {
      title: "Female",
      value: female,
      icon: <FemaleIcon />,
      color: theme.palette.secondary.main,
      bg: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
    },
    {
      title: "Gender N/A",
      value: unknown,
      icon: <UnknownIcon />,
      color: theme.palette.warning.main,
      bg: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
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
              background: stat.bg,
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
                <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: alpha(stat.color, 0.1), color: stat.color }}>
                {stat.icon}
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default CustomerStats;