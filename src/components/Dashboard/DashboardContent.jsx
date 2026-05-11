// src/components/Dashboard/DashboardContent.jsx
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  AvatarGroup,
  Avatar,
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
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';

// Rest of the DashboardContent component remains the same, but update the container Box:
const DashboardContent = () => {
  const theme = useTheme();
  const { sidebarOpen } = useThemeContext();
  
  const stats = [
    { title: 'Total Revenue', value: '$54,239', change: '+12.5%', icon: <AttachMoney />, color: '#10b981' },
    { title: 'New Orders', value: '1,245', change: '+8.2%', icon: <ShoppingCart />, color: '#6366f1' },
    { title: 'Active Users', value: '3,452', change: '+23.1%', icon: <People />, color: '#ec4899' },
    { title: 'Conversion Rate', value: '4.8%', change: '-2.4%', icon: <BarChart />, color: '#f59e0b' },
  ];

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
          Welcome back, Admin! 👋
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your store today.
        </Typography>
      </Box>
      
      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>
      
      {/* Rest of the content... */}
    </Box>
  );
};

// Update the StatCard component to use theme properly
const StatCard = ({ title, value, change, icon, color }) => {
  const theme = useTheme();
  const { sidebarOpen } = useThemeContext();
  
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
              icon={change.includes('+') ? <TrendingUp /> : <TrendingDown />}
              color={change.includes('+') ? 'success' : 'error'}
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