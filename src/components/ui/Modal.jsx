import React, { useEffect, useRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

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
 * @param {string} props.descriptionId - Optional aria-describedby ID for accessibility
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
  descriptionId,
}) {
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

  // Fallback to default size if invalid size provided
  const modalSizeClass = sizeClasses[size] || sizeClasses.default;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-auto pointer-events-auto"
      onClick={(e) => {
        // Close on backdrop click if onClose provided
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className="flex items-center justify-center min-h-screen p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={descriptionId}
      >
        <div
          ref={modalRef}
          className={`bg-gray-800 rounded-lg shadow-xl w-full ${modalSizeClass} max-h-[90vh] overflow-hidden pointer-events-auto ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3
                id="modal-title"
                className="text-lg font-semibold text-white"
              >
                {title}
              </h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6 overflow-auto max-h-[60vh]">{children}</div>

          {/* Footer */}
          {footerContent && (
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PropTypes for Modal component
Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  footerContent: PropTypes.node,
  size: PropTypes.oneOf(['small', 'default', 'large', 'xlarge']),
  showCloseButton: PropTypes.bool,
  className: PropTypes.string,
  descriptionId: PropTypes.string,
};

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

  const footerContent = (
    <Fragment>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
      >
        {cancelText}
      </button>
      <button
        onClick={onConfirm}
        className={getButtonClasses()}
      >
        {confirmText}
      </button>
    </Fragment>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="small"
      footerContent={footerContent}
    >
      <p className="text-gray-300">{message}</p>
    </Modal>
  );
}

// PropTypes for ConfirmationModal
ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning', 'info']),
};

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
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && !isSubmitting && onSubmit) {
      onSubmit();
    }
  };

  const footerContent = (
    <Fragment>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {cancelText}
      </button>
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        {isSubmitting ? 'Saving...' : submitText}
      </button>
    </Fragment>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footerContent={footerContent}
    >
      <form onSubmit={handleSubmit}>{children}</form>
    </Modal>
  );
}

// PropTypes for FormModal
FormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  isValid: PropTypes.bool,
  isSubmitting: PropTypes.bool,
};

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
// Register with UI registry (legacy global removal)
registerComponent('ui', 'Modal', Modal);
registerComponent('ui', 'ConfirmationModal', ConfirmationModal);
registerComponent('ui', 'FormModal', FormModal);

// ES6 Module Export
export default Modal;
export { Modal, ConfirmationModal, FormModal };
