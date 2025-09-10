/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import createBusinessComponent, {
  getRegistryComponent,
  resolveComponents,
  FallbackModal,
  FallbackButton,
  FallbackSearchBar,
  SearchSection,
  ContentSection,
} from '../../src/components/ui/TabBase.jsx';

// Mock global window components
beforeAll(() => {
  // Mock some registry components
  window.TestComponent = () => <div>Test Component from Registry</div>;
  window.Modal = ({ isOpen, onClose, title, children }) => 
    isOpen ? <div data-testid="modal">{title}{children}</div> : null;
});

afterAll(() => {
  delete window.TestComponent;
  delete window.Modal;
});

describe('TabBase Factory and Components', () => {
  describe('getRegistryComponent', () => {
    test('returns component from window global registry', () => {
      const Component = getRegistryComponent('TestComponent');
      expect(Component).toBe(window.TestComponent);
    });

    test('returns fallback component when registry component not found', () => {
      const FallbackComp = () => <div>Fallback</div>;
      const Component = getRegistryComponent('NonExistentComponent', FallbackComp);
      expect(Component).toBe(FallbackComp);
    });

    test('returns null when fallback is explicitly null', () => {
      const Component = getRegistryComponent('NonExistentComponent', null);
      expect(Component).toBeNull();
    });

    test('returns error component when no fallback provided', () => {
      const Component = getRegistryComponent('NonExistentComponent');
      const { container } = render(<Component />);
      expect(container.textContent).toContain('Component "NonExistentComponent" not found in registry');
    });
  });

  describe('resolveComponents', () => {
    test('resolves all expected components', () => {
      const components = resolveComponents();
      
      expect(components).toHaveProperty('Modal');
      expect(components).toHaveProperty('Button');
      expect(components).toHaveProperty('SearchBar');
      expect(components).toHaveProperty('TabHeader');
      expect(components).toHaveProperty('DataTable');
      expect(components).toHaveProperty('SearchSection');
      expect(components).toHaveProperty('ContentSection');
    });

    test('includes fallback components for core UI elements', () => {
      const components = resolveComponents();
      
      // These should have fallbacks
      expect(components.Button).toBeTruthy();
      expect(components.SearchBar).toBeTruthy();
      expect(components.Modal).toBeTruthy();
    });
  });

  describe('FallbackModal', () => {
    test('renders when isOpen is true', () => {
      render(
        <FallbackModal isOpen={true} onClose={jest.fn()} title="Test Modal">
          <div>Modal Content</div>
        </FallbackModal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      const { container } = render(
        <FallbackModal isOpen={false} onClose={jest.fn()} title="Test Modal">
          <div>Modal Content</div>
        </FallbackModal>
      );
      
      expect(container.firstChild).toBeNull();
    });

    test('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(
        <FallbackModal isOpen={true} onClose={mockOnClose} title="Test Modal">
          Content
        </FallbackModal>
      );
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when backdrop is clicked', () => {
      const mockOnClose = jest.fn();
      render(
        <FallbackModal isOpen={true} onClose={mockOnClose} title="Test Modal">
          Content
        </FallbackModal>
      );
      
      const backdrop = screen.getByText('Test Modal').closest('.fixed');
      fireEvent.click(backdrop);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('does not close when modal content is clicked', () => {
      const mockOnClose = jest.fn();
      render(
        <FallbackModal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <div data-testid="modal-content">Content</div>
        </FallbackModal>
      );
      
      const content = screen.getByTestId('modal-content');
      fireEvent.click(content);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('FallbackButton', () => {
    test('renders with default props', () => {
      render(<FallbackButton>Click me</FallbackButton>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-blue-600'); // primary variant
      expect(button).toHaveClass('px-4', 'py-2'); // md size
    });

    test('applies variant classes correctly', () => {
      const variants = ['primary', 'secondary', 'success', 'danger'];
      const expectedClasses = ['bg-blue-600', 'bg-gray-200', 'bg-green-600', 'bg-red-600'];
      
      variants.forEach((variant, index) => {
        const { rerender } = render(<FallbackButton variant={variant}>Button</FallbackButton>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass(expectedClasses[index]);
        rerender(<div />); // Clear for next iteration
      });
    });

    test('applies size classes correctly', () => {
      const sizes = ['sm', 'md', 'lg'];
      const expectedClasses = ['px-3 py-1.5', 'px-4 py-2', 'px-6 py-3'];
      
      sizes.forEach((size, index) => {
        const { rerender } = render(<FallbackButton size={size}>Button</FallbackButton>);
        const button = screen.getByRole('button');
        expectedClasses[index].split(' ').forEach(cls => {
          expect(button).toHaveClass(cls);
        });
        rerender(<div />); // Clear for next iteration
      });
    });

    test('handles disabled state', () => {
      const mockOnClick = jest.fn();
      render(<FallbackButton disabled onClick={mockOnClick}>Disabled</FallbackButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      
      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('calls onClick when clicked', () => {
      const mockOnClick = jest.fn();
      render(<FallbackButton onClick={mockOnClick}>Click me</FallbackButton>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('applies custom className', () => {
      render(<FallbackButton className="custom-class">Button</FallbackButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('FallbackSearchBar', () => {
    test('renders with default props', () => {
      render(<FallbackSearchBar />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
    });

    test('displays value prop', () => {
      render(<FallbackSearchBar value="test value" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    test('calls onChange when value changes', () => {
      const mockOnChange = jest.fn();
      render(<FallbackSearchBar onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('new value');
    });

    test('uses custom placeholder', () => {
      render(<FallbackSearchBar placeholder="Custom placeholder" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Custom placeholder');
    });

    test('applies custom className', () => {
      render(<FallbackSearchBar className="custom-search" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-search');
    });

    test('handles null/undefined value gracefully', () => {
      render(<FallbackSearchBar value={null} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });
  });

  describe('SearchSection', () => {
    test('renders searchBar content', () => {
      const searchBar = <input data-testid="search-input" />;
      render(<SearchSection searchBar={searchBar} />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    test('applies proper styling classes', () => {
      const searchBar = <div>Search</div>;
      const { container } = render(<SearchSection searchBar={searchBar} />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bg-gray-800', 'rounded-lg', 'p-4', 'border', 'border-gray-700');
    });

    test('applies custom className', () => {
      const searchBar = <div>Search</div>;
      const { container } = render(<SearchSection searchBar={searchBar} className="custom-class" />);
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('ContentSection', () => {
    test('renders children content', () => {
      render(
        <ContentSection>
          <div data-testid="content">Content here</div>
        </ContentSection>
      );
      
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    test('applies variant styling correctly', () => {
      const variants = [
        { variant: 'table', expectedClass: 'bg-gray-900' },
        { variant: 'form', expectedClass: 'bg-white' },
        { variant: 'info', expectedClass: 'bg-gray-50' },
      ];
      
      variants.forEach(({ variant, expectedClass }) => {
        const { container, rerender } = render(
          <ContentSection variant={variant}>
            <div>Content</div>
          </ContentSection>
        );
        
        const wrapper = container.firstChild;
        expect(wrapper).toHaveClass(expectedClass);
        rerender(<div />); // Clear for next iteration
      });
    });

    test('defaults to table variant', () => {
      const { container } = render(
        <ContentSection>
          <div>Content</div>
        </ContentSection>
      );
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bg-gray-900'); // table variant
    });

    test('applies custom className', () => {
      const { container } = render(
        <ContentSection className="custom-content">
          <div>Content</div>
        </ContentSection>
      );
      
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-content');
    });
  });

  describe('createBusinessComponent', () => {
    test('throws error when name is missing', () => {
      expect(() => {
        createBusinessComponent({
          useData: () => ({ data: [] }),
          renderContent: () => <div>Content</div>,
        });
      }).toThrow('createBusinessComponent requires a name');
    });

    test('throws error when useData is missing', () => {
      expect(() => {
        createBusinessComponent({
          name: 'TestComponent',
          renderContent: () => <div>Content</div>,
        });
      }).toThrow('requires a useData hook function');
    });

    test('throws error when renderContent is missing', () => {
      expect(() => {
        createBusinessComponent({
          name: 'TestComponent',
          useData: () => ({ data: [] }),
        });
      }).toThrow('requires a renderContent function');
    });

    test('creates functional component with proper displayName', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestBusinessComponent',
        useData: () => ({ data: [] }),
        renderContent: () => <div>Test Content</div>,
      });
      
      expect(TestComponent.displayName).toBe('TestBusinessComponent');
    });

    test('renders loading state', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ loading: true }),
        renderContent: () => <div>Content</div>,
      });
      
      render(<TestComponent />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders error state', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ error: new Error('Test error') }),
        renderContent: () => <div>Content</div>,
      });
      
      render(<TestComponent />);
      expect(screen.getByText(/Error in TestComponent: Test error/)).toBeInTheDocument();
    });

    test('renders content with resolved components', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ data: [] }),
        renderContent: ({ components }) => (
          <div data-testid="test-content">
            {components.Button && 'Button available'}
          </div>
        ),
      });
      
      render(<TestComponent />);
      expect(screen.getByTestId('test-content')).toHaveTextContent('Button available');
    });

    test('renders actions when provided', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ data: [] }),
        renderContent: () => <div>Main content</div>,
        renderActions: () => <div data-testid="actions">Actions</div>,
      });
      
      render(<TestComponent />);
      expect(screen.getByTestId('actions')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    test('renders modals when provided', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ data: [] }),
        renderContent: () => <div>Main content</div>,
        renderModals: () => <div data-testid="modals">Modals</div>,
      });
      
      render(<TestComponent />);
      expect(screen.getByTestId('modals')).toBeInTheDocument();
    });

    test('merges default props with provided props', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: (props) => ({ data: [], props }),
        renderContent: ({ data }) => <div data-testid="props">{JSON.stringify(data.props)}</div>,
        defaultProps: { defaultProp: 'default', shared: 'default' },
      });
      
      render(<TestComponent shared="override" customProp="custom" />);
      const content = screen.getByTestId('props');
      const props = JSON.parse(content.textContent);
      
      expect(props.defaultProp).toBe('default');
      expect(props.shared).toBe('override'); // Should be overridden
      expect(props.customProp).toBe('custom');
    });

    test('handles render errors gracefully', () => {
      // Mock console.error to prevent error logs in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ data: [] }),
        renderContent: () => {
          throw new Error('Render error');
        },
      });
      
      render(<TestComponent />);
      expect(screen.getByText(/Render error in TestComponent: Render error/)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('validates data array', () => {
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ data: 'not an array' }),
        renderContent: ({ data }) => <div data-testid="data">{Array.isArray(data.data) ? 'array' : 'not array'}</div>,
      });
      
      render(<TestComponent />);
      // Should still render even with invalid data
      expect(screen.getByTestId('data')).toHaveTextContent('not array');
    });

    test('calls logger when available on render error', () => {
      const mockLogger = {
        error: jest.fn(),
      };
      
      window.NightingaleLogger = {
        get: jest.fn(() => mockLogger),
      };
      
      const TestComponent = createBusinessComponent({
        name: 'TestComponent',
        useData: () => ({ data: [] }),
        renderContent: () => {
          throw new Error('Test render error');
        },
      });
      
      // Mock console.error to prevent error logs
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TestComponent />);
      
      expect(window.NightingaleLogger.get).toHaveBeenCalledWith('ui:tabRender');
      expect(mockLogger.error).toHaveBeenCalledWith('Tab render failed', expect.objectContaining({
        error: 'Test render error',
        tabName: 'TestComponent',
      }));
      
      delete window.NightingaleLogger;
      consoleSpy.mockRestore();
    });
  });
});