// NotesModal.js - Business Component
// Uses: Modal, FormComponents, SearchBar for full CRUD notes management

/**
 * NotesModal - Business Component for Notes Management
 * Full CRUD functionality for case notes with category field and RTF text capabilities
 */

function NotesModal({
  isOpen,
  onClose,
  caseId,
  notes = [],
  onNotesUpdate,
  caseData,
  fullData,
}) {
  const e = window.React?.createElement;
  const { useState, useEffect, useMemo } = window.React;

  // Look up person name using the helper function
  const person = window.findPersonById(fullData?.people, caseData?.personId);
  const clientName = person ? person.name : 'Unknown Client';
  const mcn = caseData?.mcn || 'No MCN';

  // State management
  const [notesList, setNotesList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    text: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note categories for dropdown
  const noteCategories = useMemo(
    () => [
      { id: 'application-status', name: 'Application Status' },
      { id: 'medical', name: 'Medical' },
      { id: 'financial', name: 'Financial' },
      { id: 'contact', name: 'Contact' },
      { id: 'services', name: 'Services' },
      { id: 'documentation', name: 'Documentation' },
      { id: 'follow-up', name: 'Follow-up' },
      { id: 'administrative', name: 'Administrative' },
      { id: 'general', name: 'General' },
    ],
    []
  );

  // Initialize notes list
  useEffect(() => {
    if (isOpen && notes) {
      setNotesList(
        [...notes].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      );
    }
  }, [isOpen, notes]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({ category: '', text: '' });
    setFormErrors({});
    setCurrentNote(null);
    setIsEditMode(false);
    setIsSubmitting(false);

    // Enhanced focus management for state change to view mode
    if (window.NightingaleFocusManager) {
      setTimeout(() => {
        window.NightingaleFocusManager.focusStateChange(
          '.modal-container', // Target the modal container
          'view',
          {
            onFocused: (element) => {
              console.debug(
                'Notes modal view mode focused:',
                element.tagName,
                element.type || ''
              );
            },
          }
        );
      }, 100);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.category?.trim()) {
      errors.category = 'Category is required';
    }

    if (!formData.text?.trim()) {
      errors.text = 'Note text is required';
    } else if (formData.text.trim().length < 3) {
      errors.text = 'Note text must be at least 3 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleCategorySelect = (category) => {
    handleInputChange('category', category.name);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const noteData = {
        id: currentNote?.id || Date.now(), // Use timestamp as ID for new notes
        category: formData.category.trim(),
        text: formData.text.trim(),
        timestamp: currentNote?.timestamp || new Date().toISOString(),
      };

      let updatedNotes;

      if (currentNote) {
        // Update existing note
        updatedNotes = notesList.map((note) =>
          note.id === currentNote.id ? noteData : note
        );
      } else {
        // Add new note
        updatedNotes = [noteData, ...notesList];
      }

      setNotesList(updatedNotes);

      // Notify parent component
      if (onNotesUpdate) {
        onNotesUpdate(caseId, updatedNotes);
      }

      // Show success message
      if (window.showToast) {
        window.showToast(
          currentNote ? 'Note updated successfully' : 'Note added successfully',
          'success'
        );
      }

      resetForm();
    } catch (error) {
      if (typeof window !== 'undefined' && window.Nightingale?.handleError) {
        window.Nightingale.handleError(error, 'NotesModal.saveNote', {
          showToast: true,
          userMessage: 'Error saving note. Please try again.',
          context: { noteContent: editingNote.content.substring(0, 100) }
        });
      } else {
        console.error('Error saving note:', error);
      }
      if (window.showToast) {
        window.showToast('Error saving note. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note) => {
    setCurrentNote(note);
    setFormData({
      category: note.category,
      text: note.text,
    });
    setIsEditMode(true);
    setFormErrors({});

    // Enhanced focus management for state change to edit mode
    if (window.NightingaleFocusManager) {
      setTimeout(() => {
        window.NightingaleFocusManager.focusStateChange(
          '.modal-container', // Target the modal container
          'edit',
          {
            preferredSelectors: [
              '.form-field input[placeholder*="category" i]', // Category input by placeholder (case insensitive)
              '.form-field input[placeholder*="Select or type" i]', // SearchBar placeholder
              '.form-field .relative input', // Input within relative container (SearchBar structure)
              '.form-field input:first-of-type', // First input in any form field
              'input:not([disabled]):not([readonly]):not([type="hidden"])', // Any available input
              'select:not([disabled])',
              'textarea:not([disabled]):not([readonly])',
              'button:not([disabled])',
            ],
            delay: 200, // Longer delay for SearchBar initialization
            onFocused: (element) => {
              console.debug(
                'Notes modal edit mode focused:',
                element.tagName,
                element.type || '',
                element.placeholder || '',
                element.className || ''
              );
            },
            onFailed: (attemptedSelectors) => {
              console.warn(
                'Notes modal edit mode focus failed. Attempted selectors:',
                attemptedSelectors
              );
              // Debug: show what elements are actually available
              const availableInputs = document.querySelectorAll(
                '.modal-container input'
              );
              console.debug(
                'Available inputs:',
                Array.from(availableInputs).map((el) => ({
                  tag: el.tagName,
                  type: el.type,
                  placeholder: el.placeholder,
                  className: el.className,
                  disabled: el.disabled,
                  readonly: el.readOnly,
                }))
              );
            },
          }
        );
      }, 50); // Quick timeout for DOM update
    }
  };

  const handleDelete = async (noteId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this note? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const updatedNotes = notesList.filter((note) => note.id !== noteId);
      setNotesList(updatedNotes);

      // Notify parent component
      if (onNotesUpdate) {
        onNotesUpdate(caseId, updatedNotes);
      }

      if (window.showToast) {
        window.showToast('Note deleted successfully', 'success');
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.Nightingale?.handleError) {
        window.Nightingale.handleError(error, 'NotesModal.deleteNote', {
          showToast: true,
          userMessage: 'Error deleting note. Please try again.',
          context: { noteId: noteToDelete.id }
        });
      } else {
        console.error('Error deleting note:', error);
      }
      if (window.showToast) {
        window.showToast('Error deleting note. Please try again.', 'error');
      }
    }
  };

  const renderNoteForm = () => {
    return e(
      'div',
      { className: 'space-y-4' },

      // Category field with dropdown search
      e(
        window.FormField,
        {
          label: 'Category',
          required: true,
          error: formErrors.category,
        },
        e(window.SearchBar, {
          value: formData.category,
          onChange: (event) => {
            // Handle input change events from typing
            const value = event?.target?.value || event;
            if (typeof value === 'string') {
              handleInputChange('category', value);
            }
          },
          placeholder: 'Select or type a category...',
          data: noteCategories,
          searchKeys: ['name'],
          showDropdown: true,
          onResultSelect: handleCategorySelect,
          renderResult: (category) => e('span', null, category.name),
          className:
            'w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 notes-category-search',
          maxResults: 6,
        })
      ),

      // Text field (RTF-capable textarea)
      e(
        window.FormField,
        {
          label: 'Note Text',
          required: true,
          error: formErrors.text,
        },
        e(window.Textarea, {
          value: formData.text,
          onChange: (e) => handleInputChange('text', e.target.value),
          placeholder: 'Enter note details...',
          rows: 6,
          className:
            'w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-vertical',
        })
      )
    );
  };

  const renderNotesList = () => {
    if (notesList.length === 0) {
      return e(
        'div',
        { className: 'text-center py-8 text-gray-400' },
        e('p', null, 'No notes found for this case.'),
        e(
          'p',
          { className: 'text-sm mt-2' },
          'Click "Add New Note" to create the first note.'
        )
      );
    }

    return e(
      'div',
      { className: 'space-y-4 max-h-96 overflow-y-auto' },
      notesList.map((note) =>
        e(
          'div',
          {
            key: note.id,
            className: 'bg-gray-700 rounded-lg p-4 border border-gray-600',
          },

          // Note header
          e(
            'div',
            { className: 'flex justify-between items-start mb-3' },
            e(
              'div',
              { className: 'flex-1' },
              e(
                'div',
                { className: 'flex items-center gap-2 mb-1' },
                e(window.Badge, {
                  variant: 'info',
                  size: 'sm',
                  text: note.category,
                }),
                e(
                  'span',
                  { className: 'text-xs text-gray-400' },
                  window.dayjs
                    ? window.dayjs(note.timestamp).format('MMM D, YYYY h:mm A')
                    : new Date(note.timestamp).toLocaleString()
                )
              )
            ),

            // Action buttons
            e(
              'div',
              { className: 'flex gap-2' },
              e(window.Button, {
                variant: 'secondary',
                size: 'sm',
                onClick: () => handleEdit(note),
                children: 'Edit',
              }),
              e(window.Button, {
                variant: 'danger',
                size: 'sm',
                onClick: () => handleDelete(note.id),
                children: 'Delete',
              })
            )
          ),

          // Note text
          e(
            'div',
            { className: 'text-gray-200 whitespace-pre-wrap break-words' },
            note.text
          )
        )
      )
    );
  };

  const modalActions = [
    {
      label: 'Cancel',
      variant: 'secondary',
      onClick: () => {
        if (isEditMode) {
          resetForm(); // Return to view mode without closing modal
        } else {
          onClose(); // Close modal when in view mode
        }
      },
    },
  ];

  if (isEditMode) {
    modalActions.push({
      label: isSubmitting
        ? 'Saving...'
        : currentNote
          ? 'Save Changes'
          : 'Add Note',
      variant: 'primary',
      onClick: handleSubmit,
      disabled: isSubmitting,
    });
  } else {
    modalActions.push({
      label: 'Add New Note',
      variant: 'primary',
      onClick: () => {
        setIsEditMode(true);

        // Enhanced focus management for state change to edit mode (new note)
        if (window.NightingaleFocusManager) {
          setTimeout(() => {
            window.NightingaleFocusManager.focusStateChange(
              '.modal-container', // Target the modal container
              'edit',
              {
                preferredSelectors: [
                  '.notes-category-search input', // Specific category SearchBar input
                  'input[placeholder*="category" i]', // Category input by placeholder (case insensitive)
                  'input[placeholder*="Select or type" i]', // SearchBar placeholder
                  '.space-y-2 .relative .relative input', // SearchBar: FormField > div > SearchBar > div > input
                  '.space-y-2 .relative input', // SearchBar fallback: FormField > SearchBar > input
                  '.relative .relative input', // Any nested relative containers with input
                  'input:not([disabled]):not([readonly]):not([type="hidden"])', // Any available input
                  'select:not([disabled])',
                  'textarea:not([disabled]):not([readonly])',
                  'button:not([disabled])',
                ],
                delay: 200, // Longer delay for SearchBar initialization
                onFocused: (element) => {
                  console.debug(
                    'Notes modal add mode focused:',
                    element.tagName,
                    element.type || '',
                    element.placeholder || '',
                    element.className || ''
                  );
                },
                onFailed: (attemptedSelectors) => {
                  console.warn(
                    'Notes modal add mode focus failed. Attempted selectors:',
                    attemptedSelectors
                  );
                  // Debug: show what elements are actually available
                  const availableInputs = document.querySelectorAll(
                    '.modal-container input'
                  );
                  console.debug(
                    'Available inputs:',
                    Array.from(availableInputs).map((el) => ({
                      tag: el.tagName,
                      type: el.type,
                      placeholder: el.placeholder,
                      className: el.className,
                      disabled: el.disabled,
                      readonly: el.readOnly,
                    }))
                  );
                },
              }
            );
          }, 50); // Quick timeout for DOM update
        }
      },
    });
  }

  // Create footer content from actions
  const footerContent = e(
    window.React.Fragment,
    {},
    ...modalActions.map((action, index) =>
      e(window.Button, {
        key: index,
        variant: action.variant,
        onClick: action.onClick,
        disabled: action.disabled,
        children: action.label,
      })
    )
  );

  return e(
    window.Modal,
    {
      isOpen,
      onClose: () => {
        resetForm();
        onClose();
      },
      title: `Notes - ${clientName} (MCN: ${mcn})`,
      size: 'default',
      footerContent: footerContent,
    },

    // Modal content
    e(
      'div',
      { className: 'space-y-6' },

      // Form section (shown when adding/editing)
      isEditMode &&
        e(
          'div',
          { className: 'border-b border-gray-600 pb-6' },
          e(
            'h3',
            { className: 'text-lg font-medium text-white mb-4' },
            currentNote ? 'Edit Note' : 'Add New Note'
          ),
          renderNoteForm()
        ),

      // Notes list section (only show when not in edit mode)
      !isEditMode &&
        e(
          'div',
          null,
          e(
            'h3',
            { className: 'text-lg font-medium text-white mb-4' },
            `Existing Notes (${notesList.length})`
          ),
          renderNotesList()
        )
    )
  );
}

// Register with Business Components
if (typeof window !== 'undefined') {
  window.NotesModal = NotesModal;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent('NotesModal', NotesModal);
  }
}
