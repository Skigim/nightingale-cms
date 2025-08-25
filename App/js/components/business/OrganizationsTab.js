// App/js/components/business/OrganizationsTab.js

function OrganizationsTab({
  fullData,
  onUpdateData,
  fileService,
  onViewModeChange,
  onBackToList,
}) {
  // React hooks MUST be called unconditionally - they must run in the same order every time
  const { useState, useMemo, useEffect, useCallback } = window.React || {};

  // All state hooks must be called even if React isn't available
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [confirmingOrganizationDelete, setConfirmingOrganizationDelete] =
    useState(null);

  // Back to list function that can be called externally (simplified since no details view)
  const backToList = useCallback(() => {
    onViewModeChange?.('list');
  }, [onViewModeChange]);

  // Expose the back function to parent
  useEffect(() => {
    if (onBackToList) {
      onBackToList(() => backToList);
    }
  }, [onBackToList, backToList]);

  // Filter organizations (DataTable handles sorting)
  const filteredOrganizations = useMemo(() => {
    if (!fullData?.organizations) return [];

    let filtered = fullData.organizations;

    // Apply search filter only (DataTable component handles sorting)
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((org) => {
        return (
          org.name?.toLowerCase().includes(term) ||
          org.type?.toLowerCase().includes(term) ||
          org.email?.toLowerCase().includes(term) ||
          org.phone?.includes(term) ||
          org.address?.toLowerCase().includes(term) ||
          org.status?.toLowerCase().includes(term)
        );
      });
    }

    return filtered;
  }, [fullData, searchTerm]);

  // Early return AFTER all hooks are called
  if (!window.React) {
    return null;
  }

  const e = window.React.createElement;

  // Access components from their respective registries with fallbacks
  const uiRegistry = window.NightingaleUI || {};
  const businessRegistry = window.NightingaleBusiness || {};

  // UI Components with fallbacks - use proper registry access
  const PrimaryButton =
    uiRegistry.components?.PrimaryButton ||
    uiRegistry.PrimaryButton ||
    window.PrimaryButton ||
    (({ children, ...props }) =>
      e(
        'button',
        { ...props, className: 'bg-blue-600 text-white px-4 py-2 rounded' },
        children
      ));
  const SecondaryButton =
    uiRegistry.components?.SecondaryButton ||
    uiRegistry.SecondaryButton ||
    window.SecondaryButton ||
    (({ children, ...props }) =>
      e(
        'button',
        { ...props, className: 'bg-gray-600 text-white px-4 py-2 rounded' },
        children
      ));
  const DangerButton =
    uiRegistry.components?.DangerButton ||
    uiRegistry.DangerButton ||
    window.DangerButton ||
    (({ children, ...props }) =>
      e(
        'button',
        { ...props, className: 'bg-red-600 text-white px-4 py-2 rounded' },
        children
      ));
  const SuccessButton =
    uiRegistry.components?.SuccessButton ||
    uiRegistry.SuccessButton ||
    window.SuccessButton ||
    (({ children, ...props }) =>
      e(
        'button',
        { ...props, className: 'bg-green-600 text-white px-4 py-2 rounded' },
        children
      ));
  const SearchBar =
    uiRegistry.components?.SearchBar ||
    uiRegistry.SearchBar ||
    window.SearchBar ||
    (({ value, onChange, placeholder, ...props }) =>
      e('input', {
        ...props,
        type: 'text',
        value,
        onChange,
        placeholder,
        className: 'w-full p-2 bg-gray-700 text-white rounded',
      }));
  const DataTable =
    uiRegistry.components?.DataTable ||
    window.DataTable ||
    uiRegistry.DataTable ||
    (({ data = [], emptyMessage = 'No data' }) => {
      return e(
        'div',
        {
          className:
            'text-center p-4 text-gray-400 border border-gray-600 rounded',
        },
        data.length
          ? 'DataTable component not loaded - please refresh the page'
          : emptyMessage
      );
    });
  const Badge =
    uiRegistry.components?.Badge ||
    uiRegistry.Badge ||
    window.Badge ||
    (({ children, variant = 'secondary' }) =>
      e(
        'span',
        {
          className: `inline-block px-2 py-1 text-xs rounded ${variant === 'success' ? 'bg-green-600' : variant === 'warning' ? 'bg-yellow-600' : 'bg-gray-600'} text-white`,
        },
        children
      ));
  const ConfirmationModal =
    uiRegistry.components?.ConfirmationModal ||
    uiRegistry.ConfirmationModal ||
    window.ConfirmationModal ||
    (({ isOpen, children }) =>
      isOpen
        ? e(
            'div',
            {
              className:
                'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center',
            },
            e('div', { className: 'bg-gray-800 p-6 rounded' }, children)
          )
        : null);

  // Business Components with fallbacks
  const OrganizationModal =
    businessRegistry.components?.OrganizationModal ||
    businessRegistry.OrganizationModal ||
    window.OrganizationModal ||
    (({ isOpen }) =>
      isOpen
        ? e(
            'div',
            {
              className:
                'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center',
            },
            e(
              'div',
              { className: 'bg-gray-800 p-6 rounded' },
              'Organization Modal not loaded'
            )
          )
        : null);

  // Back to list function that can be called externally (simplified since no details view)

  // Expose the back function to parent

  // Filter organizations (DataTable handles sorting)

  const handleOrganizationClick = (organization) => {
    setSelectedOrganization(organization);
    setIsDetailsModalOpen(true);
  };

  const handleViewSummary = (organization, e) => {
    e.stopPropagation();
    setSelectedOrganization(organization);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteOrganization = (organization, e) => {
    e.stopPropagation();
    setConfirmingOrganizationDelete(organization.id);
  };

  const confirmOrganizationDelete = (organization) => {
    const updatedData = { ...fullData };
    updatedData.organizations = updatedData.organizations.filter(
      (o) => o.id !== organization.id
    );
    onUpdateData(updatedData);
    window.showToast(
      `Organization ${organization.name} deleted successfully`,
      'success'
    );
    setConfirmingOrganizationDelete(null);
  };

  const cancelOrganizationDelete = () => {
    setConfirmingOrganizationDelete(null);
  };

  const handleStartEdit = (organization) => {
    setEditingRowId(organization.id);
    setEditValues({
      name: organization.name || '',
      type: organization.type || '',
      email: organization.email || '',
      phone: organization.phone || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditValues({});
  };

  const handleSaveEdit = async (organization) => {
    try {
      const updatedData = { ...fullData };
      const orgIndex = updatedData.organizations.findIndex(
        (o) => o.id === organization.id
      );
      if (orgIndex !== -1) {
        updatedData.organizations[orgIndex] = {
          ...updatedData.organizations[orgIndex],
          name: editValues.name,
          type: editValues.type,
          email: editValues.email,
          phone: editValues.phone,
        };
        await fileService.writeFile(updatedData);
        onUpdateData(updatedData);
        setEditingRowId(null);
        setEditValues({});
        window.showToast('Organization updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      window.showToast('Error saving organization', 'error');
    }
  };

  return e(
    'div',
    { className: 'w-full space-y-4' },
    // Compact Header Bar
    e(
      'div',
      {
        className:
          'flex items-center justify-between bg-gray-800 p-3 rounded-lg shadow-md',
      },
      e(
        'div',
        { className: 'flex items-center' },
        e(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            className: 'h-5 w-5 mr-2 text-purple-400',
            fill: 'none',
            viewBox: '0 0 24 24',
            stroke: 'currentColor',
          },
          e('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
          })
        ),
        e(
          'span',
          { className: 'font-bold text-white' },
          'Organizations Management'
        ),
        e(
          'span',
          { className: 'ml-3 text-sm text-gray-400' },
          `${filteredOrganizations.length} organizations`
        )
      ),
      e(PrimaryButton, {
        onClick: () => setIsCreateModalOpen(true),
        icon: 'add',
        children: 'Add New Organization',
      })
    ),

    // Search Bar
    e(
      'div',
      {
        className: 'bg-gray-800 rounded-lg p-4 border border-gray-700 w-full',
      },
      e(
        'div',
        { className: 'flex items-center space-x-4' },
        e(
          'div',
          { className: 'flex-1' },
          e(SearchBar, {
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder:
              'Search organizations by name, type, email, or phone...',
            className: 'w-full',
            size: 'md',
            showClearButton: true,
            onClear: () => setSearchTerm(''),
          })
        )
      )
    ),

    // Organizations Table with DataTable Component
    e(DataTable, {
      data: filteredOrganizations,
      columns: [
        {
          field: 'name',
          label: 'Organization Name',
          sortable: true,
          render: (value, org) =>
            editingRowId === org?.id
              ? e('input', {
                  type: 'text',
                  value: editValues.name,
                  onChange: (e) =>
                    setEditValues({ ...editValues, name: e.target.value }),
                  className:
                    'bg-gray-700 text-white px-2 py-1 rounded border border-gray-600',
                })
              : e(
                  'div',
                  { className: 'font-medium text-white' },
                  org?.name || 'N/A'
                ),
        },
        {
          field: 'type',
          label: 'Type',
          sortable: true,
          render: (value, org) =>
            editingRowId === org?.id
              ? e(
                  'select',
                  {
                    value: editValues.type,
                    onChange: (e) =>
                      setEditValues({ ...editValues, type: e.target.value }),
                    className:
                      'bg-gray-700 text-white px-2 py-1 rounded border border-gray-600',
                  },
                  e('option', { value: '' }, 'Select Type'),
                  e('option', { value: 'healthcare' }, 'Healthcare'),
                  e('option', { value: 'insurance' }, 'Insurance'),
                  e('option', { value: 'government' }, 'Government'),
                  e('option', { value: 'nonprofit' }, 'Nonprofit'),
                  e('option', { value: 'legal' }, 'Legal'),
                  e('option', { value: 'other' }, 'Other')
                )
              : e(
                  'div',
                  { className: 'text-gray-300' },
                  org?.type
                    ? org.type.charAt(0).toUpperCase() + org.type.slice(1)
                    : 'N/A'
                ),
        },
        {
          field: 'email',
          label: 'Email',
          sortable: true,
          render: (value, org) =>
            editingRowId === org?.id
              ? e('input', {
                  type: 'email',
                  value: editValues.email,
                  onChange: (e) =>
                    setEditValues({ ...editValues, email: e.target.value }),
                  className:
                    'bg-gray-700 text-white px-2 py-1 rounded border border-gray-600',
                })
              : e('div', { className: 'text-gray-300' }, org?.email || 'N/A'),
        },
        {
          field: 'phone',
          label: 'Phone',
          sortable: true,
          render: (value, org) =>
            editingRowId === org?.id
              ? e('input', {
                  type: 'tel',
                  value: editValues.phone,
                  onChange: (e) =>
                    setEditValues({ ...editValues, phone: e.target.value }),
                  className:
                    'bg-gray-700 text-white px-2 py-1 rounded border border-gray-600',
                })
              : e('div', { className: 'text-gray-300' }, org?.phone || 'N/A'),
        },
        {
          field: 'status',
          label: 'Status',
          sortable: true,
          render: (value, org) => {
            const status = org.status || 'active';
            return e(Badge, {
              variant:
                status === 'active'
                  ? 'success'
                  : status === 'pending'
                    ? 'warning'
                    : 'secondary',
              children: status.charAt(0).toUpperCase() + status.slice(1),
            });
          },
        },
        {
          field: 'actions',
          label: 'Actions',
          sortable: false,
          render: (value, org) =>
            editingRowId === org.id
              ? e(
                  'div',
                  { className: 'flex space-x-2' },
                  e(SuccessButton, {
                    onClick: () => handleSaveEdit(org),
                    size: 'xs',
                    icon: 'save',
                    children: 'Save',
                  }),
                  e(SecondaryButton, {
                    onClick: handleCancelEdit,
                    size: 'xs',
                    children: 'Cancel',
                  })
                )
              : e(
                  'div',
                  { className: 'flex space-x-2' },
                  e(SecondaryButton, {
                    onClick: (e) => handleViewSummary(org, e),
                    size: 'xs',
                    icon: 'view',
                    children: 'View',
                  }),
                  e(SecondaryButton, {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleStartEdit(org);
                    },
                    size: 'xs',
                    icon: 'edit',
                    children: 'Edit',
                  }),
                  e(DangerButton, {
                    onClick: (e) => handleDeleteOrganization(org, e),
                    size: 'xs',
                    icon: 'delete',
                    children: 'Delete',
                  })
                ),
        },
      ],
      onRowClick: handleOrganizationClick,
      className: 'w-full',
      emptyMessage: 'No organizations found',
    }),

    // Delete Confirmation Modal
    confirmingOrganizationDelete &&
      e(ConfirmationModal, {
        isOpen: true,
        onClose: cancelOrganizationDelete,
        onConfirm: () => {
          const org = fullData.organizations.find(
            (o) => o.id === confirmingOrganizationDelete
          );
          confirmOrganizationDelete(org);
        },
        title: 'Delete Organization',
        message: `Are you sure you want to delete this organization? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
      }),

    // Organization Details/Edit Modal
    isDetailsModalOpen &&
      selectedOrganization &&
      e(OrganizationModal, {
        isOpen: isDetailsModalOpen,
        onClose: () => setIsDetailsModalOpen(false),
        editOrganizationId: selectedOrganization.id,
        fullData,
        fileService,
        onOrganizationCreated: (updatedData) => {
          onUpdateData(updatedData);
          setIsDetailsModalOpen(false);
        },
      }),

    // Create Organization Modal
    isCreateModalOpen &&
      e(OrganizationModal, {
        isOpen: isCreateModalOpen,
        onClose: () => setIsCreateModalOpen(false),
        fullData,
        fileService,
        onOrganizationCreated: (newOrganizationData) => {
          onUpdateData(newOrganizationData);
          setIsCreateModalOpen(false);
        },
      })
  );
}

// PropTypes validation
OrganizationsTab.propTypes = {
  fullData: window.PropTypes?.object,
  onUpdateData: window.PropTypes?.func,
  fileService: window.PropTypes?.object,
  onViewModeChange: window.PropTypes?.func,
  onBackToList: window.PropTypes?.func,
};

// Register with the business component registry
if (typeof window !== 'undefined') {
  window.OrganizationsTab = OrganizationsTab;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'OrganizationsTab',
      OrganizationsTab
    );
  }

  // Legacy registration for backward compatibility
  if (typeof window.Nightingale !== 'undefined') {
    window.Nightingale.registerComponent('OrganizationsTab', OrganizationsTab);
  }
}
