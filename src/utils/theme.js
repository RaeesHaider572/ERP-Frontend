// src/utils/theme.js
/**
 * Professional ERP System Theme
 * 
 * Design Principles:
 * - Clean, serious, trustworthy, efficient
 * - Neutral, enterprise-friendly color palette
 * - Soft backgrounds, subtle borders
 * - Low-contrast but readable text
 * - No flashy colors or gradients
 * - Focus on clarity, hierarchy, and consistency
 * - Designed for data-heavy screens
 * - Long-usage friendly (8+ hours daily use)
 * 
 * Color System:
 * - Primary: Corporate blue/slate (#475569 - Slate 600)
 * - Secondary: Neutral gray (#64748b - Slate 500)
 * - Success/Warning/Error: Muted, not bright
 * 
 * Typography:
 * - Clear font hierarchy
 * - Slightly smaller font sizes (ERP standard)
 * - Medium font weight for labels
 * 
 * Border Radius: Subtle (4-6px)
 * Shadows: Minimal, soft elevation
 */

import { createTheme, alpha } from '@mui/material/styles';

// ============================================
// SHARED CONFIGURATION
// ============================================

const sharedConfig = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    // ERP-standard smaller font sizes
    h1: {
      fontWeight: 600,
      fontSize: '1.875rem', // 30px
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: '#1e293b',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem', // 24px
      lineHeight: 1.4,
      letterSpacing: '-0.005em',
      color: '#1e293b',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.25rem', // 20px
      lineHeight: 1.4,
      color: '#1e293b',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.125rem', // 18px
      lineHeight: 1.5,
      color: '#1e293b',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1rem', // 16px
      lineHeight: 1.5,
      color: '#1e293b',
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.9375rem', // 15px
      lineHeight: 1.5,
      color: '#1e293b',
    },
    body1: {
      fontSize: '0.9375rem', // 15px
      lineHeight: 1.6,
      color: '#334155',
    },
    body2: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.5,
      color: '#475569',
    },
    button: {
      fontWeight: 500,
      fontSize: '0.875rem', // 14px
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.8125rem', // 13px
      lineHeight: 1.4,
      color: '#64748b',
    },
    overline: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 4, // Subtle 4px border radius
  },
  spacing: 8, // Base spacing unit (8px)
  // Minimal, soft shadows
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
    '0 2px 6px 0 rgba(0, 0, 0, 0.1)',
    '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
    '0 6px 12px 0 rgba(0, 0, 0, 0.12)',
    '0 8px 16px 0 rgba(0, 0, 0, 0.12)',
    '0 10px 20px 0 rgba(0, 0, 0, 0.15)',
    '0 12px 24px 0 rgba(0, 0, 0, 0.15)',
    '0 14px 28px 0 rgba(0, 0, 0, 0.15)',
    '0 16px 32px 0 rgba(0, 0, 0, 0.15)',
    '0 18px 36px 0 rgba(0, 0, 0, 0.15)',
    '0 20px 40px 0 rgba(0, 0, 0, 0.15)',
    '0 22px 44px 0 rgba(0, 0, 0, 0.15)',
    '0 24px 48px 0 rgba(0, 0, 0, 0.15)',
    '0 26px 52px 0 rgba(0, 0, 0, 0.15)',
    '0 28px 56px 0 rgba(0, 0, 0, 0.15)',
    '0 30px 60px 0 rgba(0, 0, 0, 0.15)',
    '0 32px 64px 0 rgba(0, 0, 0, 0.15)',
    '0 34px 68px 0 rgba(0, 0, 0, 0.15)',
    '0 36px 72px 0 rgba(0, 0, 0, 0.15)',
    '0 38px 76px 0 rgba(0, 0, 0, 0.15)',
    '0 40px 80px 0 rgba(0, 0, 0, 0.15)',
  ],
};

// ============================================
// LIGHT THEME
// ============================================

export const lightTheme = createTheme({
  ...sharedConfig,
  palette: {
    mode: 'light',
    primary: {
      main: '#475569', // Slate 600 - Corporate blue/slate
      light: '#64748b', // Slate 500
      dark: '#334155', // Slate 700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b', // Slate 500 - Neutral gray
      light: '#94a3b8', // Slate 400
      dark: '#475569', // Slate 600
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Slate 50 - Soft background
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Slate 800
      secondary: '#475569', // Slate 600
      disabled: '#94a3b8', // Slate 400
    },
    // Muted, not bright colors
    success: {
      main: '#059669', // Emerald 600 - Muted green
      light: '#10b981', // Emerald 500
      dark: '#047857', // Emerald 700
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706', // Amber 600 - Muted amber
      light: '#f59e0b', // Amber 500
      dark: '#b45309', // Amber 700
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626', // Red 600 - Muted red
      light: '#ef4444', // Red 500
      dark: '#b91c1c', // Red 700
      contrastText: '#ffffff',
    },
    info: {
      main: '#0284c7', // Sky 600 - Muted blue
      light: '#0ea5e9', // Sky 500
      dark: '#0369a1', // Sky 700
      contrastText: '#ffffff',
    },
    divider: alpha('#1e293b', 0.08), // Subtle divider
    action: {
      active: alpha('#475569', 0.54),
      hover: alpha('#475569', 0.04),
      selected: alpha('#475569', 0.08),
      disabled: alpha('#1e293b', 0.26),
      disabledBackground: alpha('#1e293b', 0.12),
    },
  },
  components: {
    // AppBar - Clean, flat, no heavy shadow
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: `1px solid ${alpha('#1e293b', 0.08)}`,
    },
  },
    },
    // Drawer / Sidebar - Solid, structured, no clutter
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: `1px solid ${alpha('#1e293b', 0.08)}`,
          boxShadow: 'none',
        },
      },
    },
    // Buttons - Solid primary, outlined secondary
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          borderRadius: 4,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#475569',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#334155',
            boxShadow: 'none',
          },
          '&:disabled': {
            backgroundColor: alpha('#475569', 0.26),
            color: alpha('#ffffff', 0.5),
          },
        },
        outlined: {
          borderColor: alpha('#475569', 0.3),
          color: '#475569',
          '&:hover': {
            borderColor: '#475569',
            backgroundColor: alpha('#475569', 0.04),
            boxShadow: 'none',
          },
        },
        text: {
          color: '#475569',
          '&:hover': {
            backgroundColor: alpha('#475569', 0.04),
          },
        },
      },
    },
    // TextFields - Dense, clear focus state
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: alpha('#1e293b', 0.12),
            },
            '&:hover fieldset': {
              borderColor: alpha('#1e293b', 0.2),
            },
            '&.Mui-focused fieldset': {
              borderColor: '#475569',
              borderWidth: '1px',
            },
            '&.Mui-disabled': {
              backgroundColor: alpha('#1e293b', 0.04),
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            fontSize: '0.875rem',
            '&.Mui-focused': {
              color: '#475569',
            },
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.8125rem',
            marginTop: '4px',
          },
        },
      },
    },
    // Tables - Striped rows, strong header
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f1f5f9', // Slate 100
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#1e293b',
            borderBottom: `1px solid ${alpha('#1e293b', 0.12)}`,
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:nth-of-type(even)': {
              backgroundColor: alpha('#1e293b', 0.02),
            },
            '&:hover': {
              backgroundColor: alpha('#475569', 0.04),
            },
            '&.Mui-selected': {
              backgroundColor: alpha('#475569', 0.08),
              '&:hover': {
                backgroundColor: alpha('#475569', 0.12),
              },
            },
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${alpha('#1e293b', 0.08)}`,
            padding: '12px 16px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    // Cards - Flat, structured, no rounded bubbles
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          border: `1px solid ${alpha('#1e293b', 0.08)}`,
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: `1px solid ${alpha('#1e293b', 0.08)}`,
          backgroundColor: '#f8fafc',
        },
        title: {
          fontWeight: 600,
          fontSize: '1rem',
          color: '#1e293b',
        },
        subheader: {
          fontSize: '0.875rem',
          color: '#64748b',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 4,
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        },
      },
    },
    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.8125rem',
          height: '24px',
        },
      },
    },
    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    // Checkbox
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: alpha('#1e293b', 0.3),
          '&.Mui-checked': {
            color: '#475569',
          },
        },
      },
    },
    // Radio
    MuiRadio: {
      styleOverrides: {
        root: {
          color: alpha('#1e293b', 0.3),
          '&.Mui-checked': {
            color: '#475569',
          },
        },
      },
    },
    // Switch
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: alpha('#1e293b', 0.3),
          '&.Mui-checked': {
            color: '#475569',
          },
        },
      },
    },
    // List
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&:hover': {
            backgroundColor: alpha('#475569', 0.04),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#475569', 0.08),
            '&:hover': {
              backgroundColor: alpha('#475569', 0.12),
            },
          },
        },
      },
    },
  },
});

// ============================================
// DARK THEME
// ============================================

export const darkTheme = createTheme({
  ...sharedConfig,
  palette: {
    mode: 'dark',
    primary: {
      main: '#94a3b8', // Slate 400 - Lighter for dark mode
      light: '#cbd5e1', // Slate 300
      dark: '#64748b', // Slate 500
      contrastText: '#0f172a',
    },
    secondary: {
      main: '#64748b', // Slate 500
      light: '#94a3b8', // Slate 400
      dark: '#475569', // Slate 600
      contrastText: '#f1f5f9',
    },
    background: {
      default: '#0f172a', // Slate 900 - Not pure black
      paper: '#1e293b', // Slate 800
    },
    text: {
      primary: '#f1f5f9', // Slate 100
      secondary: '#cbd5e1', // Slate 300
      disabled: '#64748b', // Slate 500
    },
    // Muted, not bright colors for dark mode
    success: {
      main: '#10b981', // Emerald 500
      light: '#34d399', // Emerald 400
      dark: '#059669', // Emerald 600
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // Amber 500
      light: '#fbbf24', // Amber 400
      dark: '#d97706', // Amber 600
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Red 500
      light: '#f87171', // Red 400
      dark: '#dc2626', // Red 600
      contrastText: '#ffffff',
    },
    info: {
      main: '#0ea5e9', // Sky 500
      light: '#38bdf8', // Sky 400
      dark: '#0284c7', // Sky 600
      contrastText: '#ffffff',
    },
    divider: alpha('#f1f5f9', 0.08), // Subtle divider
    action: {
      active: alpha('#f1f5f9', 0.54),
      hover: alpha('#f1f5f9', 0.04),
      selected: alpha('#f1f5f9', 0.08),
      disabled: alpha('#f1f5f9', 0.26),
      disabledBackground: alpha('#f1f5f9', 0.12),
    },
  },
  typography: {
    ...sharedConfig.typography,
    h1: {
      ...sharedConfig.typography.h1,
      color: '#f1f5f9',
    },
    h2: {
      ...sharedConfig.typography.h2,
      color: '#f1f5f9',
    },
    h3: {
      ...sharedConfig.typography.h3,
      color: '#f1f5f9',
    },
    h4: {
      ...sharedConfig.typography.h4,
      color: '#f1f5f9',
    },
    h5: {
      ...sharedConfig.typography.h5,
      color: '#f1f5f9',
    },
    h6: {
      ...sharedConfig.typography.h6,
      color: '#f1f5f9',
    },
    body1: {
      ...sharedConfig.typography.body1,
      color: '#cbd5e1',
    },
    body2: {
      ...sharedConfig.typography.body2,
      color: '#94a3b8',
    },
  },
  components: {
    // AppBar - Clean, flat, no heavy shadow
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
          borderBottom: `1px solid ${alpha('#f1f5f9', 0.08)}`,
        },
      },
    },
    // Drawer / Sidebar - Solid, structured, no clutter
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e293b',
          borderRight: `1px solid ${alpha('#f1f5f9', 0.08)}`,
          boxShadow: 'none',
        },
      },
    },
    // Buttons - Solid primary, outlined secondary
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          borderRadius: 4,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: '#94a3b8',
          color: '#0f172a',
          '&:hover': {
            backgroundColor: '#cbd5e1',
            boxShadow: 'none',
          },
          '&:disabled': {
            backgroundColor: alpha('#94a3b8', 0.26),
            color: alpha('#0f172a', 0.5),
          },
        },
        outlined: {
          borderColor: alpha('#94a3b8', 0.3),
          color: '#94a3b8',
          '&:hover': {
            borderColor: '#94a3b8',
            backgroundColor: alpha('#94a3b8', 0.08),
            boxShadow: 'none',
          },
        },
        text: {
          color: '#94a3b8',
          '&:hover': {
            backgroundColor: alpha('#94a3b8', 0.08),
          },
        },
      },
    },
    // TextFields - Dense, clear focus state
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: alpha('#f1f5f9', 0.04),
            '& fieldset': {
              borderColor: alpha('#f1f5f9', 0.12),
            },
            '&:hover fieldset': {
              borderColor: alpha('#f1f5f9', 0.2),
            },
            '&.Mui-focused fieldset': {
              borderColor: '#94a3b8',
              borderWidth: '1px',
            },
            '&.Mui-disabled': {
              backgroundColor: alpha('#f1f5f9', 0.04),
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            fontSize: '0.875rem',
            '&.Mui-focused': {
              color: '#94a3b8',
            },
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.8125rem',
            marginTop: '4px',
          },
        },
      },
    },
    // Tables - Striped rows, strong header
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f172a',
          '& .MuiTableCell-root': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#f1f5f9',
            borderBottom: `1px solid ${alpha('#f1f5f9', 0.12)}`,
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:nth-of-type(even)': {
              backgroundColor: alpha('#f1f5f9', 0.02),
            },
            '&:hover': {
              backgroundColor: alpha('#94a3b8', 0.08),
            },
            '&.Mui-selected': {
              backgroundColor: alpha('#94a3b8', 0.12),
              '&:hover': {
                backgroundColor: alpha('#94a3b8', 0.16),
              },
            },
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${alpha('#f1f5f9', 0.08)}`,
            padding: '12px 16px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    // Cards - Flat, structured, no rounded bubbles
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
          border: `1px solid ${alpha('#f1f5f9', 0.08)}`,
          backgroundColor: '#1e293b',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: `1px solid ${alpha('#f1f5f9', 0.08)}`,
          backgroundColor: '#0f172a',
        },
        title: {
          fontWeight: 600,
          fontSize: '1rem',
          color: '#f1f5f9',
        },
        subheader: {
          fontSize: '0.875rem',
          color: '#94a3b8',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 4,
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
        },
        elevation3: {
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
        },
      },
    },
    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: '0.8125rem',
          height: '24px',
        },
      },
    },
    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.5)',
        },
      },
    },
    // Checkbox
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: alpha('#f1f5f9', 0.3),
          '&.Mui-checked': {
            color: '#94a3b8',
          },
        },
      },
    },
    // Radio
    MuiRadio: {
      styleOverrides: {
        root: {
          color: alpha('#f1f5f9', 0.3),
          '&.Mui-checked': {
            color: '#94a3b8',
          },
        },
      },
    },
    // Switch
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: alpha('#f1f5f9', 0.3),
          '&.Mui-checked': {
            color: '#94a3b8',
          },
        },
      },
    },
    // List
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&:hover': {
            backgroundColor: alpha('#94a3b8', 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#94a3b8', 0.12),
            '&:hover': {
              backgroundColor: alpha('#94a3b8', 0.16),
            },
          },
        },
      },
    },
  },
});

// ============================================
// THEME PROVIDER USAGE EXAMPLE
// ============================================

/**
 * Usage in your app:
 * 
 * The theme is already integrated with ThemeContext.
 * Import lightTheme and darkTheme from this file.
 * 
 * Example:
 * import { ThemeProvider } from '@mui/material/styles';
 * import { lightTheme, darkTheme } from './utils/theme';
 * 
 * Then use ThemeProvider with the selected theme.
 * Your ThemeContext already handles this automatically.
 */

/**
 * Design Choices Explanation:
 * 
 * 1. Color Palette:
 *    - Primary (#475569): Corporate slate blue - professional, trustworthy
 *    - Secondary (#64748b): Neutral gray - versatile, non-distracting
 *    - Muted success/warning/error: Reduced saturation for long-term viewing
 * 
 * 2. Typography:
 *    - Smaller font sizes (13-15px body): ERP standard, more data on screen
 *    - Medium font weight (500) for labels: Clear but not heavy
 *    - Inter font family: Modern, readable, professional
 * 
 * 3. Border Radius (4px):
 *    - Subtle, not rounded bubbles - maintains structure
 *    - Consistent across all components
 * 
 * 4. Shadows:
 *    - Minimal elevation (0.05-0.15 opacity)
 *    - Soft, not dramatic - reduces visual noise
 * 
 * 5. Component Overrides:
 *    - AppBar: Flat, clean, no gradients
 *    - Drawer: Solid background, structured
 *    - Buttons: Solid primary, outlined secondary - clear hierarchy
 *    - TextFields: Dense, clear focus states
 *    - Tables: Striped rows for readability, strong headers
 *    - Cards: Flat, structured, subtle borders
 * 
 * 6. Dark Mode:
 *    - Not pure black (#0f172a): Reduces eye strain
 *    - Low contrast: Easy on eyes for 8+ hours
 *    - Same structure as light mode for consistency
 * 
 * 7. Accessibility:
 *    - WCAG AA compliant contrast ratios
 *    - Clear focus states
 *    - Readable text sizes
 *    - Predictable interactions
 */
