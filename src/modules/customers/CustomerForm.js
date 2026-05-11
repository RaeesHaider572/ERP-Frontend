// src/components/Customers/CustomerForm.jsx
import React from "react";
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, Box, useTheme, alpha } from "@mui/material";
import { Person as PersonIcon, Phone as PhoneIcon, CreditCard as CNICIcon, Group as SDWIcon, LocationOn as LocationIcon, Male as MaleIcon, Female as FemaleIcon } from "@mui/icons-material";

// UnitID removed — unit assignment is done from Inventory side
const CustomerForm = ({ form, handleChange, errors = {} }) => {
  const theme = useTheme();

  const fields = [
    { name: "Name",      label: "Full Name",    icon: <PersonIcon />, xs: 12, sm: 6, required: true,  placeholder: "Enter full name" },
    { name: "ContactNo", label: "Contact No",   icon: <PhoneIcon />,  xs: 12, sm: 6, required: true,  placeholder: "e.g. 03001234567" },
    { name: "CNIC",      label: "CNIC",         icon: <CNICIcon />,   xs: 12, sm: 6, required: true,  placeholder: "e.g. 35201-1234567-1" },
    { name: "SDW",       label: "S/D/W of",     icon: <SDWIcon />,    xs: 12, sm: 6, required: false, placeholder: "Son/Daughter/Wife of (optional)" },
    { name: "Gender",    label: "Gender",       type: "select", options: ["Male", "Female", "Other"], icons: { Male: <MaleIcon />, Female: <FemaleIcon /> }, xs: 12, sm: 6, required: false },
    { name: "Address",   label: "Address",      icon: <LocationIcon />, multiline: true, rows: 2, xs: 12, required: false, placeholder: "Enter full address (optional)" },
  ];

  return (
    <Grid container spacing={2}>
      {fields.map((field) => (
        <Grid item xs={field.xs} sm={field.sm} key={field.name}>
          {field.type === "select" ? (
            <FormControl fullWidth error={!!errors[field.name]}>
              <InputLabel>{field.label}</InputLabel>
              <Select name={field.name} value={form[field.name] || ""} onChange={handleChange} label={field.label}>
                <MenuItem value=""><em>Select Gender</em></MenuItem>
                {field.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {field.icons?.[option]}{option}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth name={field.name} label={field.label}
              value={form[field.name] || ""} onChange={handleChange}
              type={field.type || "text"} multiline={field.multiline} rows={field.rows}
              required={field.required} placeholder={field.placeholder}
              error={!!errors[field.name]} helperText={errors[field.name]}
              InputProps={{ startAdornment: field.icon && <Box sx={{ mr: 1, color: "text.secondary", display: "flex", alignItems: "center" }}>{field.icon}</Box> }}
              sx={{ "& .MuiOutlinedInput-root": { backgroundColor: theme.palette.background.paper, "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.02) } } }}
            />
          )}
        </Grid>
      ))}
    </Grid>
  );
};

export default CustomerForm;