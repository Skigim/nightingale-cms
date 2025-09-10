import { render, screen, fireEvent } from '@testing-library/react';
import Cards, {
  Card,
  CardGrid,
  CardList,
  CardField,
  CardActions,
} from '../../src/components/ui/Cards';

describe('Cards Components', () => {
  describe('Card', () => {
    test('renders basic card with title and content', () => {
      render(
        <Card title="Test Card">
          <p>Card content</p>
        </Card>,
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('renders with subtitle', () => {
      render(
        <Card
          title="Main Title"
          subtitle="Secondary text"
        />,
      );

      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('Secondary text')).toBeInTheDocument();
    });

    test('applies variant classes correctly', () => {
      const { container, rerender } = render(
        <Card
          title="Test"
          variant="elevated"
        />,
      );
      let card = container.firstChild;
      expect(card).toHaveClass('shadow-lg');

      rerender(
        <Card
          title="Test"
          variant="outlined"
        />,
      );
      card = container.firstChild;
      expect(card).toHaveClass('bg-transparent', 'border-gray-600');

      rerender(
        <Card
          title="Test"
          variant="minimal"
        />,
      );
      card = container.firstChild;
      expect(card).toHaveClass('bg-gray-900', 'border-gray-800');
    });

    test('applies size classes correctly', () => {
      const { container, rerender } = render(
        <Card
          title="Test"
          size="sm"
        />,
      );
      let card = container.firstChild;
      expect(card).toHaveClass('p-3');

      rerender(
        <Card
          title="Test"
          size="lg"
        />,
      );
      card = container.firstChild;
      expect(card).toHaveClass('p-6');
    });

    test('handles interactive mode with click', () => {
      const onClickMock = jest.fn();
      const { container } = render(
        <Card
          title="Interactive Card"
          interactive={true}
          onClick={onClickMock}
        />,
      );

      const card = container.firstChild;
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');

      fireEvent.click(card);
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard interaction for interactive cards', () => {
      const onClickMock = jest.fn();
      const { container } = render(
        <Card
          title="Interactive Card"
          interactive={true}
          onClick={onClickMock}
        />,
      );

      const card = container.firstChild;
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onClickMock).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card, { key: 'Space' });
      expect(onClickMock).toHaveBeenCalledTimes(1); // Should still be 1, not 2
    });

    test('applies status indicator classes', () => {
      const { container, rerender } = render(
        <Card
          title="Test"
          status="success"
        />,
      );
      let card = container.firstChild;
      expect(card).toHaveClass('border-l-4', 'border-l-green-500');

      rerender(
        <Card
          title="Test"
          status="error"
        />,
      );
      card = container.firstChild;
      expect(card).toHaveClass('border-l-4', 'border-l-red-500');

      rerender(
        <Card
          title="Test"
          status="warning"
        />,
      );
      card = container.firstChild;
      expect(card).toHaveClass('border-l-4', 'border-l-yellow-500');

      rerender(
        <Card
          title="Test"
          status="info"
        />,
      );
      card = container.firstChild;
      expect(card).toHaveClass('border-l-4', 'border-l-blue-500');
    });

    test('renders header actions when provided', () => {
      render(
        <Card
          title="Test"
          headerActions={<button>Action</button>}
        />,
      );

      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    test('gracefully handles invalid variant and size', () => {
      const { container } = render(
        <Card
          title="Test"
          variant="invalid"
          size="invalid"
        />,
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-gray-800'); // Should fallback to default
      expect(card).toHaveClass('p-4'); // Should fallback to md
    });

    test('applies custom className', () => {
      const { container } = render(
        <Card
          title="Test"
          className="custom-class"
        />,
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('CardGrid', () => {
    test('renders children in grid layout', () => {
      render(
        <CardGrid>
          <Card title="Card 1" />
          <Card title="Card 2" />
        </CardGrid>,
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });

    test('applies column classes correctly', () => {
      const { container, rerender } = render(
        <CardGrid columns={2}>
          <Card title="Card 1" />
        </CardGrid>,
      );
      let grid = container.firstChild;
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');

      rerender(
        <CardGrid columns={4}>
          <Card title="Card 1" />
        </CardGrid>,
      );
      grid = container.firstChild;
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    test('applies gap classes correctly', () => {
      const { container, rerender } = render(
        <CardGrid gap="sm">
          <Card title="Card 1" />
        </CardGrid>,
      );
      let grid = container.firstChild;
      expect(grid).toHaveClass('gap-3');

      rerender(
        <CardGrid gap="lg">
          <Card title="Card 1" />
        </CardGrid>,
      );
      grid = container.firstChild;
      expect(grid).toHaveClass('gap-6');
    });

    test('handles invalid columns and gap gracefully', () => {
      const { container } = render(
        <CardGrid
          columns="invalid"
          gap="invalid"
        >
          <Card title="Card 1" />
        </CardGrid>,
      );

      const grid = container.firstChild;
      expect(grid).toHaveClass('xl:grid-cols-4'); // Should fallback to auto
      expect(grid).toHaveClass('gap-4'); // Should fallback to md
    });
  });

  describe('CardList', () => {
    test('renders children in stacked layout', () => {
      render(
        <CardList>
          <Card title="Card 1" />
          <Card title="Card 2" />
        </CardList>,
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });

    test('applies gap classes correctly', () => {
      const { container, rerender } = render(
        <CardList gap="sm">
          <Card title="Card 1" />
        </CardList>,
      );
      let list = container.firstChild;
      expect(list).toHaveClass('space-y-3');

      rerender(
        <CardList gap="lg">
          <Card title="Card 1" />
        </CardList>,
      );
      list = container.firstChild;
      expect(list).toHaveClass('space-y-6');
    });
  });

  describe('CardField', () => {
    test('renders label and value', () => {
      render(
        <CardField
          label="Name"
          value="John Doe"
        />,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('renders with number value', () => {
      render(
        <CardField
          label="Age"
          value={25}
        />,
      );

      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    test('renders with zero value', () => {
      render(
        <CardField
          label="Count"
          value={0}
        />,
      );

      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('does not render when value is null or undefined', () => {
      const { container } = render(
        <CardField
          label="Empty"
          value={null}
        />,
      );
      expect(container).toBeEmptyDOMElement();

      const { container: container2 } = render(
        <CardField
          label="Empty"
          value={undefined}
        />,
      );
      expect(container2).toBeEmptyDOMElement();
    });

    test('does not render when value is empty string', () => {
      const { container } = render(
        <CardField
          label="Empty"
          value=""
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    test('applies custom className', () => {
      render(
        <CardField
          label="Test"
          value="Value"
          className="custom-field"
        />,
      );

      const field = screen.getByText('Test').closest('div');
      expect(field).toHaveClass('custom-field');
    });
  });

  describe('CardActions', () => {
    test('renders action buttons', () => {
      render(
        <CardActions>
          <button>Save</button>
          <button>Cancel</button>
        </CardActions>,
      );

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('applies alignment classes correctly', () => {
      const { container, rerender } = render(
        <CardActions align="left">
          <button>Action</button>
        </CardActions>,
      );
      let actions = container.firstChild;
      expect(actions).toHaveClass('justify-start');

      rerender(
        <CardActions align="center">
          <button>Action</button>
        </CardActions>,
      );
      actions = container.firstChild;
      expect(actions).toHaveClass('justify-center');

      rerender(
        <CardActions align="between">
          <button>Action</button>
        </CardActions>,
      );
      actions = container.firstChild;
      expect(actions).toHaveClass('justify-between');
    });

    test('defaults to right alignment', () => {
      const { container } = render(
        <CardActions>
          <button>Action</button>
        </CardActions>,
      );

      const actions = container.firstChild;
      expect(actions).toHaveClass('justify-end');
    });

    test('handles invalid alignment gracefully', () => {
      const { container } = render(
        <CardActions align="invalid">
          <button>Action</button>
        </CardActions>,
      );

      const actions = container.firstChild;
      expect(actions).toHaveClass('justify-end'); // Should fallback to right
    });
  });

  describe('Cards namespace export', () => {
    test('exports all components in Cards object', () => {
      expect(Cards.Card).toBe(Card);
      expect(Cards.CardGrid).toBe(CardGrid);
      expect(Cards.CardList).toBe(CardList);
      expect(Cards.CardField).toBe(CardField);
      expect(Cards.CardActions).toBe(CardActions);
    });
  });

  describe('Accessibility', () => {
    test('Card has proper semantic structure', () => {
      render(
        <Card
          title="Test Card"
          subtitle="Subtitle"
        >
          <p>Content</p>
        </Card>,
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Card');
    });

    test('Interactive card has proper button role and keyboard support', () => {
      const onClickMock = jest.fn();
      render(
        <Card
          title="Interactive"
          interactive={true}
          onClick={onClickMock}
        />,
      );

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    test('CardField uses proper definition list semantics', () => {
      render(
        <CardField
          label="Label"
          value="Value"
        />,
      );

      const term = screen.getByText('Label');
      const definition = screen.getByText('Value');

      expect(term.tagName).toBe('DT');
      expect(definition.tagName).toBe('DD');
    });
  });
});
