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
  const { useState, useEffect, useMemo, useCallback } = window.React;

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
        const person = window.NightingaleDataManagement?.findPersonById?.(
          fullData.people,
          caseItem.personId,
        );
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

  const handleOpenCaseDetails = (caseItem, e) => {
    e.stopPropagation();
    setDetailsCaseId(caseItem.id);
    setViewMode('details');
    onViewModeChange?.('details');
  };

  const formatDate = (dateString) => {
    return window.dateUtils?.format?.(dateString) || dateString;
  };

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
  const e = window.React.createElement;
  const { SearchBar, DataTable, TabHeader, SearchSection, ContentSection } =
    components;

  // Conditional rendering for details view
  if (dataResult.viewMode === 'details' && dataResult.detailsCaseId) {
    // Use CaseDetailsView component with fallback
    const CaseDetailsView =
      window.NightingaleBusiness?.components?.CaseDetailsView ||
      window.NightingaleBusiness?.CaseDetailsView ||
      window.CaseDetailsView ||
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

  // Main cases list view
  return e(
    'div',
    { className: 'w-full space-y-4' },

    // Compact Header Bar
    e(TabHeader, {
      title: 'Cases',
      count: `${dataResult.data.length} case${dataResult.data.length !== 1 ? 's' : ''}`,
      icon: {
        d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      iconProps: { className: 'w-8 h-8 text-blue-400' },
      actions: e(
        'button',
        {
          className:
            'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-colors',
          onClick: () => dataResult.setIsCreateModalOpen(true),
        },
        'New Case',
      ),
    }),

    // Search Section
    e(SearchSection, {
      searchBar: e(SearchBar, {
        value: dataResult.searchTerm,
        onChange: (e) => {
          // Handle both direct string values and event objects
          const value = typeof e === 'string' ? e : e?.target?.value || '';
          dataResult.setSearchTerm(value);
        },
        placeholder: 'Search cases by MCN, person name, status...',
        className: 'w-full',
      }),
    }),

    // Cases Table
    e(ContentSection, {
      variant: 'table',
      children: e(DataTable, {
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
            render: (value) => {
              const person = window.NightingaleDataManagement?.findPersonById?.(
                props.fullData?.people,
                value,
              );
              return e(
                'span',
                { className: 'font-medium text-white' },
                person?.name || 'Unknown',
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
          {
            field: 'actions',
            label: 'Actions',
            sortable: false,
            render: (value, caseItem) =>
              e(
                'div',
                { className: 'flex space-x-2' },
                e(
                  'button',
                  {
                    className:
                      'bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors',
                    onClick: (e) =>
                      dataResult.handleOpenCaseDetails(caseItem, e),
                  },
                  'Details',
                ),
                e(
                  'button',
                  {
                    className:
                      'bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      dataResult.handleCaseClick(caseItem);
                    },
                  },
                  'Edit',
                ),
              ),
          },
        ],
        onRowClick: dataResult.handleCaseClick,
        className: 'w-full',
        emptyMessage: 'No cases found',
      }),
    }),
  );
}

/**
 * Render function for CasesTab modals
 * Implements the TabBase.js renderModals pattern
 */
function renderCasesModals({ data: dataResult, props }) {
  const e = window.React.createElement;

  // Get CaseCreationModal with fallback
  const CaseCreationModal =
    window.NightingaleBusiness?.components?.CaseCreationModal ||
    window.NightingaleBusiness?.CaseCreationModal ||
    window.CaseCreationModal ||
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
        const updatedData = {
          ...props.fullData,
          cases: [...(props.fullData.cases || []), newCase],
        };
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
          const updatedData = {
            ...props.fullData,
            cases: props.fullData.cases.map((c) =>
              c.id === updatedCase.id ? updatedCase : c,
            ),
          };
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
const CasesTab = window.createBusinessComponent({
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
  fullData: window.PropTypes?.object,
  onUpdateData: window.PropTypes?.func,
  fileService: window.PropTypes?.object,
  onViewModeChange: window.PropTypes?.func,
  onBackToList: window.PropTypes?.func,
};

// Register with the business component registry
if (typeof window !== 'undefined') {
  window.CasesTab = CasesTab;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'CasesTab',
      CasesTab,
      'case-management',
      ['TabBase', 'DataTable', 'SearchBar', 'TabHeader'],
    );
  }

  // Legacy registration for backward compatibility
  if (typeof window.Nightingale !== 'undefined') {
    window.Nightingale.registerComponent('CasesTab', CasesTab);
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CasesTab;
}

// ES6 Module Export
export default CasesTab;
