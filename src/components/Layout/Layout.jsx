import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, useMediaQuery, useTheme, Tooltip,
  Badge, Avatar, styled, Collapse
} from '@mui/material';
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
  People as EmployeeIcon,
  EventNote as EventNoteIcon,
  Logout,
  Payments as InstallmentIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
  QrCodeScanner as QrCodeScannerIcon,
  CameraAlt as CameraAltIcon,
  ExpandLess,
  ExpandMore,
  FactCheck as FactCheckIcon,
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

  // 🔒 UPDATED — these were commented out before, which is why the sidebar
  // always showed every menu item to every role. We need them to build a
  // role-aware menu (Section 10 - Screen-Level Access Control).
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
  const [openSubMenus, setOpenSubMenus] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubMenuToggle = (menuText) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [menuText]: !prev[menuText]
    }));
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

  // 🔒 UPDATED — menu is now built from the role, matching Section 10
  // (Screen-Level Access Control) of the spec:
  //   - "Employee Leave Applications" / "Employees" screen -> Custodian + HR only
  //   - "Leave Approval Screen" -> HR only
  // Everything else (Receipts, Installment Plan, Cash and Bank) is part of
  // the wider ERP and untouched by this change.
  // ✅ Role-based menu items - FIXED
  const getMenuItems = () => {
    const items = [];

    // Dashboard - Always show
    items.push({
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard'
    });

    // Leave Module - All roles can access
    if (canAccessModule(MODULES.LEAVE)) {
      const leaveSubItems = [
        { text: 'Dashboard', path: '/leave-dashboard' },
        { text: 'Apply Leave', path: '/LeaveApply' },
        { text: 'My Requests', path: '/LeaveRequests' },
        { text: 'Leave Balance', path: '/LeaveBalance' },
      ];

      // HR gets additional menu items
      if (isHR()) {
        leaveSubItems.push(
          { text: 'All Requests', path: '/leave/all-requests' },
          { text: 'Approval Dashboard', path: '/leave/approval' }
        );
      }

      // Custodian gets team requests
      if (isCustodian()) {
        leaveSubItems.push({ text: 'Team Requests', path: '/leave/team-requests' });
      }

      // ✅ FIXED: Properly close the items.push
      items.push({
        text: 'Leave Module',
        icon: <EventNoteIcon />,
        path: '/leave-dashboard',
        subItems: leaveSubItems
      });
    }

    // Employees - Custodian and HR only
    // ✅ FIXED: Proper condition
    if (canAccessModule(MODULES.EMPLOYEES) && (isCustodian() || isHR())) {
      items.push({
        text: isHR() ? 'Employees' : 'My Team',
        icon: <EmployeeIcon />,
        path: '/employees'
      });
    }

    // Other modules
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

    if (canAccessModule(MODULES.ATTENDANCE)) {
      items.push({
        text: 'Attendance',
        icon: <CameraAltIcon />,
        path: '/AttendanceLiveFeed'
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const renderMenuItem = (item) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isSubMenuOpen = openSubMenus[item.text] || false;
    const isItemActive = isActive(item.path);

    return (
      <React.Fragment key={item.text}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip title={item.text} placement="right" disableHoverListener={sidebarOpen}>
            <ListItemButton
              onClick={() => {
                if (hasSubItems) {
                  handleSubMenuToggle(item.text);
                } else {
                  navigate(item.path);
                }
              }}
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
                <>
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
                  {hasSubItems && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubMenuToggle(item.text);
                      }}
                      sx={{ ml: 1 }}
                    >
                      {isSubMenuOpen ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </>
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        {hasSubItems && sidebarOpen && (
          <Collapse in={isSubMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems.map((subItem) => (
                <ListItem key={subItem.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(subItem.path)}
                    sx={{
                      pl: 4,
                      py: 0.75,
                      borderRadius: 2,
                      mb: 0.25,
                      mx: 1,
                      backgroundColor: isActive(subItem.path)
                        ? (mode === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.15)')
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
                      }
                    }}
                  >
                    <ListItemText
                      primary={subItem.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive(subItem.path) ? 500 : 400,
                        color: isActive(subItem.path)
                          ? theme.palette.primary.main
                          : (mode === 'light' ? 'text.secondary' : '#94a3b8'),
                        noWrap: true,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
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
                {/* 🔒 UPDATED — show the real role (Employee/Custodian/HR)
                    instead of the hardcoded "User" placeholder. */}
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
                  {getRoleDisplay()}
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

  // Update AppBar title based on route - FIXED
  const getPageTitle = () => {
    // Leave routes
    if (location.pathname.includes('/leave-dashboard')) return 'Leave Dashboard';
    if (location.pathname.includes('/LeaveApply')) return 'Apply Leave';
    if (location.pathname.includes('/LeaveRequests')) return 'My Requests';
    if (location.pathname.includes('/LeaveBalance')) return 'Leave Balance';
    if (location.pathname.includes('/leave/team-requests')) return 'Team Requests';
    if (location.pathname.includes('/leave/all-requests')) return 'All Requests';
    if (location.pathname.includes('/leave/approval')) return 'Approval Dashboard';
    if (location.pathname.includes('/leave/reports')) return 'Leave Reports';
    if (location.pathname.includes('/leave')) return 'Leave Module';

    // Other routes
    if (location.pathname.includes('/employees')) return 'Employees';
    if (location.pathname.includes('/dashboard')) return 'Dashboard';

    // Default fallback
    const route = menuItems.find(item => isActive(item.path));
    if (route) return route.text;

    return 'Dashboard';
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