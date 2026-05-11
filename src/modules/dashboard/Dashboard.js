import React from "react";
import { Grid, Paper, Typography } from "@mui/material";

export default function Dashboard() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Users</Typography>
          <Typography variant="h4">14k</Typography>
          <Typography variant="body2">+25% last 30 days</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Conversions</Typography>
          <Typography variant="h4">325</Typography>
          <Typography variant="body2">-25% last 30 days</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Event Count</Typography>
          <Typography variant="h4">200k</Typography>
          <Typography variant="body2">+5% last 30 days</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
