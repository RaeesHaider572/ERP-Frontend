import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom'; 
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery, useTheme, Tooltip, Badge, Avatar, styled, } from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People,
  Receipt as ReceiptIcon,
  Settings,
  Notifications,
  Brightness4,
  Brightness7,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Percent as PercentIcon,
  AccountBalance as AccountBalanceIcon,
  employee as EmployeeIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Logout } from '@mui/icons-material';

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: open ? 220 : 60,
    height: '100vh',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.standard,
    }),
    overflowX: 'hidden',
    borderRight: theme.palette.mode === 'light'
      ? '1px solid #e2e8f0'
      : '1px solid #334155',
    boxSizing: 'border-box',
  },
}));

function Layout({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme, sidebarOpen, toggleSidebar } = useThemeContext();
  const { logout, user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />, path: '/dashboard', badge: 0
    },
    {
      text: 'Customers',
      icon: <People />,
      path: '/customers',
      badge: 0
    },
    {
      text: 'Receipts',
      icon: <ReceiptIcon />,
      path: '/receipts',
      badge: 0
    },
    {
      text: 'Installment Plan',
      icon: <ReceiptIcon />,
      path: '/installment-plans',
      badge: 0
    },
    {
      text: 'Inventory',
      icon: <Warehouse />,
      path: '/inventory',
      badge: 0
    },
    { text: "Tax Rates", icon: <PercentIcon />, path: "/tax-rates", badge: 0 },
    { text: "Cash and Bank", icon: <AccountBalanceIcon />, path: "/cash-and-bank", badge: 0 },
    { text: "Employees", icon: <EmployeeIcon />, path: "/employees", badge: 0 },
  ];

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Drawer Header */}
      <Box sx={{ flexShrink: 0 }}>
        <Toolbar sx={{
          background: mode === 'light'
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          gap: 2,
          py: 2,
          px: sidebarOpen ? 1.5 : 1,
          minHeight: '80px',
        }}>
          {sidebarOpen ? (
            <>
              <Avatar sx={{
                bgcolor: mode === 'light' ? 'white' : '#8b5cf6',
                color: mode === 'light' ? '#6366f1' : 'white',
                width: 48,
                height: 48,
                fontWeight: 'bold',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}>
                A
              </Avatar>
              <Box sx={{
                flexGrow: 1,
                overflow: 'hidden',
                transition: 'opacity 0.3s',
                opacity: sidebarOpen ? 1 : 0,
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Admin Dashboard
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Administrator
                </Typography>
              </Box>
            </>
          ) : (
            <Avatar sx={{
              bgcolor: mode === 'light' ? 'white' : '#8b5cf6',
              color: mode === 'light' ? '#6366f1' : 'white',
              width: 40,
              height: 40,
              fontWeight: 'bold',
            }}>
              A
            </Avatar>
          )}
        </Toolbar>
      </Box>

      <Divider />

      {/* Toggle Button */}
      <Box sx={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        p: 1,
        // display: isMobile ? 'none' : 'flex',
      }}>
        <Tooltip title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
          <IconButton
            onClick={toggleSidebar}
            sx={{
              color: mode === 'light' ? '#64748b' : '#94a3b8',
              '&:hover': {
                backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
              }
            }}
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Scrollable Menu Items */}
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: mode === 'light' ? '#cbd5e1' : '#475569',
          borderRadius: '4px',
        },
      }}>
        <List sx={{ px: sidebarOpen ? 1.5 : 1, pt: 1 }}>
          {/* Menu Items */}
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={item.text} placement="right" disableHoverListener={sidebarOpen}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    px: sidebarOpen ? 1.5 : 1,
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    backgroundColor: isActive(item.path)
                      ? (mode === 'light' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)')
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: sidebarOpen ? 32 : 'auto',
                      mr: sidebarOpen ? 1.5 : 0,
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      color: isActive(item.path)
                        ? theme.palette.primary.main
                        : (mode === 'light' ? '#64748b' : '#94a3b8'),
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                    {item.badge > 0 && !sidebarOpen && (
                      <Badge
                        badgeContent={item.badge}
                        color="error"
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          '& .MuiBadge-badge': {
                            fontSize: '0.65rem',
                            minWidth: '16px',
                            height: '16px',
                            padding: '0 4px',
                          }
                        }}
                      />
                    )}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: isActive(item.path) ? 600 : 400,
                          color: isActive(item.path)
                            ? theme.palette.primary.main
                            : (mode === 'light' ? 'text.secondary' : '#94a3b8'),
                          noWrap: true,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        sx={{
                          m: 0,
                          flex: 1,
                          minWidth: 0,
                        }}
                      />
                      {item.badge > 0 && (
                        <Badge
                          badgeContent={item.badge}
                          color="error"
                          sx={{
                            ml: 1,
                            flexShrink: 0,
                            '& .MuiBadge-badge': {
                              fontSize: '0.7rem',
                              minWidth: '18px',
                              height: '18px',
                              padding: '0 5px',
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Settings at Bottom */}
      <Box sx={{ flexShrink: 0 }}>
        <Divider sx={{ my: 2 }} />
        <List sx={{ px: sidebarOpen ? 2 : 1 }}>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip title="Settings" placement="right" disableHoverListener={sidebarOpen}>
              <ListItemButton
                onClick={() => navigate('/settings')}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  px: sidebarOpen ? 1.5 : 1,
                  minHeight: 48,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarOpen ? 40 : 'auto',
                    mr: sidebarOpen ? 2 : 0,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    color: mode === 'light' ? '#64748b' : '#94a3b8',
                    flexShrink: 0,
                  }}
                >
                  <Settings />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary="Settings"
                    primaryTypographyProps={{
                      color: mode === 'light' ? 'text.secondary' : '#94a3b8',
                      noWrap: true,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    sx={{
                      m: 0,
                      flex: 1,
                      minWidth: 0,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip title="Logout" placement="right" disableHoverListener={sidebarOpen}>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  px: sidebarOpen ? 1.5 : 1,
                  minHeight: 48,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: mode === 'light' ? '#fee2e2' : '#7f1d1d',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarOpen ? 40 : 'auto',
                    mr: sidebarOpen ? 2 : 0,
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    color: mode === 'light' ? '#dc2626' : '#fca5a5',
                    flexShrink: 0,
                  }}
                >
                  <Logout />
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary="Logout"
                    primaryTypographyProps={{
                      color: mode === 'light' ? '#dc2626' : '#fca5a5',
                      noWrap: true,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    sx={{
                      m: 0,
                      flex: 1,
                      minWidth: 0,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  // Update AppBar title based on route
 const getPageTitle = () => {
    const route = menuItems.find(item => isActive(item.path));
    if (isActive('/dashboard')) return 'Dashboard Overview';
    if (route) return route.text;
    return 'Dashboard Overview';
  };

  const drawerWidth = sidebarOpen ? 220 : 60;

   return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <CssBaseline />

      {/* AppBar - same as before */}
      <AppBar
        position="fixed"
        sx={{
          width: {
            xs: '100%',
            md: `calc(100% - ${drawerWidth}px)`
          },
          ml: {
            xs: 0,
            md: `${drawerWidth}px`
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={isMobile ? handleDrawerToggle : toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>

            <Tooltip title={user?.name || user?.email || 'User'}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: mode === 'light' ? '#ec4899' : '#f472b6',
                  cursor: 'pointer'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar/Drawer - same as before */}
      <Box
        component="nav"
        sx={{
          width: {
            xs: 0,
            md: drawerWidth
          },
          flexShrink: 0,
          height: '100vh',
          position: { md: 'fixed' },
          left: 0,
          top: 0,
          zIndex: theme.zIndex.drawer,
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              height: '100vh',
              borderRight: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <StyledDrawer
          variant="permanent"
          open={sidebarOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
          }}
        >
          {drawer}
        </StyledDrawer>
      </Box>

      {/* Main Content - Use Outlet instead of children */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: '100%',
            md: `calc(100% - ${drawerWidth}px)`
          },
          ml: {
            xs: 0,
            md: `${drawerWidth}px`
          },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: { xs: 1.5, sm: 2, md: 2 },
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Outlet /> {/* ✅ Use Outlet instead of {children} */}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;