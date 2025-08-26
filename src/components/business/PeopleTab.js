/**
 * Nightingale CMS - People Tab Component
 *
 * Extracted from NightingaleCMS-React.html using TabBase.js factory pattern
 * Manages people listing, search, CRUD operations, and details view navigation
 *
 * Features:
 * - People search and filtering
 * - Person creation and editing via modals
 * - Person details view integration
 * - DataTable integration with sorting and actions
 * - Multi-tier component registry fallbacks
 *
 * @param {Object} props.fullData - Complete application data
 * @param {Function} props.onUpdateData - Data update callback
 * @param {Object} props.fileService - File service for persistence
 * @param {Function} props.onViewModeChange - View mode change callback
 * @param {Function} props.onBackToList - Back to list callback registration
 * @returns {React.Element} People tab component
 */

/**
 * Custom hook for PeopleTab data management
 * Implements the TabBase.js useData pattern for standardized data handling
 */
function usePeopleData({
  fullData,
  onUpdateData,
  fileService,
  onViewModeChange,
  onBackToList,
}) {
  const { useState, useEffect, useMemo } = window.React;

  // State management - all hooks must be called unconditionally
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPersonId, setEditPersonId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
  const [detailsPersonId, setDetailsPersonId] = useState(null);

  // Back to list function that can be called externally
  const backToList = () => {
    setViewMode('list');
    setDetailsPersonId(null);
    onViewModeChange?.('list');
  };

  // Expose the back function to parent
  useEffect(() => {
    if (onBackToList) {
      onBackToList(() => backToList);
    }
  }, [onBackToList]);

  // Filter people (DataTable handles sorting)
  const filteredPeople = useMemo(() => {
    if (!fullData?.people) return [];

    let filtered = fullData.people;

    // Apply search filter only (DataTable component handles sorting)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((person) => {
        // Helper function to get searchable address text
        const getAddressText = (address) => {
          if (typeof address === 'string') return address.toLowerCase();
          if (address && typeof address === 'object') {
            const parts = [
              address.street,
              address.city,
              address.state,
              address.zip,
            ].filter(Boolean);
            return parts.join(' ').toLowerCase();
          }
          return '';
        };

        return (
          person.name?.toLowerCase().includes(term) ||
          person.email?.toLowerCase().includes(term) ||
          person.phone?.includes(term) ||
          getAddressText(person.address).includes(term)
        );
      });
    }

    return filtered;
  }, [fullData, searchTerm]);

  // Event handlers
  const handlePersonClick = (person) => {
    setEditPersonId(person.id);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString) => {
    return window.dateUtils?.format?.(dateString) || dateString;
  };

  return {
    data: filteredPeople,
    loading: false,
    error: null,
    // State
    searchTerm,
    setSearchTerm,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editPersonId,
    setEditPersonId,
    viewMode,
    setViewMode,
    detailsPersonId,
    setDetailsPersonId,
    // Functions
    backToList,
    handlePersonClick,
    formatDate,
  };
}

/**
 * Render function for PeopleTab content
 * Implements the TabBase.js renderContent pattern
 */
function renderPeopleContent({ components, data: dataResult, props }) {
  const e = window.React.createElement;
  const { SearchBar, DataTable, TabHeader, SearchSection, ContentSection } =
    components;

  // Conditional rendering for details view
  if (dataResult.viewMode === 'details' && dataResult.detailsPersonId) {
    // Use PersonDetailsView component with fallback
    const PersonDetailsView =
      window.NightingaleBusiness?.components?.PersonDetailsView ||
      window.NightingaleBusiness?.PersonDetailsView ||
      window.PersonDetailsView ||
      (({ personId }) =>
        e(
          'div',
          {
            className:
              'p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700',
          },
          `PersonDetailsView component not available. Person ID: ${personId}`
        ));

    return e(PersonDetailsView, {
      personId: dataResult.detailsPersonId,
      fullData: props.fullData,
      onUpdateData: props.onUpdateData,
      onBackToList: dataResult.backToList,
    });
  }

  // Main people list view
  return e(
    'div',
    { className: 'w-full space-y-4' },

    // Compact Header Bar
    e(TabHeader, {
      title: 'People',
      count: `${dataResult.data.length} ${dataResult.data.length !== 1 ? 'people' : 'person'}`,
      icon: e(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          className: 'h-5 w-5 text-green-400',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
        },
        e('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        })
      ),
      actions: e(
        'button',
        {
          className:
            'bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm transition-colors',
          onClick: () => dataResult.setIsCreateModalOpen(true),
        },
        'New Person'
      ),
    }),

    // Search Section
    e(SearchSection, {
      searchBar: e(SearchBar, {
        value: dataResult.searchTerm,
        onChange: dataResult.setSearchTerm,
        placeholder: 'Search people by name, email, phone, address...',
        className: 'w-full',
      }),
    }),

    // People Table
    e(ContentSection, {
      variant: 'table',
      children: e(DataTable, {
        data: dataResult.data,
        columns: [
          {
            field: 'name',
            label: 'Name',
            sortable: true,
            render: (value) =>
              e(
                'span',
                { className: 'font-medium text-white' },
                value || 'N/A'
              ),
          },
          {
            field: 'email',
            label: 'Email',
            sortable: true,
            render: (value) =>
              e('span', { className: 'text-blue-400' }, value || 'N/A'),
          },
          {
            field: 'phone',
            label: 'Phone',
            sortable: true,
            render: (value) =>
              e('span', { className: 'text-gray-300' }, value || 'N/A'),
          },
          {
            field: 'address',
            label: 'Address',
            sortable: true,
            render: (value) => {
              // Handle both string and object address formats
              let addressText = 'N/A';
              if (typeof value === 'string') {
                addressText = value;
              } else if (value && typeof value === 'object') {
                // Format address object as string
                const parts = [
                  value.street,
                  value.city,
                  value.state,
                  value.zip,
                ].filter(Boolean);
                addressText = parts.length > 0 ? parts.join(', ') : 'N/A';
              }
              return e('span', { className: 'text-gray-300' }, addressText);
            },
          },
        ],
        onRowClick: dataResult.handlePersonClick,
        className: 'w-full',
        emptyMessage: 'No people found',
      }),
    })
  );
}

/**
 * Render function for PeopleTab modals
 * Implements the TabBase.js renderModals pattern
 */
function renderPeopleModals({ components, data: dataResult, props }) {
  const e = window.React.createElement;

  // Get PersonCreationModal with fallback
  const PersonCreationModal =
    window.NightingaleBusiness?.components?.PersonCreationModal ||
    window.NightingaleBusiness?.PersonCreationModal ||
    window.PersonCreationModal ||
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
                'Create Person'
              ),
              e(
                'p',
                { className: 'text-gray-400 mb-4' },
                'PersonCreationModal component not available'
              ),
              e(
                'button',
                {
                  className:
                    'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded',
                  onClick: onClose,
                },
                'Close'
              )
            )
          )
        : null);

  return e(
    'div',
    null,
    // Person Creation Modal
    e(PersonCreationModal, {
      isOpen: dataResult.isCreateModalOpen,
      onClose: () => dataResult.setIsCreateModalOpen(false),
      onPersonCreated: (newPerson) => {
        const updatedData = {
          ...props.fullData,
          people: [...(props.fullData.people || []), newPerson],
        };
        props.onUpdateData(updatedData);
        dataResult.setIsCreateModalOpen(false);
      },
      fullData: props.fullData,
    }),

    // Person Edit Modal (using same component with edit mode)
    dataResult.isEditModalOpen &&
      e(PersonCreationModal, {
        isOpen: dataResult.isEditModalOpen,
        onClose: () => {
          dataResult.setIsEditModalOpen(false);
          dataResult.setEditPersonId(null);
        },
        onPersonCreated: (updatedPerson) => {
          const updatedData = {
            ...props.fullData,
            people: props.fullData.people.map((p) =>
              p.id === updatedPerson.id ? updatedPerson : p
            ),
          };
          props.onUpdateData(updatedData);
          dataResult.setIsEditModalOpen(false);
          dataResult.setEditPersonId(null);
        },
        editPersonId: dataResult.editPersonId,
        fullData: props.fullData,
      })
  );
}

/**
 * Create PeopleTab component using TabBase.js factory
 */
const PeopleTab = window.createBusinessComponent({
  name: 'PeopleTab',
  useData: usePeopleData,
  renderContent: renderPeopleContent,
  renderModals: renderPeopleModals,
  defaultProps: {
    fullData: { people: [], cases: [] },
  },
});

// PropTypes validation
PeopleTab.propTypes = {
  fullData: window.PropTypes?.object,
  onUpdateData: window.PropTypes?.func,
  fileService: window.PropTypes?.object,
  onViewModeChange: window.PropTypes?.func,
  onBackToList: window.PropTypes?.func,
};

// Register with the business component registry
if (typeof window !== 'undefined') {
  window.PeopleTab = PeopleTab;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'PeopleTab',
      PeopleTab,
      'people-management',
      ['TabBase', 'DataTable', 'SearchBar', 'TabHeader']
    );
  }

  // Legacy registration for backward compatibility
  if (typeof window.Nightingale !== 'undefined') {
    window.Nightingale.registerComponent('PeopleTab', PeopleTab);
  }
}

// Export for ES6 module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PeopleTab;
}
