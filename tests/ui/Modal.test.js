/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Modal } from '../../src/components/ui/Modal.js';

describe('Modal Component', () => {
  beforeEach(() => {
    // Mock createPortal to render in place for testing
    jest
      .spyOn(require('react-dom'), 'createPortal')
      .mockImplementation((element, container) => element);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(
      React.createElement(Modal, {
        isOpen: false,
        title: 'Test Modal',
        children: 'Modal content',
      })
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Test Modal',
        children: 'Modal content',
      })
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Test Modal',
        onClose: handleClose,
        children: 'Modal content',
      })
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('hides close button when showCloseButton is false', () => {
    render(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Test Modal',
        showCloseButton: false,
        children: 'Modal content',
      })
    );

    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });

  test('renders footer content when provided', () => {
    const footerContent = React.createElement('button', {}, 'Footer Button');

    render(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Test Modal',
        footerContent: footerContent,
        children: 'Modal content',
      })
    );

    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });

  test('applies different size classes', () => {
    const { rerender } = render(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Small Modal',
        size: 'small',
        children: 'Content',
      })
    );

    let modal = screen.getByRole('dialog').querySelector('div');
    expect(modal).toHaveClass('max-w-md');

    rerender(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Large Modal',
        size: 'large',
        children: 'Content',
      })
    );

    modal = screen.getByRole('dialog').querySelector('div');
    expect(modal).toHaveClass('max-w-4xl');
  });

  test('applies custom className', () => {
    render(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Custom Modal',
        className: 'custom-modal-class',
        children: 'Content',
      })
    );

    const modal = screen.getByRole('dialog').querySelector('div');
    expect(modal).toHaveClass('custom-modal-class');
  });

  test('renders without title when not provided', () => {
    render(
      React.createElement(Modal, {
        isOpen: true,
        children: 'Modal content without title',
      })
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal content without title')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('sets aria attributes correctly', () => {
    render(
      React.createElement(Modal, {
        isOpen: true,
        title: 'Accessible Modal',
        children: 'Content',
      })
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');

    const title = screen.getByText('Accessible Modal');
    expect(title).toHaveAttribute('id', 'modal-title');
  });
});
