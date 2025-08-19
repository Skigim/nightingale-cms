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
  const e = window.React.createElement;
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
      console.error('Error saving note:', error);
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
      console.error('Error deleting note:', error);
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
            'w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400',
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
      onClick: () => setIsEditMode(true),
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
