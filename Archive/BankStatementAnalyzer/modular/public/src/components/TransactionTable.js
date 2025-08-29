/**
 * TransactionTable Component
 * Displays transactions with enhanced warning categorization
 */

function TransactionTable({ data, filterType, setFilterType, sortField, setSortField, sortDirection, setSortDirection }) {
  const e = window.React.createElement;
  const { useMemo } = window.React;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sortTransactions = (transactions) => {
      return [...transactions].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'date':
            aValue = a.date ? a.date.getTime() : 0;
            bValue = b.date ? b.date.getTime() : 0;
            break;
          case 'description':
            aValue = a.description.toLowerCase();
            bValue = b.description.toLowerCase();
            break;
          case 'debit':
            aValue = a.debit || 0;
            bValue = b.debit || 0;
            break;
          case 'credit':
            aValue = a.credit || 0;
            bValue = b.credit || 0;
            break;
          case 'balance':
            aValue = a.balance || 0;
            bValue = b.balance || 0;
            break;
          default:
            return 0;
        }

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    };

    const filterTransactions = (transactions) => {
      switch (filterType) {
        case 'credit':
          return transactions.filter(t => t.credit > 0);
        case 'debit':
          return transactions.filter(t => t.debit > 0);
        case 'warnings':
          return transactions.filter(t => t.hasWarnings);
        default:
          return transactions;
      }
    };
    
    return data.map(yearData => ({
      ...yearData,
      months: yearData.months.map(monthData => ({
        ...monthData,
        transactions: filterTransactions(sortTransactions(monthData.transactions))
      }))
    }));
  }, [data, filterType, sortField, sortDirection]);

  if (!data || data.length === 0) {
    return e('div', { className: 'text-center text-muted' }, [
      e('p', { key: 'message' }, '📄 Upload a bank statement PDF to see transactions here.')
    ]);
  }

  return e('div', { className: 'page-grid' },
    processedData.map((yearData) =>
      yearData.months.map((monthData) => {
        const processedTransactions = monthData.transactions;

        return e(
          'div',
          {
            key: `${yearData.year}-${monthData.month}`,
            className: 'month-card',
          },
          [
            e('div', { className: 'month-header', key: 'header' }, [
              e('span', { className: 'year-label', key: 'year' }, yearData.year),
              e('span', { className: 'month-label', key: 'month' }, monthData.month),
              e(
                'div',
                { className: 'filter-controls', key: 'controls' },
                e(
                  'select',
                  {
                    className: 'filter-select',
                    value: filterType,
                    onChange: (e) => setFilterType(e.target.value),
                  },
                  [
                    e('option', { value: 'all', key: 'all' }, 'All Transactions'),
                    e('option', { value: 'credit', key: 'credit' }, 'Credits Only'),
                    e('option', { value: 'debit', key: 'debit' }, 'Debits Only'),
                    e('option', { value: 'warnings', key: 'warnings' }, 'Warnings Only'),
                  ]
                )
              ),
            ]),
            e('div', { className: 'transactions-column', key: 'transactions' }, [
              e('div', { className: 'transaction-header', key: 'header' }, [
                e(
                  'div',
                  {
                    className: 'transaction-date',
                    onClick: () => handleSort('date'),
                    key: 'date',
                  },
                  ['Date', e('span', { className: 'sort-indicator' }, getSortIndicator('date'))]
                ),
                e(
                  'div',
                  {
                    className: 'transaction-description',
                    onClick: () => handleSort('description'),
                    key: 'description',
                  },
                  [
                    'Description',
                    e('span', { className: 'sort-indicator' }, getSortIndicator('description')),
                  ]
                ),
                e(
                  'div',
                  {
                    onClick: () => handleSort('debit'),
                    key: 'debit',
                  },
                  [
                    'Debit',
                    e('span', { className: 'sort-indicator' }, getSortIndicator('debit')),
                  ]
                ),
                e(
                  'div',
                  {
                    onClick: () => handleSort('credit'),
                    key: 'credit',
                  },
                  [
                    'Credit',
                    e('span', { className: 'sort-indicator' }, getSortIndicator('credit')),
                  ]
                ),
                e(
                  'div',
                  {
                    onClick: () => handleSort('balance'),
                    key: 'balance',
                  },
                  [
                    'Balance',
                    e('span', { className: 'sort-indicator' }, getSortIndicator('balance')),
                  ]
                ),
              ]),
              // Warning Legend
              e('div', { className: 'warning-legend', key: 'legend' }, [
                e('span', { key: 'label' }, 'Warning Icons:'),
                e('div', { className: 'legend-item', key: 'parsing' }, [
                  e('span', { className: 'legend-icon', key: 'icon' }, '❌'),
                  e('span', { key: 'text' }, 'Parsing Error')
                ]),
                e('div', { className: 'legend-item', key: 'ocr' }, [
                  e('span', { className: 'legend-icon', key: 'icon' }, '🔍'),
                  e('span', { key: 'text' }, 'OCR Uncertainty')
                ])
              ]),
              ...processedTransactions.map((trans, index) =>
                e(
                  'div',
                  {
                    key: index,
                    className: `transaction-row ${
                      trans.hasParsingErrors 
                        ? 'parsing-error-row' 
                        : trans.hasOcrUncertainty 
                          ? 'ocr-uncertainty-row' 
                          : trans.hasWarnings 
                            ? 'warning-row' 
                            : ''
                    }`,
                  },
                  [
                    e(
                      'div',
                      { className: 'transaction-date', key: 'date' },
                      trans.date
                        ? trans.date.toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: '2-digit',
                          })
                        : '-'
                    ),
                    e('div', { className: 'transaction-description', key: 'description' }, [
                      trans.description,
                      // Show parsing errors with red exclamation
                      trans.hasParsingErrors &&
                        e(
                          'span',
                          {
                            className: 'parsing-error warning-tooltip',
                            title: `Parsing Error: ${trans.parsingErrors.join('; ')}`,
                            key: 'parsing-error',
                          },
                          '❌'
                        ),
                      // Show OCR uncertainty with yellow warning
                      trans.hasOcrUncertainty &&
                        e(
                          'span',
                          {
                            className: 'ocr-uncertainty warning-tooltip',
                            title: `OCR Uncertainty: ${trans.ocrUncertainty.join('; ')}`,
                            key: 'ocr-uncertainty',
                          },
                          '🔍'
                        ),
                    ]),
                    e(
                      'div',
                      { className: 'debit', key: 'debit' },
                      trans.debit > 0 ? `($${trans.debit.toFixed(2)})` : '-'
                    ),
                    e(
                      'div',
                      { className: 'credit', key: 'credit' },
                      trans.credit > 0 ? `$${trans.credit.toFixed(2)}` : '-'
                    ),
                    e(
                      'div',
                      { className: 'balance', key: 'balance' },
                      `$${trans.balance.toFixed(2)}`
                    ),
                  ]
                )
              ),
            ]),
          ]
        );
      })
    ).flat()
  );
}

// Register component globally
if (typeof window !== 'undefined') {
  window.TransactionTable = TransactionTable;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TransactionTable };
}
