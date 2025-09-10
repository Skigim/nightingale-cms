import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

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
  // State management
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Use external search term
  const activeSearchTerm = searchTerm;

  // Column configuration with defaults
  const processedColumns = useMemo(() => {
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
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (activeSearchTerm) {
      const searchLower = activeSearchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        processedColumns.some((col) => {
          const value = row[col.field];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        }),
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
  const paginatedData = useMemo(() => {
    if (!paginated) return processedData;
    const start = currentPage * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, paginated, currentPage, rowsPerPage]);

  // Handlers
  const handleSort = useCallback(
    (field) => {
      if (!field) return;

      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField],
  );

  const handlePageChange = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);

  const handleRowSelect = useCallback(
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
    [selectable, selectedRows, onSelectionChange],
  );

  const handleSelectAll = useCallback(
    (isSelected) => {
      if (!selectable || !onSelectionChange) return;

      if (isSelected) {
        const allIds = paginatedData.map(
          (row) => row.id || row._id || JSON.stringify(row),
        );
        onSelectionChange([...new Set([...selectedRows, ...allIds])]);
      } else {
        const pageIds = paginatedData.map(
          (row) => row.id || row._id || JSON.stringify(row),
        );
        onSelectionChange(selectedRows.filter((id) => !pageIds.includes(id)));
      }
    },
    [selectable, selectedRows, onSelectionChange, paginatedData],
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
    return (
      <div
        className={`rounded-lg overflow-hidden ${styles.container} ${className}`}
        {...props}
      >
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className={styles.cell}>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!paginatedData.length) {
    return (
      <div
        className={`rounded-lg overflow-hidden ${styles.container} ${className}`}
        {...props}
      >
        <div className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p
            className={`text-gray-400 ${variant === 'compact' ? 'text-gray-500' : ''}`}
          >
            {activeSearchTerm
              ? `No results found for "${activeSearchTerm}"`
              : emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  // Helper function to determine if row is selected
  const isRowSelected = (row) => {
    if (!selectable) return false;
    const rowId = row.id || row._id || JSON.stringify(row);
    return selectedRows.includes(rowId);
  };

  // Helper function to determine if all visible rows are selected
  const areAllRowsSelected = () => {
    if (!selectable || !paginatedData.length) return false;
    return paginatedData.every((row) => isRowSelected(row));
  };

  // Helper function to render sort indicator
  const renderSortIcon = (field) => {
    if (!sortField || sortField !== field) {
      return (
        <svg
          className="w-4 h-4 ml-2 opacity-50"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5 12l5-5 5 5H5z" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg
        className="w-4 h-4 ml-2"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M14.707 10.293a1 1 0 010 1.414L10 16.414l-4.707-4.707a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 ml-2"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5.293 9.707a1 1 0 010-1.414L10 3.586l4.707 4.707a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  // Render cell content
  const renderCell = (row, column, rowIndex) => {
    const value = row[column.field];

    if (column.render && typeof column.render === 'function') {
      return column.render(value, row, rowIndex);
    }

    if (value == null) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();

    return String(value);
  };

  // Render table
  return (
    <div
      className={`rounded-lg overflow-hidden ${styles.container} ${className}`}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className={styles.table}>
          {/* Table Header */}
          {showHeader && (
            <thead className={styles.header}>
              <tr>
                {/* Selection column */}
                {selectable && (
                  <th
                    className={`${styles.headerCell} ${densityStyles.headerPadding} w-12`}
                  >
                    <input
                      type="checkbox"
                      checked={areAllRowsSelected()}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-2"
                      aria-label="Select all rows"
                    />
                  </th>
                )}

                {/* Data columns */}
                {processedColumns.map((column) => (
                  <th
                    key={column.field}
                    className={`${styles.headerCell} ${densityStyles.headerPadding} ${column.headerClassName} ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-600' : ''
                    }`}
                    style={{ width: column.width, textAlign: column.align }}
                    onClick={() => column.sortable && handleSort(column.field)}
                    role={column.sortable ? 'button' : undefined}
                    aria-sort={
                      sortField === column.field
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className="flex items-center space-x-1">
                      {column.headerRender
                        ? typeof column.headerRender === 'function'
                          ? column.headerRender(column)
                          : column.headerRender
                        : column.label}
                    </div>
                  </th>
                ))}

                {/* Actions column */}
                {rowActions.length > 0 && (
                  <th
                    className={`${styles.headerCell} ${densityStyles.headerPadding} w-24`}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
          )}

          {/* Table Body */}
          <tbody className={styles.body}>
            {paginatedData.map((row, rowIndex) => {
              const isSelected = isRowSelected(row);
              const rowKey = row.id || row._id || `row-${rowIndex}`;

              return (
                <tr
                  key={rowKey}
                  className={`
                    ${styles.row} 
                    ${styles.rowHover}
                    ${rowIndex % 2 === 1 ? styles.evenRow : ''}
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick && onRowClick(row, rowIndex)}
                >
                  {/* Selection column */}
                  {selectable && (
                    <td className={`${densityStyles.cellPadding} w-12`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(row, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-2"
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}

                  {/* Data columns */}
                  {processedColumns.map((column) => (
                    <td
                      key={column.field}
                      className={`${styles.cell} ${densityStyles.cellPadding} ${column.className}`}
                      style={{ textAlign: column.align }}
                    >
                      {renderCell(row, column, rowIndex)}
                    </td>
                  ))}

                  {/* Actions column */}
                  {rowActions.length > 0 && (
                    <td className={`${densityStyles.cellPadding} w-24`}>
                      <div className="flex items-center space-x-2">
                        {rowActions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            type="button"
                            className={`text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${
                              action.className || ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick && action.onClick(row, rowIndex);
                            }}
                            title={action.label}
                          >
                            {action.icon || action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && processedData.length > 0 && (
        <div
          className={`flex items-center justify-between px-4 py-2 ${styles.pagination}`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="ml-2 bg-gray-600 text-white border-gray-500 rounded px-2 py-1 text-sm"
            >
              {[10, 25, 50, 100].map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              {`${currentPage * rowsPerPage + 1}-${Math.min((currentPage + 1) * rowsPerPage, processedData.length)} of ${processedData.length}`}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => handlePageChange(null, currentPage - 1)}
                className="px-2 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
              >
                ‹
              </button>

              <span className="text-sm text-gray-300">
                {`${currentPage + 1} of ${Math.ceil(processedData.length / rowsPerPage)}`}
              </span>

              <button
                type="button"
                disabled={
                  currentPage >=
                  Math.ceil(processedData.length / rowsPerPage) - 1
                }
                onClick={() => handlePageChange(null, currentPage + 1)}
                className="px-2 py-1 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DataTable.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string,
      key: PropTypes.string,
      label: PropTypes.string,
      title: PropTypes.string,
      sortable: PropTypes.bool,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      align: PropTypes.oneOf(['left', 'center', 'right']),
      render: PropTypes.func,
      renderCell: PropTypes.func,
      headerRender: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
      className: PropTypes.string,
      headerClassName: PropTypes.string,
    }),
  ),
  sortable: PropTypes.bool,
  paginated: PropTypes.bool,
  pageSize: PropTypes.number,
  searchTerm: PropTypes.string,
  className: PropTypes.string,
  onRowClick: PropTypes.func,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'dark', 'compact']),
  hover: PropTypes.bool,
  striped: PropTypes.bool,
  showHeader: PropTypes.bool,
  density: PropTypes.oneOf(['compact', 'normal', 'comfortable']),
  rowActions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      onClick: PropTypes.func,
      className: PropTypes.string,
    }),
  ),
  selectable: PropTypes.bool,
  selectedRows: PropTypes.array,
  onSelectionChange: PropTypes.func,
};

// Register with UI registry (legacy global removal)
registerComponent('ui', 'DataTable', DataTable);

// ES6 Module Export
export default DataTable;
