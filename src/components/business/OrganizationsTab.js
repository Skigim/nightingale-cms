// OrganizationsTab.js
// Migrated to ES module component registry.
import { registerComponent } from '../../services/core';

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

  // Toast function - now guaranteed to work by main.js setup
  const showToast = window.showToast;

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

    // Ensure searchTerm is a string before using string methods
    const searchString = typeof searchTerm === 'string' ? searchTerm : '';
    if (searchString && searchString.trim()) {
      const term = searchString.toLowerCase();
      filtered = filtered.filter((org) => {
        // Helper function to safely search address object
        const searchAddress = (address) => {
          if (!address || typeof address !== 'object') return false;
          return (
            address.street?.toLowerCase?.().includes(term) ||
            address.city?.toLowerCase?.().includes(term) ||
            address.state?.toLowerCase?.().includes(term) ||
            address.zip?.includes?.(term)
          );
        };

        return (
          org.name?.toLowerCase?.().includes(term) ||
          org.type?.toLowerCase?.().includes(term) ||
          org.email?.toLowerCase?.().includes(term) ||
          org.phone?.includes?.(term) ||
          searchAddress(org.address) ||
          org.status?.toLowerCase?.().includes(term)
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
        (o) => o.id !== organization.id,
      );
      onUpdateData(updatedData);
      showToast(
        `Organization ${organization.name} deleted successfully`,
        'success',
      );
      setConfirmingOrganizationDelete(null);
    },
    [fullData, onUpdateData, showToast],
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
          (o) => o.id === organization.id,
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
          showToast('Organization updated successfully!', 'success');
        }
      } catch (error) {
        const logger = window.NightingaleLogger?.get('organizationsTab:save');
        logger?.error('Organization save failed', { error: error.message });
        showToast('Error saving organization', 'error');
      }
    },
    [fullData, fileService, onUpdateData, editValues, showToast],
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
 * Render main content for Organizations Tab
 */
function renderOrganizationsContent({ components, data }) {
  const e = window.React.createElement;
  const {
    SearchBar,
    DataTable,
    TabHeader,
    Button,
    TextInput,
    Select,
    SearchSection,
    ContentSection,
  } = components;
  const { state, handlers } = data;

  // Define table columns
  const columns = [
    {
      field: 'name',
      label: 'Organization Name',
      sortable: true,
      render: (value, org) =>
        state.editingRowId === org?.id
          ? e(TextInput, {
              value: state.editValues.name,
              onChange: (value) =>
                state.setEditValues({
                  ...state.editValues,
                  name: value,
                }),
              className: 'w-full',
            })
          : e(
              'div',
              { className: 'font-medium text-white' },
              org?.name || 'N/A',
            ),
    },
    {
      field: 'type',
      label: 'Type',
      sortable: true,
      render: (value, org) =>
        state.editingRowId === org?.id
          ? e(Select, {
              value: state.editValues.type,
              onChange: (value) =>
                state.setEditValues({
                  ...state.editValues,
                  type: value,
                }),
              options: [
                { value: '', label: 'Select Type' },
                { value: 'healthcare', label: 'Healthcare' },
                { value: 'insurance', label: 'Insurance' },
                { value: 'government', label: 'Government' },
                { value: 'nonprofit', label: 'Nonprofit' },
                { value: 'legal', label: 'Legal' },
                { value: 'other', label: 'Other' },
              ],
              className: 'w-full',
            })
          : e(
              'div',
              { className: 'text-gray-300' },
              org?.type
                ? org.type.charAt(0).toUpperCase() + org.type.slice(1)
                : 'N/A',
            ),
    },
    {
      field: 'email',
      label: 'Email',
      sortable: true,
      render: (value, org) =>
        state.editingRowId === org?.id
          ? e(TextInput, {
              type: 'email',
              value: state.editValues.email,
              onChange: (value) =>
                state.setEditValues({
                  ...state.editValues,
                  email: value,
                }),
              className: 'w-full',
            })
          : e('div', { className: 'text-gray-300' }, org?.email || 'N/A'),
    },
    {
      field: 'phone',
      label: 'Phone',
      sortable: true,
      render: (value, org) =>
        state.editingRowId === org?.id
          ? e(TextInput, {
              type: 'tel',
              value: state.editValues.phone,
              onChange: (value) =>
                state.setEditValues({
                  ...state.editValues,
                  phone: value,
                }),
              className: 'w-full',
            })
          : e('div', { className: 'text-gray-300' }, org?.phone || 'N/A'),
    },
  ];

  return e(
    'div',
    { className: 'space-y-6' },

    // Tab Header
    e(TabHeader, {
      title: 'Organizations Management',
      count: `${data.meta.filteredCount} organizations`,
      icon: {
        d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      actions: e(Button, {
        variant: 'primary',
        onClick: () => data.state.setIsCreateModalOpen(true),
        children: 'Add New Organization',
      }),
    }),

    // Search Bar
    e(SearchSection, {
      searchBar: e(
        'div',
        { className: 'flex items-center space-x-4' },
        e(
          'div',
          { className: 'flex-1' },
          e(SearchBar, {
            value: state.searchTerm,
            onChange: (e) => {
              // Handle both direct string values and event objects
              const value = typeof e === 'string' ? e : e?.target?.value || '';
              state.setSearchTerm(value);
            },
            placeholder:
              'Search organizations by name, type, email, or phone...',
            className: 'w-full',
          }),
        ),
      ),
    }),

    // Organizations Table
    e(ContentSection, {
      variant: 'table',
      children: e(DataTable, {
        data: data.data,
        columns,
        onRowClick: handlers.handleOrganizationClick,
        className: 'w-full',
        emptyMessage: 'No organizations found',
      }),
    }),
  );
}

/**
 * Render modals for Organizations Tab
 */
function renderOrganizationsModals({ components, data, props }) {
  const e = window.React.createElement;
  const { ConfirmationModal, OrganizationModal } = components;
  const { state, handlers } = data;
  const { fullData, fileService, onUpdateData } = props;

  const modals = [];

  // Delete Confirmation Modal
  if (state.confirmingOrganizationDelete) {
    const org = fullData.organizations.find(
      (o) => o.id === state.confirmingOrganizationDelete,
    );

    modals.push(
      e(ConfirmationModal, {
        key: 'delete-confirmation',
        isOpen: true,
        onClose: handlers.cancelOrganizationDelete,
        onConfirm: () => handlers.confirmOrganizationDelete(org),
        title: 'Delete Organization',
        message:
          'Are you sure you want to delete this organization? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
      }),
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
      }),
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
      }),
    );
  }

  return modals.length > 0 ? modals : null;
}

/**
 * OrganizationsTab using createBusinessComponent factory
 * Standardized Tab component following the factory architecture pattern
 */
const OrganizationsTab = window.createBusinessComponent
  ? window.createBusinessComponent({
      name: 'OrganizationsTab',
      useData: useOrganizationsData,
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
            'createBusinessComponent factory not available. Please ensure TabBase.js is loaded.',
          )
        : null;
    };

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
  window.OrganizationsTab = OrganizationsTab; // legacy global
  registerComponent('business', 'OrganizationsTab', OrganizationsTab);
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OrganizationsTab,
    useOrganizationsData,
    renderOrganizationsContent,
    renderOrganizationsModals,
  };
}

// ES6 Module Export
export default OrganizationsTab;
export {
  OrganizationsTab,
  useOrganizationsData,
  renderOrganizationsContent,
  renderOrganizationsModals,
};
