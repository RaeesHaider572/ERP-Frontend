import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, useMediaQuery, useTheme, Tooltip,
  Avatar, styled
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People,
  Receipt as ReceiptIcon,
  Brightness4,
  Brightness7,
  ChevronLeft,
  ChevronRight,
  AccountBalance as AccountBalanceIcon,
  People as EmployeeIcon,
  EventNote as EventNoteIcon,
  Logout,
  Payments as InstallmentIcon,
  Work as WorkIcon,
  CameraAlt as CameraAltIcon,
  AccessTime as AccessTimeIcon,
  Groups as GroupsIcon,
  AssignmentTurnedIn as myRequestsIcon,
  FactCheck as ApplyCorrectionIcon,
  HistoryEdu as MyCorrectionsIcon,
  Groups as TeamCorrectionIcon,
  AdminPanelSettings as ManageCorrectionsIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth, MODULES } from '../../contexts/AuthContext';

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: open ? 240 : 60,
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

function Layout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme, sidebarOpen, toggleSidebar } = useThemeContext();

  const {
    logout,
    user,
    isCustodian,
    isHR,
    getRoleDisplay,
    canAccessModule,
  } = useAuth();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 🔒 Employees land on Leave Dashboard, not the generic Dashboard.
  // Custodians and HR are unaffected — they keep the default Dashboard.
  const isEmployeeOnly = user && !isCustodian() && !isHR();

  useEffect(() => {
    if (user && (location.pathname === '/dashboard' || location.pathname === '/')) {
      // navigate('/leave-dashboard', { replace: true });
      navigate('/attendance-correction/apply', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // 🔒 Role-based menu items
  const getMenuItems = () => {
    const items = [];

    // ========================================
    // LEAVE MODULE - flat top-level links
    // ========================================
    // if (canAccessModule(MODULES.LEAVE)) {
    //   const leaveItems = [
    //     { text: 'Leave Dashboard', path: '/leave-dashboard' },
    //     { text: 'Apply Leave', path: '/LeaveApply' },
    //     { text: 'My Requests', path: '/LeaveRequests' },
    //     { text: 'Leave Balance', path: '/LeaveBalance' },
    //   ];

    //   // HR gets additional menu items
    //   if (isHR()) {
    //     leaveItems.push(
    //       { text: 'All Requests', path: '/leave/all-requests' }
    //     );
    //   }

    //   // Custodian gets team requests
    //   if (isCustodian()) {
    //     leaveItems.push({ text: 'Team Requests', path: '/leave/team-requests' });
    //   }

    //   leaveItems.forEach((item) => {
    //     items.push({
    //       text: item.text,
    //       icon: <EventNoteIcon />,
    //       path: item.path
    //     });
    //   });
    // }

    // ========================================
    // ✅ ATTENDANCE CORRECTION MODULE
    // ========================================
    // All employees can see these
    items.push({
      text: 'Apply My Correction',
      icon: <ApplyCorrectionIcon  />,
      path: '/attendance-correction/apply'
    });
    items.push({
      text: 'My Corrections',
      icon: <MyCorrectionsIcon />,
      path: '/attendance-correction/my-requests'
    });

    // ========================================
    // EMPLOYEES - Custodian & HR only
    // ========================================
    if (canAccessModule(MODULES.EMPLOYEES) && (isCustodian() || isHR())) {
      items.push({
        text: isHR() ? 'Employees' : 'My Ward',
        icon: <EmployeeIcon />,
        path: '/employees'
      });
    }

// Custodian can see Team Requests
if (isCustodian()) {
  items.push({
    text: 'My Ward Correction',
    icon: <TeamCorrectionIcon />,
    path: '/attendance-correction/team-requests'
  });
}
    // HR only - Management
    if (isHR()) {
      items.push({
        text: 'Manage Corrections',
        icon: <ManageCorrectionsIcon />,
        path: '/attendance-correction/management'
      });
    }


    // ========================================
    // OTHER MODULES
    // ========================================
    if (canAccessModule(MODULES.CUSTOMERS)) {
      items.push({
        text: 'Customers',
        icon: <People />,
        path: '/customers'
      });
    }

    if (canAccessModule(MODULES.PROJECTS)) {
      items.push({
        text: 'Projects',
        icon: <WorkIcon />,
        path: '/projects'
      });
    }

    if (canAccessModule(MODULES.RECEIPTS)) {
      items.push({
        text: 'Receipts',
        icon: <ReceiptIcon />,
        path: '/receipts'
      });
    }

    if (canAccessModule(MODULES.INSTALLMENT)) {
      items.push({
        text: 'Installment Plan',
        icon: <InstallmentIcon />,
        path: '/installment-plans'
      });
    }

    if (canAccessModule(MODULES.CASH_BANK)) {
      items.push({
        text: 'Cash and Bank',
        icon: <AccountBalanceIcon />,
        path: '/cash-and-bank'
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const renderMenuItem = (item) => {
    const isItemActive = isActive(item.path);

    return (
      <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
        <Tooltip title={item.text} placement="right" disableHoverListener={sidebarOpen}>
          <ListItemButton
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              px: sidebarOpen ? 1.5 : 1,
              minHeight: 48,
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              backgroundColor: isItemActive
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
                color: isItemActive
                  ? theme.palette.primary.main
                  : (mode === 'light' ? '#64748b' : '#94a3b8'),
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </ListItemIcon>
            {sidebarOpen && (
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isItemActive ? 600 : 400,
                  color: isItemActive
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
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
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
                {user?.Name?.charAt(0) || 'U'}
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
                  {user?.Name || 'User'}
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
                >{user?.Designation || 'No Designation'}
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
              {user?.Name?.charAt(0) || 'U'}
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
          {menuItems.map(item => renderMenuItem(item))}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ flexShrink: 0 }}>
        <Divider sx={{ my: 2 }} />
        <List sx={{ px: sidebarOpen ? 2 : 1 }}>
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
    // Leave routes
    if (location.pathname.includes('/leave-dashboard')) return 'Leave Dashboard';
    if (location.pathname.includes('/LeaveApply')) return 'Apply Leave';
    if (location.pathname.includes('/LeaveRequests')) return 'My Requests';
    if (location.pathname.includes('/LeaveBalance')) return 'Leave Balance';
    if (location.pathname.includes('/leave/team-requests')) return 'Team Requests';
    if (location.pathname.includes('/leave/all-requests')) return 'All Requests';

    // ✅ Attendance Correction routes
    if (location.pathname.includes('/attendance-correction/apply')) return 'Apply Attendance Correction';
    if (location.pathname.includes('/attendance-correction/my-requests')) return 'My Correction Requests';
    if (location.pathname.includes('/attendance-correction/management')) return 'Manage Corrections';
    if (location.pathname.includes('/attendance-correction/team-requests')) return 'Team Requests';

    // Other routes
    if (location.pathname.includes('/employees')) return 'Employees';
    if (location.pathname.includes('/dashboard')) return 'Dashboard';

    // Default fallback
    const route = menuItems.find(item => isActive(item.path));
    if (route) return route.text;

    return isEmployeeOnly ? 'Leave Dashboard' : 'Dashboard';
  };

  const drawerWidth = sidebarOpen ? 240 : 60;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <CssBaseline />

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
            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>

            <Tooltip title={`${user?.Name || 'User'} (${getRoleDisplay()})`}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: mode === 'light' ? '#ec4899' : '#f472b6',
                  cursor: 'pointer'
                }}
              >
                {user?.Name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

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
            p: { xs: 1.5, sm: 2, md: 3 },
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;