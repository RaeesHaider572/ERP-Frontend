// src/components/Dashboard/DashboardContent.jsx
import React from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  AttachMoney,
  BarChart,
  EventNote,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DashboardContent = () => {
  const theme = useTheme();
  const { user, getRoleDisplay, isEmployee, isCustodian, isHR } = useAuth();

  // Role-based stats
  const getStats = () => {
    const baseStats = [
      { title: 'Total Revenue', value: '$54,239', change: '+12.5%', icon: <AttachMoney />, color: '#10b981' },
      { title: 'New Orders', value: '1,245', change: '+8.2%', icon: <ShoppingCart />, color: '#6366f1' },
    ];

    if (isEmployee()) {
      return [
        { title: 'My Leave Balance', value: '15 days', change: 'Annual', icon: <EventNote />, color: '#10b981' },
        { title: 'Pending Requests', value: '2', change: 'Awaiting approval', icon: <CalendarToday />, color: '#f59e0b' },
        ...baseStats.slice(1),
      ];
    }

    if (isCustodian() || isHR()) {
      return [
        { title: 'Team Members', value: user?.teamMembers?.length || 0, change: 'Active', icon: <People />, color: '#6366f1' },
        { title: 'Pending Requests', value: '8', change: 'Team pending', icon: <CalendarToday />, color: '#f59e0b' },
        ...baseStats,
      ];
    }

    return baseStats;
  };

  const stats = getStats();

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome back, {user?.Name || 'User'}! 👋
        </Typography>
        
        {/* Role and Department Info - Fixed: Chip outside of Typography */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="textSecondary" component="span">
            Role:
          </Typography>
          <Chip 
            label={getRoleDisplay()} 
            size="small" 
            color="primary" 
            sx={{ fontWeight: 500 }}
          />
          {user?.Department && (
            <>
              <Typography variant="body2" color="textSecondary" component="span">
                •
              </Typography>
              <Typography variant="body2" color="textSecondary" component="span">
                Department: {user.Department}
              </Typography>
            </>
          )}
          {user?.EmployeeCode && (
            <>
              <Typography variant="body2" color="textSecondary" component="span">
                •
              </Typography>
              <Typography variant="body2" color="textSecondary" component="span">
                ID: {user.EmployeeCode}
              </Typography>
            </>
          )}
        </Box>
      </Box>
      
      {/* Stats Grid - Using regular Grid with old API (warnings are harmless) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const StatCard = ({ title, value, change, icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      height: '100%',
      borderRadius: 3,
      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      background: theme.palette.background.paper,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              color="textSecondary" 
              variant="body2" 
              gutterBottom
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' },
              }}
            >
              {value}
            </Typography>
            <Chip
              label={change}
              size="small"
              icon={change.includes('+') || change.includes('Approved') ? <TrendingUp /> : <TrendingDown />}
              color={change.includes('+') || change.includes('Approved') ? 'success' : 'error'}
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
          </Box>
          <Box sx={{
            bgcolor: alpha(color, 0.1),
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            ml: 1,
          }}>
            {React.cloneElement(icon, {
              sx: { 
                fontSize: '1.5rem',
                color: color,
              }
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardContent;