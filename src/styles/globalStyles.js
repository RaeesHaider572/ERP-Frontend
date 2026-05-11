import { alpha } from '@mui/material/styles';

// Global spacing constants
export const SPACING = {
  xs: 0.5, // 4px
  sm: 1,   // 8px
  md: 2,   // 16px
  lg: 3,   // 24px
  xl: 4,   // 32px
  xxl: 6,  // 48px
};

// Common styles for consistent spacing
export const commonStyles = {
  container: {
    padding: { xs: 2, sm: 3, md: 4 },
  },
  section: {
    marginBottom: { xs: 2, sm: 3, md: 4 },
  },
  card: {
    padding: { xs: 2, sm: 3 },
    borderRadius: 3,
  },
  button: {
    padding: '10px 24px',
    borderRadius: 2,
  },
};

// Responsive breakpoints helper
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Animation durations
export const transitions = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Common gradients
export const gradients = {
  primary: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  secondary: (theme) => `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
  subtle: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
};

// Shadow presets
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};


