import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import PropTypes from 'prop-types';
import { registerComponent, getComponent } from '../../services/registry';
import { safeMergeFullData } from '../../services/safeDataMerge.js';
import { createBusinessComponent } from '../ui/TabBase.jsx';
import dateUtils from '../../services/nightingale.dayjs.js';
import { findPersonById } from '../../services/nightingale.datamanagement.js';
/**
 * Nightingale CMS - Cases Tab Component
 *
 * Extracted from main CMS application (now in index.html) using TabBase.js factory pattern
 * Manages case listing, search, CRUD operations, and details view navigation
 *
 * Features:
 * - Case search and filtering
 * - Case creation and editing via modals
 * - Case details view integration
 * - DataTable integration with sorting and actions
 * - Multi-tier component registry fallbacks
 *
 * @param {Object} props.fullData - Complete application data
 * @param {Function} props.onUpdateData - Data update callback
 * @param {Object} props.fileService - File service for persistence
 * @param {Function} props.onViewModeChange - View mode change callback
 * @param {Function} props.onBackToList - Back to list callback registration
 * @returns {React.Element} Cases tab component
 */

/**
 * Custom hook for CasesTab data management
 * Implements the TabBase.js useData pattern for standardized data handling
 */
function useCasesData({ fullData, onViewModeChange, onBackToList }) {
  // State management - all hooks must be called unconditionally
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCaseId, setEditCaseId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
  const [detailsCaseId, setDetailsCaseId] = useState(null);

  // Back to list function that can be called externally
  const backToList = useCallback(() => {
    setViewMode('list');
    setDetailsCaseId(null);
    onViewModeChange?.('list');
  }, [onViewModeChange]);

  // Expose the back function to parent
  useEffect(() => {
    if (onBackToList) {
      onBackToList(() => backToList);
    }
  }, [onBackToList, backToList]);

  // Filter cases (DataTable handles sorting)
  const filteredCases = useMemo(() => {
    if (!fullData?.cases) return [];

    let filtered = fullData.cases;

    // Apply search filter only (DataTable component handles sorting)
    // Ensure searchTerm is a string before using string methods
    const searchString = typeof searchTerm === 'string' ? searchTerm : '';
    if (searchString.trim()) {
      const term = searchString.toLowerCase();
      filtered = filtered.filter((caseItem) => {
        const person = findPersonById(fullData.people, caseItem.personId);
        const personName = person?.name?.toLowerCase() || '';

        return (
          caseItem.mcn?.toLowerCase().includes(term) ||
          personName.includes(term) ||
          caseItem.status?.toLowerCase().includes(term) ||
          caseItem.applicationDate?.includes(term)
        );
      });
    }

    return filtered;
  }, [fullData, searchTerm]);

  // Event handlers
  const handleCaseClick = (caseItem) => {
    setEditCaseId(caseItem.id);
    setIsEditModalOpen(true);
  };

  const [pendingDetailsCaseId, setPendingDetailsCaseId] = useState(null);
  const peopleReady =
    Array.isArray(fullData?.people) && fullData.people.length > 0;

  const handleOpenCaseDetails = (caseItem, e) => {
    e.stopPropagation();
    if (!peopleReady) {
      setPendingDetailsCaseId(caseItem.id);
      const logger = globalThis.NightingaleLogger?.get('nav:cases');
      logger?.info('Deferring case details open until people loaded', {
        caseId: caseItem.id,
      });
      return;
    }
    setDetailsCaseId(caseItem.id);
    setViewMode('details');
    onViewModeChange?.('details');
  };

  // When people finish loading, honor any pending details navigation
  useEffect(() => {
    if (peopleReady && pendingDetailsCaseId && viewMode !== 'details') {
      const target = pendingDetailsCaseId;
      setPendingDetailsCaseId(null);
      setDetailsCaseId(target);
      setViewMode('details');
      onViewModeChange?.('details');
      const logger = globalThis.NightingaleLogger?.get('nav:cases');
      logger?.info('Opened deferred case details after people load', {
        caseId: target,
      });
    }
  }, [peopleReady, pendingDetailsCaseId, viewMode, onViewModeChange]);

  const formatDate = (dateString) =>
    dateUtils.format?.(dateString) || dateString;

  return {
    data: filteredCases,
    loading: false,
    error: null,
    // State
    searchTerm,
    setSearchTerm,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editCaseId,
    setEditCaseId,
    viewMode,
    setViewMode,
    detailsCaseId,
    setDetailsCaseId,
    // Functions
    backToList,
    handleCaseClick,
    handleOpenCaseDetails,
    formatDate,
  };
}

/**
 * Render function for CasesTab content
 * Implements the TabBase.js renderContent pattern
 */
function renderCasesContent({ components, data: dataResult, props }) {
  const e = React.createElement;
  const { SearchBar, DataTable, SearchSection } = components;
  const isTestEnv =
    typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test';
  const canUseGrid = !isTestEnv;

  // Conditional rendering for details view
  if (dataResult.viewMode === 'details' && dataResult.detailsCaseId) {
    const CaseDetailsView =
      getComponent('business', 'CaseDetailsView') ||
      (({ caseId }) =>
        e(
          'div',
          {
            className:
              'p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700',
          },
          `CaseDetailsView component not available. Case ID: ${caseId}`,
        ));

    return e(CaseDetailsView, {
      caseId: dataResult.detailsCaseId,
      fullData: props.fullData,
      onUpdateData: props.onUpdateData,
      onBackToList: dataResult.backToList,
      fileService: props.fileService,
    });
  }

  // Main cases list view - standardized MUI layout
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
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
            Cases
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
          >{`${dataResult.data.length} case${dataResult.data.length !== 1 ? 's' : ''}`}</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => dataResult.setIsCreateModalOpen(true)}
          aria-label="New Case"
        >
          New Case
        </Button>
      </Box>
      {e(SearchSection, {
        searchBar: e(SearchBar, {
          value: dataResult.searchTerm,
          onChange: (ev) => {
            const value = typeof ev === 'string' ? ev : ev?.target?.value || '';
            dataResult.setSearchTerm(value);
          },
          placeholder: 'Search cases by MCN, person name, status...',
        }),
      })}

      {dataResult.data.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography
            variant="body1"
            color="text.secondary"
          >
            No cases found
          </Typography>
        </Paper>
      ) : canUseGrid ? (
        e(
          'div',
          { style: { width: '100%' } },
          e(DataGrid, {
            autoHeight: true,
            sx: { width: '100%' },
            rows: dataResult.data.map((c) => {
              const people = props.fullData?.people || [];
              let person =
                globalThis.NightingaleDataManagement?.findPersonById?.(
                  people,
                  c.personId,
                ) || null;
              if (!person) {
                // Local fallback matching mirroring findPersonById logic (defensive for environments where global is absent)
                const pid = c.personId;
                person =
                  people.find((p) => {
                    const a = String(p.id);
                    const b = String(pid);
                    if (a === b) return true;
                    if (a === b.padStart(2, '0')) return true;
                    if (a.padStart(2, '0') === b) return true;
                    if (Number(a) === Number(b)) return true;
                    return false;
                  }) || null;
              }
              const composite = person
                ? [person.firstName, person.lastName].filter(Boolean).join(' ')
                : '';
              const personName =
                person?.name ||
                composite ||
                c?.clientName || // legacy snapshot (may be removed by normalization)
                c?.personName ||
                'Unknown';
              return {
                id: c.id,
                mcn: c.mcn || 'N/A',
                personName,
                status: c.status || 'Unknown',
                applicationDate: dataResult.formatDate(c.applicationDate),
              };
            }),
            columns: [
              { field: 'mcn', headerName: 'MCN', width: 140 },
              {
                field: 'personName',
                headerName: 'Person',
                flex: 1,
                minWidth: 180,
              },
              { field: 'status', headerName: 'Status', width: 140 },
              {
                field: 'applicationDate',
                headerName: 'Application Date',
                width: 180,
              },
            ],
            disableRowSelectionOnClick: true,
            initialState: {
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
            },
            pageSizeOptions: [10, 25, 50],
            onRowClick: (params) => {
              const caseItem = dataResult.data.find((x) => x.id === params.id);
              if (caseItem) dataResult.handleCaseClick(caseItem);
            },
          }),
        )
      ) : (
        e(DataTable, {
          data: dataResult.data,
          columns: [
            {
              field: 'mcn',
              label: 'MCN',
              sortable: true,
              render: (value) =>
                e(
                  'span',
                  { className: 'font-mono text-blue-400' },
                  value || 'N/A',
                ),
            },
            {
              field: 'personId',
              label: 'Person',
              sortable: true,
              render: (value, caseRow) => {
                const person =
                  globalThis.NightingaleDataManagement?.findPersonById?.(
                    props.fullData?.people,
                    value,
                  ) || null;
                const displayName =
                  person?.name ||
                  [person?.firstName, person?.lastName]
                    .filter(Boolean)
                    .join(' ') ||
                  caseRow?.clientName ||
                  caseRow?.personName ||
                  'Unknown';
                return e(
                  'span',
                  { className: 'font-medium text-white' },
                  displayName,
                );
              },
            },
            {
              field: 'status',
              label: 'Status',
              sortable: true,
              render: (value) => {
                const statusColors = {
                  Pending: 'bg-yellow-500',
                  'In Progress': 'bg-blue-500',
                  Active: 'bg-green-500',
                  Closed: 'bg-gray-500',
                  Denied: 'bg-red-500',
                };
                const colorClass = statusColors[value] || 'bg-gray-500';
                return e(
                  'span',
                  {
                    className: `px-2 py-1 rounded text-xs text-white ${colorClass}`,
                  },
                  value || 'Unknown',
                );
              },
            },
            {
              field: 'applicationDate',
              label: 'Application Date',
              sortable: true,
              render: (value) =>
                e(
                  'span',
                  { className: 'text-gray-300' },
                  dataResult.formatDate(value),
                ),
            },
          ],
          onRowClick: dataResult.handleCaseClick,
          className: 'w-full',
          emptyMessage: 'No cases found',
        })
      )}
    </Box>
  );
}

/**
 * Render function for CasesTab modals
 * Implements the TabBase.js renderModals pattern
 */
function renderCasesModals({ data: dataResult, props }) {
  const e = React.createElement;

  // Get CaseCreationModal with fallback
  const CaseCreationModal =
    getComponent('business', 'CaseCreationModal') ||
    (({ isOpen, onClose }) =>
      isOpen
        ? e(
            'div',
            {
              className:
                'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
              onClick: onClose,
            },
            e(
              'div',
              {
                className: 'bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4',
                onClick: (e) => e.stopPropagation(),
              },
              e(
                'h2',
                { className: 'text-lg font-semibold text-white mb-4' },
                'Create Case',
              ),
              e(
                'p',
                { className: 'text-gray-400 mb-4' },
                'CaseCreationModal component not available',
              ),
              e(
                'button',
                {
                  className:
                    'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded',
                  onClick: onClose,
                },
                'Close',
              ),
            ),
          )
        : null);

  return e(
    'div',
    null,
    // Case Creation Modal
    e(CaseCreationModal, {
      isOpen: dataResult.isCreateModalOpen,
      onClose: () => dataResult.setIsCreateModalOpen(false),
      onCaseCreated: (newCase) => {
        const updatedData = safeMergeFullData(props.fullData, {
          cases: [...(props.fullData.cases || []), newCase],
        });
        props.onUpdateData(updatedData);
        dataResult.setIsCreateModalOpen(false);
      },
      fullData: props.fullData,
      fileService: props.fileService,
    }),

    // Case Edit Modal (using same component with edit mode)
    dataResult.isEditModalOpen &&
      e(CaseCreationModal, {
        isOpen: dataResult.isEditModalOpen,
        onClose: () => {
          dataResult.setIsEditModalOpen(false);
          dataResult.setEditCaseId(null);
        },
        onCaseCreated: (updatedCase) => {
          const updatedData = safeMergeFullData(props.fullData, {
            cases: props.fullData.cases.map((c) =>
              c.id === updatedCase.id ? updatedCase : c,
            ),
          });
          props.onUpdateData(updatedData);
          dataResult.setIsEditModalOpen(false);
          dataResult.setEditCaseId(null);
        },
        editCaseId: dataResult.editCaseId,
        fullData: props.fullData,
        fileService: props.fileService,
        onViewCaseDetails: (caseId) => {
          // Close the edit modal first
          dataResult.setIsEditModalOpen(false);
          dataResult.setEditCaseId(null);
          // Open case details view
          dataResult.setDetailsCaseId(caseId);
          dataResult.setViewMode('details');
          props.onViewModeChange?.('details');
        },
      }),
  );
}

/**
 * Create CasesTab component using TabBase.js factory
 */
const CasesTab = createBusinessComponent({
  name: 'CasesTab',
  useData: useCasesData,
  renderContent: renderCasesContent,
  renderModals: renderCasesModals,
  defaultProps: {
    fullData: { cases: [], people: [] },
  },
});

// PropTypes validation
CasesTab.propTypes = {
  fullData: PropTypes.object,
  onUpdateData: PropTypes.func,
  fileService: PropTypes.object,
  onViewModeChange: PropTypes.func,
  onBackToList: PropTypes.func,
};

// Register with the business component registry
if (typeof window !== 'undefined') {
  registerComponent('business', 'CasesTab', CasesTab);
}

// Export for ES6 module compatibility

// ES6 Module Export
export default CasesTab;
