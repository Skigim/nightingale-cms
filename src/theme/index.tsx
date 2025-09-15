import { createTheme } from '@mui/material/styles';
import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';

// Temporary palette placeholders; refined in Phase 1.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#7c3aed' },
    error: { main: '#dc2626' },
    warning: { main: '#d97706' },
    info: { main: '#0ea5e9' },
    success: { main: '#16a34a' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default theme;
