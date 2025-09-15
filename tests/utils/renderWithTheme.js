import React from 'react';
import { render } from '@testing-library/react';
import { AppThemeProvider } from '../../src/theme/index.tsx';

/**
 * Render a component wrapped with the global AppThemeProvider.
 * Mirrors production tree for components relying on MUI theme.
 */
export function renderWithTheme(ui, options) {
  return render(<AppThemeProvider>{ui}</AppThemeProvider>, options);
}

export * from '@testing-library/react';
