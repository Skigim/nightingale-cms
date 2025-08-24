/**
 * Nightingale CMS - Financial Management Section Component
 *
 * This component handles the display and management of financial information
 * for cases, including resources, income, and expenses. It supports both
 * regular cases and SIMP cases with different layout patterns.
 *
 * Features:
 * - Financial item management (add, edit, delete)
 * - AVS import functionality
 * - SIMP case accordion layout support
 * - Financial item card display
 * - Section expansion/collapse
 *
 * @param {Object} props.caseData - Current case data with financial information
 * @param {Object} props.fullData - Full application data context
 * @param {Function} props.onUpdateData - Callback to update application data
 * @returns {React.Element} Financial management section component
 */
function FinancialManagementSection({ caseData, fullData, onUpdateData }) {
  const e = window.React.createElement;
  const { useState } = window.React;

  const [expandedSections, setExpandedSections] = useState({});
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [modalItemType, setModalItemType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null); // Store item ID being confirmed
  const [isAvsImportOpen, setIsAvsImportOpen] = useState(false); // AVS import modal state
  const isSimpCase = caseData.appDetails?.caseType === 'SIMP';

  // Ensure financials structure exists
  if (!caseData.financials) {
    caseData.financials = {
      resources: [],
      income: [],
      expenses: [],
    };
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addFinancialItem = (type) => {
    setEditingItem(null);
    setModalItemType(type);
    setIsFinancialModalOpen(true);
  };

  const removeFinancialItem = (type, itemId) => {
    const updatedCase = {
      ...caseData,
      financials: {
        ...caseData.financials,
        [type]: caseData.financials[type].filter((item) => item.id !== itemId),
      },
    };

    const updatedCases =
      window.NightingaleDataManagement.updateCaseInCollection(
        fullData.cases,
        caseData.id,
        updatedCase
      );

    onUpdateData({ ...fullData, cases: updatedCases });
  };

  const confirmDelete = (type, item) => {
    setConfirmingDelete(item.id);
  };

  const handleDeleteConfirm = (type, itemId) => {
    removeFinancialItem(type, itemId);
    setConfirmingDelete(null);
  };

  const handleDeleteCancel = () => {
    setConfirmingDelete(null);
  };

  const updateFinancialItem = (type, itemId) => {
    setEditingItem(
      caseData.financials[type].find((item) => item.id === itemId)
    );
    setModalItemType(type);
    setIsFinancialModalOpen(true);
  };

  // AVS Import Handler
  const handleAvsImport = (importedItems) => {
    console.log('🔄 Importing AVS data:', importedItems);

    // Transform imported items using helper function
    const transformedItems = window.NightingaleUtils.transformFinancialItems
      ? window.NightingaleUtils.transformFinancialItems(importedItems)
      : importedItems;

    // Add to case financial resources
    const updatedCase = {
      ...caseData,
      financials: {
        ...caseData.financials,
        resources: [
          ...(caseData.financials.resources || []),
          ...transformedItems,
        ],
      },
    };

    // Update the full data using helper function
    const updatedCases =
      window.NightingaleDataManagement.updateCaseInCollection(
        fullData.cases,
        caseData.id,
        updatedCase
      );
    onUpdateData({ ...fullData, cases: updatedCases });

    // Show success notification
    if (window.NightingaleToast) {
      window.NightingaleToast.show({
        message: `Successfully imported ${transformedItems.length} financial item${transformedItems.length !== 1 ? 's' : ''} from AVS`,
        type: 'success',
        duration: 5000,
      });
    }

    // Close the modal
    setIsAvsImportOpen(false);
  };

  const renderFinancialTable = (type, items, title) => {
    const isExpanded = expandedSections[type];
    const displayItems = isExpanded ? items : items.slice(0, 3);

    return e(
      'div',
      { className: 'bg-gray-800 p-4 rounded-lg shadow-lg' },

      // Header
      e(
        'div',
        { className: 'flex justify-between items-center mb-3' },
        e('h4', { className: 'text-md font-bold text-blue-400' }, title),
        e(
          'div',
          { className: 'flex items-center space-x-2' },
          e(
            'button',
            {
              onClick: () => addFinancialItem(type),
              className:
                'bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md',
            },
            'Add'
          ),
          // AVS Import button - only show for resources
          type === 'resources' &&
            e(
              'button',
              {
                onClick: () => setIsAvsImportOpen(true),
                className:
                  'bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-md flex items-center space-x-1',
                title: 'Import financial data from AVS',
              },
              e('span', {}, '🔄'),
              e('span', {}, 'Import AVS')
            )
        )
      ),

      // Items List - Using FinancialItemCard Component
      e(
        'div',
        { className: 'space-y-2' },
        displayItems.length === 0
          ? e(
              'p',
              { className: 'text-gray-500 text-sm text-center py-4' },
              `No ${type} items`
            )
          : displayItems.map((item) =>
              e(window.FinancialItemCard, {
                key: item.id,
                item: item,
                itemType: type,
                interactive: true,
                showActions: true,
                confirmingDelete: confirmingDelete === item.id,
                onEdit: () => updateFinancialItem(type, item.id),
                onDelete: () => confirmDelete(type, item),
                onDeleteConfirm: () => handleDeleteConfirm(type, item.id),
                onDeleteCancel: handleDeleteCancel,
              })
            )
      ),

      // Show More/Less Button
      items.length > 3 &&
        e(
          'button',
          {
            onClick: () => toggleSection(type),
            className:
              'w-full mt-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded',
          },
          isExpanded
            ? `Show Less (${items.length - 3} hidden)`
            : `Show More (${items.length - 3} more)`
        )
    );
  };

  const renderSimpAccordionSection = (title, owner, financials) => {
    const sectionKey = `${owner}_accordion`;
    const isExpanded = expandedSections[sectionKey];

    const ownerFinancials = {
      resources:
        financials.resources?.filter((item) => item.owner === owner) || [],
      income: financials.income?.filter((item) => item.owner === owner) || [],
      expenses:
        financials.expenses?.filter((item) => item.owner === owner) || [],
    };

    const totalItems =
      ownerFinancials.resources.length +
      ownerFinancials.income.length +
      ownerFinancials.expenses.length;

    return e(
      'div',
      { className: 'bg-gray-800 rounded-lg overflow-hidden' },
      e(
        'button',
        {
          onClick: () => toggleSection(sectionKey),
          className:
            'w-full p-4 text-left bg-gray-700 hover:bg-gray-600 flex justify-between items-center',
        },
        e(
          'div',
          {},
          e('h4', { className: 'text-lg font-semibold text-blue-400' }, title),
          e('p', { className: 'text-sm text-gray-400' }, `${totalItems} items`)
        ),
        e(
          'svg',
          {
            className: `w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`,
            fill: 'none',
            viewBox: '0 0 24 24',
            stroke: 'currentColor',
          },
          e('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M19 9l-7 7-7-7',
          })
        )
      ),
      isExpanded &&
        e(
          'div',
          { className: 'p-4 space-y-4' },
          e(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
            renderFinancialTable(
              'resources',
              ownerFinancials.resources,
              'Resources'
            ),
            renderFinancialTable('income', ownerFinancials.income, 'Income'),
            renderFinancialTable(
              'expenses',
              ownerFinancials.expenses,
              'Expenses'
            )
          )
        )
    );
  };

  return e(
    window.React.Fragment,
    {},
    e(
      'div',
      { className: 'bg-gray-800 p-6 rounded-lg' },

      isSimpCase
        ? // SIMP Case - Accordion Layout
          e(
            'div',
            { className: 'space-y-4' },
            renderSimpAccordionSection(
              'Applicant Financials',
              'applicant',
              caseData.financials
            ),
            renderSimpAccordionSection(
              'Joint Financials',
              'joint',
              caseData.financials
            ),
            renderSimpAccordionSection(
              'Spouse Financials',
              'spouse',
              caseData.financials
            )
          )
        : // Regular Case - Grid Layout
          e(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
            renderFinancialTable(
              'resources',
              caseData.financials.resources || [],
              'Resources'
            ),
            renderFinancialTable(
              'income',
              caseData.financials.income || [],
              'Income'
            ),
            renderFinancialTable(
              'expenses',
              caseData.financials.expenses || [],
              'Expenses'
            )
          )
    ),

    // Financial Item Modal (from extracted component)
    window.FinancialItemModal &&
      e(window.FinancialItemModal, {
        isOpen: isFinancialModalOpen,
        onClose: () => {
          setIsFinancialModalOpen(false);
          setEditingItem(null);
          setModalItemType('');
        },
        caseData,
        fullData,
        onUpdateData,
        itemType: modalItemType,
        editingItem,
      }),

    // AVS Import Modal
    window.AvsImportModal &&
      e(window.AvsImportModal, {
        isOpen: isAvsImportOpen,
        onClose: () => setIsAvsImportOpen(false),
        onImport: handleAvsImport,
        masterCaseId: caseData.mcn || caseData.id,
        ownerFilter: 'applicant',
        existingResources: caseData.financials?.resources || [],
      })
  );
}

// Register with business component system
if (typeof window !== 'undefined') {
  window.FinancialManagementSection = FinancialManagementSection;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'FinancialManagementSection',
      FinancialManagementSection
    );
  }
}
