import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../utils/theme';

const ThemeContext = createContext({});

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('theme-mode');
    return savedMode || 'light';
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebar-state');
    return savedState ? JSON.parse(savedState) : true;
  });

  const theme = useMemo(() => {
    const baseTheme = mode === 'light' ? lightTheme : darkTheme;
    return {
      ...baseTheme,
      transitions: {
        ...baseTheme.transitions,
        sidebar: '225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
      },
      sidebar: {
        width: sidebarOpen ? 280 : 80,
        collapsedWidth: 80,
        expandedWidth: 280,
      }
    };
  }, [mode, sidebarOpen]);

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('sidebar-state', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const setSidebarState = (state) => {
    setSidebarOpen(state);
  };

  return (
    <ThemeContext.Provider value={{ 
      mode, 
      toggleTheme, 
      sidebarOpen, 
      toggleSidebar,
      setSidebarState
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};