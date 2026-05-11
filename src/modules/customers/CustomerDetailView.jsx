// src/components/Customers/CustomerDetailView.jsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Divider, Avatar, Chip, useTheme, alpha, IconButton } from "@mui/material";
import { Close as CloseIcon, Phone as PhoneIcon, LocationOn as LocationIcon, CreditCard as CNICIcon, Group as SDWIcon, Male as MaleIcon, Female as FemaleIcon, Edit as EditIcon, CalendarToday as DateIcon } from "@mui/icons-material";

const CustomerDetailView = ({ customer, open, onClose, onEdit }) => {
  const theme = useTheme();
  if (!customer) return null;

  const isMale = customer.Gender?.toLowerCase() === "male";

  const detailItems = [
    { label: "Contact No",    value: customer.ContactNo || "N/A", icon: <PhoneIcon /> },
    { label: "CNIC",          value: customer.CNIC      || "N/A", icon: <CNICIcon /> },
    { label: "S/D/W of",      value: customer.SDW       || "N/A", icon: <SDWIcon /> },
    {
      label: "Registered On",
      value: customer.CreatedAt
        ? new Date(customer.CreatedAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
        : "N/A",
      icon: <DateIcon />,
    },
    { label: "Address", value: customer.Address || "N/A", icon: <LocationIcon />, fullWidth: true },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`, borderBottom: `1px solid ${theme.palette.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main, fontSize: "1.5rem", fontWeight: 700 }}>
            {customer.Name?.charAt(0)?.toUpperCase() || "C"}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{customer.Name || "Unnamed Customer"}</Typography>
            <Typography variant="body2" color="text.secondary">MRN: {customer.MembershipId}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              {isMale
                ? <MaleIcon   sx={{ color: theme.palette.info.main }} />
                : customer.Gender ? <FemaleIcon sx={{ color: theme.palette.secondary.main }} /> : null}
              <Chip label={customer.Gender || "Gender N/A"} color={isMale ? "info" : "secondary"} sx={{ fontWeight: 600 }} />
            </Box>
          </Grid>
          <Grid item xs={12}><Divider /></Grid>
          {detailItems.map((item, index) => (
            <Grid item xs={12} sm={item.fullWidth ? 12 : 6} key={index}>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Box sx={{ color: theme.palette.primary.main }}>{item.icon}</Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500, ml: 4 }}>{item.value}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        {onEdit && (
          <Button onClick={() => { onEdit(customer); onClose(); }} variant="contained" startIcon={<EditIcon />} sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
            Edit Customer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CustomerDetailView;