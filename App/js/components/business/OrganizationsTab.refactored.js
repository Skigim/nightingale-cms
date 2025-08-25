// App/js/components/business/OrganizationsTab.refactored.js
// PROOF OF CONCEPT: OrganizationsTab using createBusinessComponent factory
// This demonstrates how the new factory standardizes Tab component architecture

/**
 * Data management hook for Organizations Tab
 * Implements all the data-related logic and state management
 */
function useOrganizationsData(props) {
  const {
    fullData,
    onUpdateData,
    fileService,
    onViewModeChange,
    onBackToList,
  } = props;
  const { useState, useMemo, useEffect, useCallback } = window.React || {};

  // All state hooks (called unconditionally per React rules)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [confirmingOrganizationDelete, setConfirmingOrganizationDelete] =
    useState(null);

  // Back to list function
  const backToList = useCallback(() => {
    onViewModeChange?.('list');
  }, [onViewModeChange]);

  // Expose the back function to parent
  useEffect(() => {
    if (onBackToList) {
      onBackToList(() => backToList);
    }
  }, [onBackToList, backToList]);

  // Filter organizations
  const filteredOrganizations = useMemo(() => {
    if (!fullData?.organizations) return [];

    let filtered = fullData.organizations;

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

  // Event handlers
  const handleOrganizationClick = useCallback((organization) => {
    setSelectedOrganization(organization);
    setIsDetailsModalOpen(true);
  }, []);

  const handleViewSummary = useCallback((organization, e) => {
    e.stopPropagation();
    setSelectedOrganization(organization);
    setIsDetailsModalOpen(true);
  }, []);

  const handleDeleteOrganization = useCallback((organization, e) => {
    e.stopPropagation();
    setConfirmingOrganizationDelete(organization.id);
  }, []);

  const confirmOrganizationDelete = useCallback(
    (organization) => {
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
    },
    [fullData, onUpdateData]
  );

  const cancelOrganizationDelete = useCallback(() => {
    setConfirmingOrganizationDelete(null);
  }, []);

  const handleStartEdit = useCallback((organization) => {
    setEditingRowId(organization.id);
    setEditValues({
      name: organization.name || '',
      type: organization.type || '',
      email: organization.email || '',
      phone: organization.phone || '',
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null);
    setEditValues({});
  }, []);

  const handleSaveEdit = useCallback(
    async (organization) => {
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
    },
    [fullData, fileService, onUpdateData, editValues]
  );

  // Check for React availability
  if (!window.React) {
    return {
      loading: false,
      error: { message: 'React not available' },
      data: [],
    };
  }

  return {
    loading: false,
    error: null,
    data: filteredOrganizations,
    state: {
      searchTerm,
      setSearchTerm,
      selectedOrganization,
      setSelectedOrganization,
      isDetailsModalOpen,
      setIsDetailsModalOpen,
      isCreateModalOpen,
      setIsCreateModalOpen,
      editingRowId,
      setEditingRowId,
      editValues,
      setEditValues,
      confirmingOrganizationDelete,
      setConfirmingOrganizationDelete,
    },
    handlers: {
      handleOrganizationClick,
      handleViewSummary,
      handleDeleteOrganization,
      confirmOrganizationDelete,
      cancelOrganizationDelete,
      handleStartEdit,
      handleCancelEdit,
      handleSaveEdit,
    },
    meta: {
      totalCount: fullData?.organizations?.length || 0,
      filteredCount: filteredOrganizations.length,
    },
  };
}

/**
 * Render action buttons for Organizations Tab
 */
function renderOrganizationsActions({ components, data }) {
  const e = window.React.createElement;
  const { Button } = components;

  return e(
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
        `${data.meta.filteredCount} organizations`
      )
    ),
    e(Button, {
      variant: 'primary',
      onClick: () => data.state.setIsCreateModalOpen(true),
      children: 'Add New Organization',
    })
  );
}

/**
 * Render main content for Organizations Tab
 */
function renderOrganizationsContent({ components, data }) {
  const e = window.React.createElement;
  const { SearchBar, DataTable, Badge, Button } = components;
  const { state, handlers } = data;

  // Define table columns
  const columns = [
    {
      field: 'name',
      label: 'Organization Name',
      sortable: true,
      render: (value, org) =>
        state.editingRowId === org?.id
          ? e('input', {
              type: 'text',
              value: state.editValues.name,
              onChange: (e) =>
                state.setEditValues({
                  ...state.editValues,
                  name: e.target.value,
                }),
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
        state.editingRowId === org?.id
          ? e(
              'select',
              {
                value: state.editValues.type,
                onChange: (e) =>
                  state.setEditValues({
                    ...state.editValues,
                    type: e.target.value,
                  }),
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
        state.editingRowId === org?.id
          ? e('input', {
              type: 'email',
              value: state.editValues.email,
              onChange: (e) =>
                state.setEditValues({
                  ...state.editValues,
                  email: e.target.value,
                }),
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
        state.editingRowId === org?.id
          ? e('input', {
              type: 'tel',
              value: state.editValues.phone,
              onChange: (e) =>
                state.setEditValues({
                  ...state.editValues,
                  phone: e.target.value,
                }),
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
        state.editingRowId === org.id
          ? e(
              'div',
              { className: 'flex space-x-2' },
              e(Button, {
                variant: 'success',
                size: 'sm',
                onClick: () => handlers.handleSaveEdit(org),
                children: 'Save',
              }),
              e(Button, {
                variant: 'secondary',
                size: 'sm',
                onClick: handlers.handleCancelEdit,
                children: 'Cancel',
              })
            )
          : e(
              'div',
              { className: 'flex space-x-2' },
              e(Button, {
                variant: 'secondary',
                size: 'sm',
                onClick: (e) => handlers.handleViewSummary(org, e),
                children: 'View',
              }),
              e(Button, {
                variant: 'secondary',
                size: 'sm',
                onClick: (e) => {
                  e.stopPropagation();
                  handlers.handleStartEdit(org);
                },
                children: 'Edit',
              }),
              e(Button, {
                variant: 'danger',
                size: 'sm',
                onClick: (e) => handlers.handleDeleteOrganization(org, e),
                children: 'Delete',
              })
            ),
    },
  ];

  return e(
    'div',
    { className: 'space-y-4' },

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
            value: state.searchTerm,
            onChange: (value) => state.setSearchTerm(value),
            placeholder:
              'Search organizations by name, type, email, or phone...',
            className: 'w-full',
          })
        )
      )
    ),

    // Organizations Table
    e(DataTable, {
      data: data.data,
      columns,
      onRowClick: handlers.handleOrganizationClick,
      className: 'w-full',
      emptyMessage: 'No organizations found',
    })
  );
}

/**
 * Render modals for Organizations Tab
 */
function renderOrganizationsModals({ components, data, props }) {
  const e = window.React.createElement;
  const { Modal, OrganizationModal } = components;
  const { state, handlers } = data;
  const { fullData, fileService, onUpdateData } = props;

  const modals = [];

  // Delete Confirmation Modal
  if (state.confirmingOrganizationDelete) {
    const org = fullData.organizations.find(
      (o) => o.id === state.confirmingOrganizationDelete
    );

    modals.push(
      e(Modal, {
        key: 'delete-confirmation',
        isOpen: true,
        onClose: handlers.cancelOrganizationDelete,
        title: 'Delete Organization',
        children: e(
          'div',
          { className: 'space-y-4' },
          e(
            'p',
            null,
            'Are you sure you want to delete this organization? This action cannot be undone.'
          ),
          e(
            'div',
            { className: 'flex justify-end space-x-2' },
            e(components.Button, {
              variant: 'secondary',
              onClick: handlers.cancelOrganizationDelete,
              children: 'Cancel',
            }),
            e(components.Button, {
              variant: 'danger',
              onClick: () => handlers.confirmOrganizationDelete(org),
              children: 'Delete',
            })
          )
        ),
      })
    );
  }

  // Organization Details/Edit Modal
  if (
    state.isDetailsModalOpen &&
    state.selectedOrganization &&
    OrganizationModal
  ) {
    modals.push(
      e(OrganizationModal, {
        key: 'details-modal',
        isOpen: state.isDetailsModalOpen,
        onClose: () => state.setIsDetailsModalOpen(false),
        editOrganizationId: state.selectedOrganization.id,
        fullData,
        fileService,
        onOrganizationCreated: (updatedData) => {
          onUpdateData(updatedData);
          state.setIsDetailsModalOpen(false);
        },
      })
    );
  }

  // Create Organization Modal
  if (state.isCreateModalOpen && OrganizationModal) {
    modals.push(
      e(OrganizationModal, {
        key: 'create-modal',
        isOpen: state.isCreateModalOpen,
        onClose: () => state.setIsCreateModalOpen(false),
        fullData,
        fileService,
        onOrganizationCreated: (newOrganizationData) => {
          onUpdateData(newOrganizationData);
          state.setIsCreateModalOpen(false);
        },
      })
    );
  }

  return modals.length > 0 ? modals : null;
}

/**
 * OrganizationsTab using createBusinessComponent factory
 * This demonstrates the new standardized architecture
 */
const OrganizationsTabRefactored = window.createBusinessComponent
  ? window.createBusinessComponent({
      name: 'OrganizationsTabRefactored',
      useData: useOrganizationsData,
      renderActions: renderOrganizationsActions,
      renderContent: renderOrganizationsContent,
      renderModals: renderOrganizationsModals,
      defaultProps: {
        fullData: { organizations: [] },
        onUpdateData: () => {},
        fileService: null,
        onViewModeChange: () => {},
        onBackToList: () => {},
      },
    })
  : function OrganizationsTabFallback() {
      const e = window.React?.createElement;
      return e
        ? e(
            'div',
            {
              className:
                'p-4 bg-red-50 border border-red-200 rounded text-red-700',
            },
            'createBusinessComponent factory not available. Please ensure TabBase.js is loaded.'
          )
        : null;
    };

// PropTypes validation
OrganizationsTabRefactored.propTypes = {
  fullData: window.PropTypes?.object,
  onUpdateData: window.PropTypes?.func,
  fileService: window.PropTypes?.object,
  onViewModeChange: window.PropTypes?.func,
  onBackToList: window.PropTypes?.func,
};

// Register with the business component registry
if (typeof window !== 'undefined') {
  window.OrganizationsTabRefactored = OrganizationsTabRefactored;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'OrganizationsTabRefactored',
      OrganizationsTabRefactored
    );
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OrganizationsTabRefactored,
    useOrganizationsData,
    renderOrganizationsActions,
    renderOrganizationsContent,
    renderOrganizationsModals,
  };
}
