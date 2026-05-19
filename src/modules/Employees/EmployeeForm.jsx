import React from "react";
import { Grid, TextField, MenuItem, FormControl, InputLabel, Select, Divider, Typography, Box } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { departments, designations, statuses } from "../../services/employeeService";

function EmployeeForm({ form, handleChange, errors, editing }) {
  const genders = ["Male", "Female", "Other"];

  const handleDateChange = (name, value) => {
    handleChange({
      target: {
        name: name,
        value: value ? value.format('YYYY-MM-DD') : ''
      }
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="primary" gutterBottom>Basic Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Full Name *" name="Name" value={form.Name} onChange={handleChange}
                       error={!!errors.Name} helperText={errors.Name} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" name="Email" type="email" value={form.Email} onChange={handleChange}
                       fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone" name="Phone" value={form.Phone} onChange={handleChange}
                       fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker label="Date of Birth" value={form.DateOfBirth ? dayjs(form.DateOfBirth) : null}
                        onChange={(value) => handleDateChange('DateOfBirth', value)}
                        slotProps={{ textField: { size: "small", fullWidth: true } }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select name="Gender" value={form.Gender} label="Gender" onChange={handleChange}>
                <MenuItem value="">Select Gender</MenuItem>
                {genders.map(gender => <MenuItem key={gender} value={gender}>{gender}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" color="primary" gutterBottom>Professional Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select name="Department" value={form.Department} label="Department" onChange={handleChange}>
                <MenuItem value="">Select Department</MenuItem>
                {departments.map(dept => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Designation</InputLabel>
              <Select name="Designation" value={form.Designation} label="Designation" onChange={handleChange}>
                <MenuItem value="">Select Designation</MenuItem>
                {designations.map(des => <MenuItem key={des} value={des}>{des}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Salary" name="Salary" type="number" value={form.Salary} onChange={handleChange}
                       fullWidth size="small" InputProps={{ startAdornment: "Rs." }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker label="Joining Date" value={form.JoiningDate ? dayjs(form.JoiningDate) : null}
                        onChange={(value) => handleDateChange('JoiningDate', value)}
                        slotProps={{ textField: { size: "small", fullWidth: true } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address" name="Address" value={form.Address} onChange={handleChange}
                       fullWidth size="small" multiline rows={2} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select name="Status" value={form.Status} label="Status" onChange={handleChange}>
                {statuses.map(status => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" color="primary" gutterBottom>Device Integration (Biometric)</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Device UID" name="DeviceUid" type="number" value={form.DeviceUid} onChange={handleChange}
                       fullWidth size="small" helperText="User ID from biometric device" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Device Name" name="DeviceName" value={form.DeviceName} onChange={handleChange}
                       fullWidth size="small" helperText="e.g., Oasis Office, Head Office" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Card Number" name="CardNumber" value={form.CardNumber} onChange={handleChange}
                       fullWidth size="small" helperText="RFID card number" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Device Serial Number" name="DeviceSN" value={form.DeviceSN} onChange={handleChange}
                       fullWidth size="small" helperText="Biometric device serial number" />
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}

export default EmployeeForm;