/* eslint-disable react/prop-types */
import { registerComponent } from '../../services/core';
/**
 * Nightingale Component Library - Modal System
 *
 * A comprehensive modal system that integrates with the Nightingale utilities
 * and provides consistent modal behavior across all applications.
 */

/**
 * Base Modal Component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to call when modal should close
 * @param {string} props.title - Modal title
 * @param {React.Element} props.children - Modal content
 * @param {React.Element} props.footerContent - Optional footer content
 * @param {string} props.size - Modal size: 'small', 'default', 'large', 'xlarge'
 * @param {boolean} props.showCloseButton - Whether to show the X close button
 * @param {string} props.className - Additional CSS classes
 * @returns {React.Element} Modal component
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  footerContent,
  size = 'default',
  showCloseButton = true,
  className = '',
}) {
  const e = window.React.createElement;

  // Use React hooks
  const { useEffect, useRef } = window.React;
  const modalRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Enhanced focus management using NightingaleFocusManager
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Use NightingaleFocusManager if available, fallback to basic focus
      if (window.NightingaleFocusManager) {
        window.NightingaleFocusManager.focusModalOpen(modalRef.current, {
          onFocused: () => {},
          onNoFocusable: () => {},
        });
      } else {
        // Fallback focus management
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
  };

  return e(
    'div',
    {
      className: 'fixed inset-0 z-50 overflow-auto pointer-events-none',
    },
    e(
      'div',
      {
        className:
          'flex items-center justify-center min-h-screen p-4 pointer-events-none',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': title ? 'modal-title' : undefined,
      },
      e(
        'div',
        {
          ref: modalRef,
          className: `bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden pointer-events-auto ${className}`,
        }, // Header
        title &&
          e(
            'div',
            {
              className:
                'flex items-center justify-between p-6 border-b border-gray-700',
            },
            e(
              'h3',
              {
                id: 'modal-title',
                className: 'text-lg font-semibold text-white',
              },
              title,
            ),
            showCloseButton &&
              e(
                'button',
                {
                  onClick: onClose,
                  className: 'text-gray-400 hover:text-white transition-colors',
                  'aria-label': 'Close modal',
                },
                e(
                  'svg',
                  {
                    className: 'w-6 h-6',
                    fill: 'none',
                    viewBox: '0 0 24 24',
                    stroke: 'currentColor',
                  },
                  e('path', {
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    strokeWidth: 2,
                    d: 'M6 18L18 6M6 6l12 12',
                  }),
                ),
              ),
          ),

        // Body
        e('div', { className: 'p-6 overflow-auto max-h-[60vh]' }, children),

        // Footer
        footerContent &&
          e(
            'div',
            {
              className:
                'flex justify-end space-x-3 p-6 border-t border-gray-700',
            },
            footerContent,
          ),
      ),
    ),
  );
}

/**
 * Confirmation Modal Component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onConfirm - Function to call when confirmed
 * @param {function} props.onCancel - Function to call when cancelled
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Text for confirm button
 * @param {string} props.cancelText - Text for cancel button
 * @param {string} props.variant - Modal variant: 'danger', 'warning', 'info'
 * @returns {React.Element} Confirmation modal
 */
function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  const e = window.React.createElement;

  const getButtonClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
    switch (variant) {
      case 'danger':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white`;
      case 'info':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`;
      default:
        return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white`;
    }
  };

  const footerContent = e(
    window.React.Fragment,
    {},
    e(
      'button',
      {
        onClick: onCancel,
        className:
          'px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors',
      },
      cancelText,
    ),
    e(
      'button',
      {
        onClick: onConfirm,
        className: getButtonClasses(),
      },
      confirmText,
    ),
  );

  return e(
    Modal,
    {
      isOpen,
      onClose: onCancel,
      title,
      size: 'small',
      footerContent,
    },
    e('p', { className: 'text-gray-300' }, message),
  );
}

/**
 * Form Modal Component - integrates with Nightingale validators
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onSubmit - Function to call when form is submitted
 * @param {function} props.onCancel - Function to call when cancelled
 * @param {string} props.title - Modal title
 * @param {React.Element} props.children - Form content
 * @param {string} props.submitText - Text for submit button
 * @param {string} props.cancelText - Text for cancel button
 * @param {boolean} props.isValid - Whether the form is valid
 * @param {boolean} props.isSubmitting - Whether the form is submitting
 * @returns {React.Element} Form modal
 */
function FormModal({
  isOpen,
  onSubmit,
  onCancel,
  title,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  isValid = true,
  isSubmitting = false,
}) {
  const e = window.React.createElement;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && !isSubmitting && onSubmit) {
      onSubmit();
    }
  };

  const footerContent = e(
    window.React.Fragment,
    {},
    e(
      'button',
      {
        type: 'button',
        onClick: onCancel,
        disabled: isSubmitting,
        className:
          'px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors',
      },
      cancelText,
    ),
    e(
      'button',
      {
        type: 'submit',
        disabled: !isValid || isSubmitting,
        className:
          'px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors',
      },
      isSubmitting ? 'Saving...' : submitText,
    ),
  );

  return e(
    Modal,
    {
      isOpen,
      onClose: onCancel,
      title,
      footerContent,
    },
    e('form', { onSubmit: handleSubmit }, children),
  );
}

// Show toast notifications using the existing toast system
function showModalToast(message, type = 'success') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}

// Export components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Modal,
    ConfirmationModal,
    FormModal,
    showModalToast,
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.Modal = Modal;
  window.ConfirmationModal = ConfirmationModal;
  window.FormModal = FormModal;
  window.showModalToast = showModalToast;

  // Register with component system
  // New registry (ESM)
  registerComponent('ui', 'Modal', Modal);
  registerComponent('ui', 'ConfirmationModal', ConfirmationModal);
  registerComponent('ui', 'FormModal', FormModal);
}

// ES6 Module Export
export default Modal;
export { Modal, ConfirmationModal, FormModal };
