import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import SearchBar from '../../src/components/ui/SearchBar.jsx';

describe('SearchBar Component', () => {
  test('renders basic search input', () => {
    render(<SearchBar />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });
});
