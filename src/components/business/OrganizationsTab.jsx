// OrganizationsTab.js
// Migrated to ES module component registry.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';
import { createBusinessComponent } from '../ui/TabBase.jsx';
import Toast from '../../services/nightingale.toast.js';

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
  // Hooks from React (unconditional at top of scope)

  // Toast function via module (stable reference for hook deps)
  const showToast = useCallback((msg, type) => {
    Toast.showToast?.(msg, type);
  }, []);

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
        const logger = globalThis.NightingaleLogger?.get(
          'organizationsTab:save',
        );
        logger?.error('Organization save failed', { error: error.message });
        showToast('Error saving organization', 'error');
      }
    },
    [fullData, fileService, onUpdateData, editValues, showToast],
  );

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
  const e = React.createElement;
  const { SearchBar, DataTable, TextInput, Select, SearchSection } = components;
  const { state, handlers } = data;

  const isTestEnv =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test';
  const canUseGrid = !isTestEnv;

  // Define table columns (for DataTable fallback)
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

  return (
    <Box
      sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            variant="h4"
            component="h1"
          >
            Organizations Management
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
          >{`${data.meta.filteredCount} organizations`}</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => data.state.setIsCreateModalOpen(true)}
          aria-label="New Organization"
        >
          Add New Organization
        </Button>
      </Box>

      {e(SearchSection, {
        searchBar: e(
          'div',
          { className: 'flex items-center space-x-4' },
          e(
            'div',
            { className: 'flex-1' },
            e(SearchBar, {
              value: state.searchTerm,
              onChange: (e) => {
                const value =
                  typeof e === 'string' ? e : e?.target?.value || '';
                state.setSearchTerm(value);
              },
              placeholder:
                'Search organizations by name, type, email, or phone...',
              className: 'w-full',
            }),
          ),
        ),
      })}

      {canUseGrid
        ? e(
            'div',
            { style: { height: 640, width: '100%' } },
            e(DataGrid, {
              rows: data.data.map((org) => ({
                id: org.id,
                name: org.name || 'N/A',
                type: org.type || 'N/A',
                email: org.email || 'N/A',
                phone: org.phone || 'N/A',
              })),
              columns: [
                {
                  field: 'name',
                  headerName: 'Organization Name',
                  flex: 1,
                  minWidth: 220,
                },
                { field: 'type', headerName: 'Type', width: 140 },
                { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
                { field: 'phone', headerName: 'Phone', width: 160 },
              ],
              disableRowSelectionOnClick: true,
              onRowClick: (params) => {
                const org = data.data.find((o) => o.id === params.id);
                if (org) handlers.handleOrganizationClick(org);
              },
            }),
          )
        : e(DataTable, {
            data: data.data,
            columns,
            onRowClick: handlers.handleOrganizationClick,
            className: 'w-full',
            emptyMessage: 'No organizations found',
          })}

      {data.data.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            variant="body1"
            color="text.secondary"
          >
            No organizations found
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

/**
 * Render modals for Organizations Tab
 */
function renderOrganizationsModals({ components, data, props }) {
  const e = React.createElement;
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
        // OrganizationModal currently invokes this callback with a single organization entity
        // to match People/Case modal patterns. Merge the entity into the existing dataset here.
        onOrganizationCreated: (organizationEntity) => {
          if (!organizationEntity) {
            state.setIsDetailsModalOpen(false);
            return;
          }
          const updatedData = {
            ...fullData,
            organizations: (fullData?.organizations || []).map((o) =>
              o.id === organizationEntity.id ? organizationEntity : o,
            ),
          };
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
        // Merge newly created organization entity into dataset
        onOrganizationCreated: (organizationEntity) => {
          if (!organizationEntity) {
            state.setIsCreateModalOpen(false);
            return;
          }
          const updatedData = {
            ...fullData,
            organizations: [
              ...(fullData?.organizations || []),
              organizationEntity,
            ],
          };
          onUpdateData(updatedData);
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
const OrganizationsTab = createBusinessComponent({
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
});

// PropTypes validation
OrganizationsTab.propTypes = {
  fullData: PropTypes.object,
  onUpdateData: PropTypes.func,
  fileService: PropTypes.object,
  onViewModeChange: PropTypes.func,
  onBackToList: PropTypes.func,
};

// Register with business registry (legacy global removed)
registerComponent('business', 'OrganizationsTab', OrganizationsTab);

// Export for ES6 module compatibility

// ES6 Module Export
export default OrganizationsTab;
export {
  OrganizationsTab,
  useOrganizationsData,
  renderOrganizationsContent,
  renderOrganizationsModals,
};
