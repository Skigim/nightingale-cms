import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../../src/components/ui/SearchBar.jsx';

// Utility to type text with events
function type(value, input) {
  [...value].forEach((ch) => {
    fireEvent.change(input, { target: { value: input.value + ch } });
  });
}

describe('SearchBar (advanced scenarios)', () => {
  test('does not open dropdown when showDropdown=false even with data', () => {
    render(
      <SearchBar
        data={[{ id: 1, name: 'Alpha' }]}
        searchKeys={['name']}
        showDropdown={false}
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Al' } });
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  test('opens dropdown and limits results to maxResults', () => {
    const data = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));
    render(
      <SearchBar
        data={data}
        searchKeys={['name']}
        showDropdown
        maxResults={5}
        value="Item"
        onChange={() => {}}
      />,
    );
    // Force focus to trigger dropdown open logic
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    // Only first 5 should appear
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Item ${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByText('Item 6')).not.toBeInTheDocument();
  });

  test('keyboard navigation highlights and selects with Enter', () => {
    const data = [
      { id: 1, name: 'Alpha' },
      { id: 2, name: 'Beta' },
      { id: 3, name: 'Gamma' },
    ];
    const handleSelect = jest.fn();
    const Wrapper = () => {
      const [val, setVal] = React.useState('a');
      return (
        <SearchBar
          data={data}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          searchKeys={['name']}
          showDropdown
          onResultSelect={handleSelect}
        />
      );
    };
    render(<Wrapper />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    // Arrow down twice then Enter
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect.mock.calls[0][0]).toEqual(
      expect.objectContaining({ name: 'Beta' }),
    );
  });

  test('Escape key closes dropdown and clears highlight', () => {
    const data = [{ id: 1, name: 'Alpha' }];
    render(
      <SearchBar
        data={data}
        value="Al"
        onChange={() => {}}
        searchKeys={['name']}
        showDropdown
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    // Dropdown should close (result disappears)
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  test('clear button resets value and closes dropdown', () => {
    const data = [{ id: 1, name: 'Alpha' }];
    const handleChange = jest.fn();
    const Wrapper = () => {
      const [val, setVal] = React.useState('Al');
      return (
        <SearchBar
          data={data}
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            handleChange(e);
          }}
          searchKeys={['name']}
          showDropdown
        />
      );
    };
    render(<Wrapper />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    const clearBtn = screen.getByRole('button');
    fireEvent.click(clearBtn);
    expect(handleChange).toHaveBeenCalled();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  test('custom renderResult is used when provided', () => {
    const data = [{ id: 42, name: 'Omega' }];
    const renderResult = (item) => (
      <div data-testid="custom-res">Custom: {item.name}</div>
    );
    render(
      <SearchBar
        data={data}
        value="O"
        onChange={() => {}}
        searchKeys={['name']}
        showDropdown
        renderResult={renderResult}
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByTestId('custom-res')).toHaveTextContent('Custom: Omega');
  });
});
