/**
 * Parser Utilities Module
 * Bank Statement Transaction Parsing with Enhanced Warning Categorization
 */

/**
 * Enhanced Transaction Validation with Categorized Warnings
 * Separates parsing errors from OCR uncertainty
 */
window.validateTransactions = function (transactions) {
  console.log('🔍 Validating transactions with enhanced categorization...');

  const validated = [];

  for (let i = 0; i < transactions.length; i++) {
    const transaction = { ...transactions[i] };

    // Add validation flags with categorization
    transaction.warnings = [];
    transaction.parsingErrors = []; // Data validation issues
    transaction.ocrUncertainty = []; // Low confidence OCR issues

    // Check for suspicious amounts (parsing error - data validation)
    if (Math.abs(transaction.amount) > 50000) {
      transaction.parsingErrors.push('Large amount detected - verify accuracy');
    }

    // Check for missing decimals (parsing error - common OCR formatting issue)
    if (Math.abs(transaction.amount) >= 100 && transaction.amount % 1 === 0) {
      transaction.parsingErrors.push(
        'Whole dollar amount - verify no missing decimals'
      );
    }

    // Check description quality (OCR uncertainty - low confidence text recognition)
    if (transaction.confidence < 0.3) {
      transaction.ocrUncertainty.push(
        'Low confidence in transaction type matching'
      );
    }

    // Check OCR confidence from Tesseract
    if (transaction.ocrConfidence && transaction.ocrConfidence < 60) {
      transaction.ocrUncertainty.push(
        `Low OCR confidence: ${transaction.ocrConfidence.toFixed(1)}%`
      );
    }

    // Combine for legacy compatibility
    transaction.warnings = [
      ...transaction.parsingErrors,
      ...transaction.ocrUncertainty,
    ];
    transaction.hasWarnings = transaction.warnings.length > 0;
    transaction.hasParsingErrors = transaction.parsingErrors.length > 0;
    transaction.hasOcrUncertainty = transaction.ocrUncertainty.length > 0;

    validated.push(transaction);
  }

  return validated;
};

/**
 * Main Transaction Parser with Enhanced Warning System
 */
window.parseTransactions = function (text, confidence = 0) {
  console.log('📄 Parsing transactions with enhanced validation...');

  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const allTransactions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip header lines and non-transaction content
    if (
      line.match(/^(Date|Transaction|Description|Amount|Balance)/i) ||
      line.length < 10 ||
      !line.match(/\d/)
    ) {
      continue;
    }

    // Enhanced date matching
    const dateMatch = line.match(/(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/);
    if (!dateMatch) continue;

    try {
      // Extract amounts using improved regex
      const amountRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
      const amounts = [];
      let match;

      while ((match = amountRegex.exec(line)) !== null) {
        amounts.push(parseFloat(match[1].replace(/,/g, '')));
      }

      if (amounts.length === 0) continue;

      // Parse description
      let description = line
        .replace(dateMatch[0], '')
        .replace(/\$?[\d,]+\.?\d*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (description.length < 3) {
        description = `Transaction ${allTransactions.length + 1}`;
      }

      // Determine transaction amounts
      let debit = 0,
        credit = 0,
        balance = 0;

      if (amounts.length >= 2) {
        const amount = amounts[0];

        // Check for credit indicators
        const creditIndicators = /deposit|credit|refund|interest|dividend/i;
        const isCredit = creditIndicators.test(description);

        // Check if parentheses indicate debit
        const hasParentheses = line.includes('(') && line.includes(')');

        if (isCredit && !hasParentheses) {
          credit = amount;
        } else {
          debit = amount;
        }

        balance = amounts[amounts.length - 1];
      } else {
        balance = amounts[0];
      }

      // Enhanced date parsing
      let dateStr = dateMatch[1].replace(/,/g, '/');
      if (dateStr.match(/\d{1,2}[.,/]\d{1,2}[.,/]\d{2}$/)) {
        const parts = dateStr.split(/[.,/]/);
        const year = parseInt(parts[2]);
        parts[2] = year < 50 ? `20${year}` : `19${year}`;
        dateStr = parts.join('/');
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log('❌ INVALID DATE - SKIPPING:', dateStr);
        continue;
      }

      const transaction = {
        date: date,
        description: description,
        debit,
        credit,
        balance,
        originalLine: line,
        sourceConfidence: confidence,
      };

      // Enhanced validation with categorized warnings
      const warnings = [];
      const parsingErrors = []; // Data validation issues
      const ocrUncertainty = []; // Low confidence OCR issues

      // Check for large amounts (parsing error - data validation)
      const totalAmount = debit + credit;
      if (totalAmount > 10000) {
        parsingErrors.push(
          `Large amount: $${totalAmount.toFixed(2)} - check for missing decimal`
        );
      }

      // Check for decimal issues (parsing error - formatting issue)
      if (totalAmount > 0) {
        const amountStr = totalAmount.toString();
        if (
          amountStr.length > 4 &&
          !amountStr.includes('.') &&
          totalAmount % 1 === 0
        ) {
          const possibleDecimal = totalAmount / 100;
          if (possibleDecimal < 10000 && possibleDecimal > 0.01) {
            parsingErrors.push(
              `Missing decimal? Amount: $${totalAmount} might be $${possibleDecimal.toFixed(2)}`
            );
          }
        }
      }

      // Balance validation (parsing error - calculation issue)
      const previousBalance =
        allTransactions.length > 0
          ? allTransactions[allTransactions.length - 1].balance
          : null;
      if (previousBalance !== null && allTransactions.length > 0) {
        const expectedBalance = previousBalance + credit - debit;
        const balanceDiff = Math.abs(expectedBalance - balance);

        const significantError =
          balanceDiff > 1.0 ||
          (totalAmount > 0 && balanceDiff > totalAmount * 0.1);
        if (significantError) {
          parsingErrors.push(
            `Possible balance error: Expected $${expectedBalance.toFixed(2)}, got $${balance.toFixed(2)}`
          );
        }
      }

      // Description validation (OCR uncertainty - text recognition issues)
      if (description.length < 3) {
        ocrUncertainty.push('Description too short - possible OCR error');
      }

      // Suspicious characters (OCR uncertainty - text recognition issues)
      if (/[~§¥£€@#%^&*|\\`]/.test(description)) {
        ocrUncertainty.push('Unusual characters detected - possible OCR error');
      }

      // Missing amounts (parsing error - data validation)
      if (
        debit === 0 &&
        credit === 0 &&
        !description.toUpperCase().includes('OPENING BALANCE') &&
        !description.toUpperCase().includes('BALANCE') &&
        !description.toUpperCase().includes('FORWARD')
      ) {
        parsingErrors.push('No debit or credit amount found');
      }

      // OCR confidence check
      if (confidence < 60) {
        ocrUncertainty.push(
          `Low source OCR confidence: ${confidence.toFixed(1)}%`
        );
      }

      // Combine warnings for legacy compatibility
      warnings.push(...parsingErrors, ...ocrUncertainty);

      if (warnings.length > 0) {
        transaction.warnings = warnings;
        transaction.parsingErrors = parsingErrors;
        transaction.ocrUncertainty = ocrUncertainty;
        transaction.hasWarnings = true;
        transaction.hasParsingErrors = parsingErrors.length > 0;
        transaction.hasOcrUncertainty = ocrUncertainty.length > 0;
      }

      allTransactions.push(transaction);
    } catch (error) {
      console.error('❌ Error parsing line:', line, error);
      continue;
    }
  }

  console.log(`✅ Parsed ${allTransactions.length} transactions`);
  return allTransactions;
};

/**
 * Group Transactions by Year and Month
 */
window.groupTransactionsByDate = function (transactions) {
  const grouped = {};

  transactions.forEach((transaction) => {
    if (!transaction.date) return;

    const year = transaction.date.getFullYear();
    const month = transaction.date.toLocaleString('default', { month: 'long' });

    if (!grouped[year]) {
      grouped[year] = {};
    }

    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }

    grouped[year][month].push(transaction);
  });

  // Convert to array format for rendering
  const result = [];

  Object.keys(grouped)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .forEach((year) => {
      const months = [];

      Object.keys(grouped[year])
        .sort((a, b) => {
          const monthOrder = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          return monthOrder.indexOf(b) - monthOrder.indexOf(a);
        })
        .forEach((month) => {
          months.push({
            month: month,
            transactions: grouped[year][month].sort((a, b) => b.date - a.date),
          });
        });

      result.push({
        year: parseInt(year),
        months: months,
      });
    });

  return result;
};

/**
 * Enhanced Processing with Summary Statistics
 */
window.processTransactionsWithSummary = function (text, ocrConfidence = 0) {
  console.log('🚀 Processing transactions with enhanced summary...');

  // Parse transactions
  const transactions = window.parseTransactions(text, ocrConfidence);

  // Group by date
  const result = window.groupTransactionsByDate(transactions);

  // Enhanced summary logging with categorized warnings
  let totalTransactions = 0;
  let totalWarnings = 0;
  let totalParsingErrors = 0;
  let totalOcrUncertainty = 0;
  const warningBreakdown = {};
  const parsingErrorBreakdown = {};
  const ocrUncertaintyBreakdown = {};

  result.forEach((yearData) => {
    yearData.months.forEach((monthData) => {
      totalTransactions += monthData.transactions.length;
      monthData.transactions.forEach((transaction) => {
        if (transaction.hasWarnings) {
          totalWarnings++;

          // Track parsing errors (❌)
          if (transaction.hasParsingErrors) {
            totalParsingErrors++;
            transaction.parsingErrors.forEach((error) => {
              const errorType = error.split(':')[0];
              parsingErrorBreakdown[errorType] =
                (parsingErrorBreakdown[errorType] || 0) + 1;
            });
          }

          // Track OCR uncertainty (🔍)
          if (transaction.hasOcrUncertainty) {
            totalOcrUncertainty++;
            transaction.ocrUncertainty.forEach((uncertainty) => {
              const uncertaintyType = uncertainty.split(':')[0];
              ocrUncertaintyBreakdown[uncertaintyType] =
                (ocrUncertaintyBreakdown[uncertaintyType] || 0) + 1;
            });
          }

          // Legacy warning breakdown
          transaction.warnings.forEach((warning) => {
            const warningType = warning.split(':')[0];
            warningBreakdown[warningType] =
              (warningBreakdown[warningType] || 0) + 1;
          });
        }
      });
    });
  });

  console.log('📊 ENHANCED PARSING SUMMARY:');
  console.log(`  📝 Total transactions parsed: ${totalTransactions}`);
  console.log(`  ⚠️ Total transactions with warnings: ${totalWarnings}`);
  console.log(`  ❌ Parsing errors (data validation): ${totalParsingErrors}`);
  console.log(
    `  🔍 OCR uncertainty (text recognition): ${totalOcrUncertainty}`
  );
  console.log(
    `  📈 Warning rate: ${((totalWarnings / totalTransactions) * 100).toFixed(1)}%`
  );
  console.log('  🔍 Parsing error breakdown:', parsingErrorBreakdown);
  console.log('  🔍 OCR uncertainty breakdown:', ocrUncertaintyBreakdown);

  return result;
};

// Export functions for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateTransactions: window.validateTransactions,
    parseTransactions: window.parseTransactions,
    groupTransactionsByDate: window.groupTransactionsByDate,
    processTransactionsWithSummary: window.processTransactionsWithSummary,
  };
}
