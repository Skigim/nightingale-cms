/**
 * DataTable Component
 * A comprehensive table component with sorting, pagination, and customizable styling
 * Combines the functionality from NightingaleReports with styling from NightingaleCMS
 */

const DataTable = ({
  data = [],
  columns = [],
  sortable = true,
  paginated = false,
  pageSize = 25,
  searchTerm = '',
  className = '',
  onRowClick = null,
  loading = false,
  emptyMessage = 'No data available',
  variant = 'default', // 'default', 'dark', 'compact'
  hover = true,
  striped = false,
  showHeader = true,
  density = 'normal', // 'compact', 'normal', 'comfortable'
  rowActions = [], // Array of action objects {label, icon, onClick, className}
  selectable = false,
  selectedRows = [],
  onSelectionChange = null,
  ...props
}) => {
  const {
    useState: useStateHook,
    useMemo: useMemoHook,
    useCallback: useCallbackHook,
  } = window.React;
  const e = window.React.createElement;

  // State management
  const [sortField, setSortField] = useStateHook(null);
  const [sortDirection, setSortDirection] = useStateHook('asc');
  const [currentPage, setCurrentPage] = useStateHook(0);
  const [rowsPerPage, setRowsPerPage] = useStateHook(pageSize);

  // Use external search term
  const activeSearchTerm = searchTerm;

  // Column configuration with defaults
  const processedColumns = useMemoHook(() => {
    return columns.map((col) => ({
      field: col.field || col.key,
      label: col.label || col.title || col.field || col.key,
      sortable: col.sortable !== false && sortable,
      width: col.width,
      align: col.align || 'left',
      render: col.render || col.renderCell,
      headerRender: col.headerRender,
      className: col.className || '',
      headerClassName: col.headerClassName || '',
      ...col,
    }));
  }, [columns, sortable]);

  // Data processing with search and sort
  const processedData = useMemoHook(() => {
    let filtered = [...data];

    // Apply search filter
    if (activeSearchTerm) {
      const searchLower = activeSearchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        processedColumns.some((col) => {
          const value = row[col.field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Handle date sorting
        if (aVal instanceof Date || bVal instanceof Date) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        // Handle numeric sorting
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, activeSearchTerm, sortField, sortDirection, processedColumns]);

  // Pagination
  const paginatedData = useMemoHook(() => {
    if (!paginated) return processedData;
    const start = currentPage * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, paginated, currentPage, rowsPerPage]);

  // Handlers
  const handleSort = useCallbackHook(
    (field) => {
      if (!field) return;

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField]
  );

  const handlePageChange = useCallbackHook((event, newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallbackHook((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);

  const handleRowSelect = useCallbackHook(
    (row, isSelected) => {
      if (!selectable || !onSelectionChange) return;

      const rowId = row.id || row._id || JSON.stringify(row);
      let newSelection = [...selectedRows];

      if (isSelected) {
        newSelection.push(rowId);
      } else {
        newSelection = newSelection.filter((id) => id !== rowId);
      }

      onSelectionChange(newSelection);
    },
    [selectable, selectedRows, onSelectionChange]
  );

  const handleSelectAll = useCallbackHook(
    (isSelected) => {
      if (!selectable || !onSelectionChange) return;

      if (isSelected) {
        const allIds = paginatedData.map(
          (row) => row.id || row._id || JSON.stringify(row)
        );
        onSelectionChange([...new Set([...selectedRows, ...allIds])]);
      } else {
        const pageIds = paginatedData.map(
          (row) => row.id || row._id || JSON.stringify(row)
        );
        onSelectionChange(selectedRows.filter((id) => !pageIds.includes(id)));
      }
    },
    [selectable, selectedRows, onSelectionChange, paginatedData]
  );

  // Style variants
  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return {
          container: 'bg-gray-800 border border-gray-700',
          table: 'w-full',
          header: 'bg-gray-700',
          headerCell:
            'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider',
          body: 'divide-y divide-gray-700',
          row: 'transition-colors',
          rowHover: hover ? 'hover:bg-gray-700' : '',
          cell: 'text-sm text-gray-300',
          evenRow: striped ? 'bg-gray-750' : '',
          pagination: 'bg-gray-750 border-t border-gray-700',
        };
      case 'compact':
        return {
          container: 'bg-white border border-gray-200 shadow-sm',
          table: 'w-full',
          header: 'bg-gray-50',
          headerCell:
            'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase',
          body: 'divide-y divide-gray-200',
          row: 'transition-colors',
          rowHover: hover ? 'hover:bg-gray-50' : '',
          cell: 'text-sm text-gray-900',
          evenRow: striped ? 'bg-gray-50' : '',
          pagination: 'bg-gray-50 border-t border-gray-200',
        };
      default:
        return {
          container: 'bg-gray-800 border border-gray-700 shadow-lg',
          table: 'w-full',
          header: 'bg-gray-700',
          headerCell:
            'px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider',
          body: 'divide-y divide-gray-700',
          row: 'transition-colors',
          rowHover: hover ? 'hover:bg-gray-700' : '',
          cell: 'text-sm text-gray-300',
          evenRow: striped ? 'bg-gray-750' : '',
          pagination: 'bg-gray-750 border-t border-gray-700',
        };
    }
  };

  const getDensityStyles = () => {
    switch (density) {
      case 'compact':
        return { cellPadding: 'px-3 py-2', headerPadding: 'px-3 py-2' };
      case 'comfortable':
        return { cellPadding: 'px-6 py-6', headerPadding: 'px-6 py-4' };
      default:
        return { cellPadding: 'px-6 py-4', headerPadding: 'px-6 py-3' };
    }
  };

  const styles = getVariantStyles();
  const densityStyles = getDensityStyles();

  // Render loading state
  if (loading) {
    return e(
      'div',
      {
        className: `rounded-lg overflow-hidden ${styles.container} ${className}`,
        ...props,
      },
      e(
        'div',
        { className: 'p-8 text-center' },
        e(
          'div',
          { className: 'inline-flex items-center space-x-2' },
          e(
            'svg',
            {
              className: 'animate-spin h-5 w-5 text-blue-500',
              fill: 'none',
              viewBox: '0 0 24 24',
            },
            e('circle', {
              className: 'opacity-25',
              cx: '12',
              cy: '12',
              r: '10',
              stroke: 'currentColor',
              strokeWidth: '4',
            }),
            e('path', {
              className: 'opacity-75',
              fill: 'currentColor',
              d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
            })
          ),
          e('span', { className: styles.cell }, 'Loading...')
        )
      )
    );
  }

  // Render empty state
  if (paginatedData.length === 0) {
    return e(
      'div',
      {
        className: `rounded-lg overflow-hidden ${styles.container} ${className}`,
        ...props,
      },
      e(
        'div',
        { className: 'p-12 text-center' },
        e(
          'svg',
          {
            className: 'mx-auto h-12 w-12 text-gray-400 mb-4',
            fill: 'none',
            viewBox: '0 0 24 24',
            stroke: 'currentColor',
          },
          e('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          })
        ),
        e(
          'p',
          {
            className: `text-gray-400 ${variant === 'compact' ? 'text-gray-500' : ''}`,
          },
          activeSearchTerm
            ? `No results found for "${activeSearchTerm}"`
            : emptyMessage
        )
      )
    );
  }

  return e(
    'div',
    {
      className: `rounded-lg overflow-hidden ${styles.container} ${className}`,
      ...props,
    },
    // Table
    e(
      'div',
      { className: 'overflow-x-auto' },
      e(
        'table',
        { className: styles.table },
        // Header
        showHeader &&
          e(
            'thead',
            { className: styles.header },
            e(
              'tr',
              null,
              // Selection column
              selectable &&
                e(
                  'th',
                  {
                    className: `${styles.headerCell} ${densityStyles.headerPadding} w-12`,
                  },
                  e('input', {
                    type: 'checkbox',
                    checked:
                      paginatedData.length > 0 &&
                      paginatedData.every((row) => {
                        const rowId = row.id || row._id || JSON.stringify(row);
                        return selectedRows.includes(rowId);
                      }),
                    onChange: (e) => handleSelectAll(e.target.checked),
                    className:
                      'h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-2',
                  })
                ),
              // Data columns
              processedColumns.map((col) =>
                e(
                  'th',
                  {
                    key: col.field,
                    className: `${styles.headerCell} ${densityStyles.headerPadding} ${col.headerClassName} ${
                      col.sortable ? 'cursor-pointer hover:bg-gray-600' : ''
                    }`,
                    style: col.width ? { width: col.width } : undefined,
                    onClick: col.sortable
                      ? () => handleSort(col.field)
                      : undefined,
                  },
                  e(
                    'div',
                    { className: 'flex items-center space-x-1' },
                    col.headerRender ? col.headerRender(col) : col.label,
                    col.sortable &&
                      sortField === col.field &&
                      e(
                        'svg',
                        {
                          className: `w-4 h-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`,
                          fill: 'none',
                          viewBox: '0 0 24 24',
                          stroke: 'currentColor',
                          strokeWidth: 2,
                        },
                        e('path', {
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                          d: 'M5 15l7-7 7 7',
                        })
                      )
                  )
                )
              ),
              // Actions column
              rowActions.length > 0 &&
                e(
                  'th',
                  {
                    className: `${styles.headerCell} ${densityStyles.headerPadding}`,
                  },
                  'Actions'
                )
            )
          ),
        // Body
        e(
          'tbody',
          { className: styles.body },
          paginatedData.map((row, index) => {
            const rowId = row.id || row._id || JSON.stringify(row);

            const isSelected = selectedRows.includes(rowId);
            const isEven = index % 2 === 0;

            return e(
              'tr',
              {
                key: rowId,
                className: `${styles.row} ${styles.rowHover} ${isEven ? styles.evenRow : ''} ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${isSelected ? 'bg-blue-900 bg-opacity-25' : ''}`,
                onClick: onRowClick ? () => onRowClick(row, index) : undefined,
              },
              // Selection column
              selectable &&
                e(
                  'td',
                  { className: `${densityStyles.cellPadding} w-12` },
                  e('input', {
                    type: 'checkbox',
                    checked: isSelected,
                    onChange: (e) => {
                      e.stopPropagation();
                      handleRowSelect(row, e.target.checked);
                    },
                    className:
                      'h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-2',
                  })
                ),
              // Data columns
              processedColumns.map((col) =>
                e(
                  'td',
                  {
                    key: col.field,
                    className: `${densityStyles.cellPadding} ${styles.cell} ${col.className}`,
                    style: { textAlign: col.align },
                  },
                  col.render
                    ? (() => {
                        // Handle actions columns and other columns without field data
                        if (
                          !col.field ||
                          col.header === 'Actions' ||
                          col.accessor === 'actions'
                        ) {
                          return col.render(row, index);
                        }
                        return col.render(row[col.field], row, index);
                      })()
                    : row[col.field]
                )
              ),
              // Actions column
              rowActions.length > 0 &&
                e(
                  'td',
                  {
                    className: `${densityStyles.cellPadding} text-sm font-medium`,
                  },
                  e(
                    'div',
                    { className: 'flex space-x-2' },
                    rowActions.map((action, actionIndex) =>
                      e(
                        'button',
                        {
                          key: actionIndex,
                          onClick: (e) => {
                            e.stopPropagation();
                            action.onClick(row, index);
                          },
                          className:
                            action.className ||
                            'p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-all duration-200',
                          title: action.label,
                        },
                        action.icon || action.label
                      )
                    )
                  )
                )
            );
          })
        )
      )
    ),
    // Pagination
    paginated &&
      e(
        'div',
        {
          className: `flex items-center justify-between px-4 py-2 ${styles.pagination}`,
        },
        e(
          'div',
          { className: 'flex items-center space-x-2' },
          e('span', { className: 'text-sm text-gray-300' }, 'Rows per page:'),
          e(
            'select',
            {
              value: rowsPerPage,
              onChange: handleRowsPerPageChange,
              className:
                'ml-2 bg-gray-600 text-white border-gray-500 rounded px-2 py-1 text-sm',
            },
            [10, 25, 50, 100].map((option) =>
              e('option', { key: option, value: option }, option)
            )
          )
        ),
        e(
          'div',
          { className: 'flex items-center space-x-4' },
          e(
            'span',
            { className: 'text-sm text-gray-300' },
            `${currentPage * rowsPerPage + 1}-${Math.min((currentPage + 1) * rowsPerPage, processedData.length)} of ${processedData.length}`
          ),
          e(
            'div',
            { className: 'flex items-center space-x-2' },
            e(
              'button',
              {
                onClick: () => handlePageChange(null, currentPage - 1),
                disabled: currentPage === 0,
                className:
                  'px-2 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500',
              },
              '‹'
            ),
            e(
              'span',
              { className: 'text-sm text-gray-300' },
              `${currentPage + 1} of ${Math.ceil(processedData.length / rowsPerPage)}`
            ),
            e(
              'button',
              {
                onClick: () => handlePageChange(null, currentPage + 1),
                disabled:
                  currentPage >=
                  Math.ceil(processedData.length / rowsPerPage) - 1,
                className:
                  'px-2 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500',
              },
              '›'
            )
          )
        )
      )
  );
};

// Make component available globally and register with UI registry
if (typeof window !== 'undefined') {
  window.DataTable = DataTable;

  // Register with the UI component registry when available
  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent('DataTable', DataTable, 'data');
  }
}
