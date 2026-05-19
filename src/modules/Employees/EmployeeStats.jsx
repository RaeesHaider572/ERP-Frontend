import React from "react";
import { Grid, Card, CardContent, Typography, Box, Avatar, useTheme, alpha } from "@mui/material";
import { People, Business, Devices, CheckCircle, TrendingUp } from "@mui/icons-material";

function StatCard({ title, value, icon, color }) {
  const theme = useTheme();
  return (
    <Card sx={{ 
      background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].light, 0.05)} 100%)`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: alpha(theme.palette[color].main, 0.2), color: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

function EmployeeStats({ stats }) {
  if (!stats) return null;
  
  const { overview, departmentStats, deviceStats } = stats;
  
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Total Employees" value={overview.TotalEmployees || 0} icon={<People sx={{ fontSize: 32 }} />} color="primary" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Active Employees" value={overview.ActiveEmployees || 0} icon={<CheckCircle sx={{ fontSize: 32 }} />} color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Departments" value={overview.TotalDepartments || 0} icon={<Business sx={{ fontSize: 32 }} />} color="info" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Linked to Device" value={overview.LinkedToDevice || 0} icon={<Devices sx={{ fontSize: 32 }} />} color="warning" />
      </Grid>
      
      {/* Department Distribution */}
      {departmentStats && departmentStats.length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Department Distribution</Typography>
              <Grid container spacing={2}>
                {departmentStats.slice(0, 4).map((dept, idx) => (
                  <Grid item xs={12} sm={6} md={3} key={idx}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">{dept.Department}</Typography>
                      <Typography variant="h5" fontWeight="bold">{dept.Count} employees</Typography>
                      <Typography variant="caption" color="primary">
                        Avg Salary: Rs. {Math.round(dept.AvgSalary || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}

export default EmployeeStats;