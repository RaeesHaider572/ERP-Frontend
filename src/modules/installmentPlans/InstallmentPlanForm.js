import React from "react";
import {
  Grid,
  TextField,
  Box,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Home as UnitIcon,
  Person as PersonIcon,
  Business as ProjectIcon,
  CalendarToday as DateIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";

const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const InstallmentPlanForm = ({ form, handleChange, errors = {} }) => {
  const theme = useTheme();

  const fields = [
    {
      name: "unit_id",
      label: "Unit ID",
      icon: <UnitIcon />,
      xs: 12,
      sm: 6,
      placeholder: "Enter unit ID (e.g., 1f-08)",
    },
    {
      name: "customer_name",
      label: "Customer Name",
      icon: <PersonIcon />,
      xs: 12,
      sm: 6,
      placeholder: "Enter customer name",
    },
    {
      name: "project",
      label: "Project",
      icon: <ProjectIcon />,
      xs: 12,
      sm: 6,
      placeholder: "Enter project name",
    },
    {
      name: "due_date",
      label: "Due Date",
      type: "date",
      icon: <DateIcon />,
      xs: 12,
      sm: 6,
    },
    {
      name: "inst_no",
      label: "Installment Number",
      type: "number",
      xs: 12,
      sm: 6,
      placeholder: "Enter installment number",
    },
    {
      name: "payment_plan",
      label: "Payment Plan",
      type: "number",
      icon: "Rs.",
      xs: 12,
      sm: 6,
      placeholder: "Enter payment plan amount",
    },
    {
      name: "mapped_receipt",
      label: "Mapped Receipt",
      type: "number",
      icon: "Rs.",
      xs: 12,
      sm: 6,
      placeholder: "Enter mapped receipt amount",
    },
    {
      name: "total_unpaid",
      label: "Total Unpaid",
      type: "number",
      icon: "Rs.",
      xs: 12,
      sm: 6,
      placeholder: "Enter total unpaid amount",
    },
    {
      name: "default_surcharge",
      label: "Default Surcharge",
      type: "number",
      icon: "Rs.",
      xs: 12,
      sm: 6,
      placeholder: "Enter default surcharge amount",
    },
    {
      name: "lps",
      label: "LPS",
      xs: 12,
      sm: 6,
      placeholder: "Enter LPS (default: 0)",
    },
  ];

  return (
    <Grid container spacing={2}>
      {fields.map((field) => (
        <Grid item xs={field.xs} sm={field.sm} key={field.name}>
          <TextField
            fullWidth
            name={field.name}
            label={field.label}
            value={form[field.name] || ""}
            onChange={handleChange}
            type={field.type || "text"}
            required={field.required}
            placeholder={field.placeholder}
            error={!!errors[field.name]}
            helperText={errors[field.name]}
            InputLabelProps={field.type === "date" ? { shrink: true } : {}}
            InputProps={{
              startAdornment: field.icon && (
                <Box sx={{ mr: 1, color: "text.secondary" }}>
                  {field.icon}
                </Box>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: theme.palette.background.paper,
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                },
              },
            }}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default InstallmentPlanForm;

