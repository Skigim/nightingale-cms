#!/usr/bin/env node

/**
 * Nightingale React Compliance Audit Platform
 *
 * Comprehensive audit tool to ensure adherence to React Rules and best practices
 * Based on official React.dev documentation and Rules of React
 *
 * Usage: node react-compliance-audit.js [--fix] [--verbose] [--component=ComponentName]
 */

const fs = require('fs');
const path = require('path');

class ReactComplianceAuditor {
  constructor(options = {}) {
    this.options = {
      fix: options.fix || false,
      verbose: options.verbose || false,
      component: options.component || null,
      rootDir: path.resolve(__dirname, '..'),
      ...options,
    };

    this.violations = [];
    this.warnings = [];
    this.fixes = [];
    this.stats = {
      filesScanned: 0,
      componentsAnalyzed: 0,
      hooksAnalyzed: 0,
      violationsFound: 0,
      warningsFound: 0,
      fixesApplied: 0,
    };
  }

  /**
   * Main audit entry point
   */
  async runAudit() {
    console.log('🔍 Nightingale React Compliance Audit Starting...\n');

    try {
      // 1. Core Rules of React
      await this.auditComponentPurity();
      await this.auditReactCallPatterns();
      await this.auditHookRules();

      // 2. React DOM Compliance
      await this.auditReactDOMUsage();
      await this.auditFormPatterns();

      // 3. Performance & Best Practices
      await this.auditPerformancePatterns();
      await this.auditAccessibility();

      // 4. Architecture & Structure
      await this.auditComponentArchitecture();
      await this.auditErrorHandling();

      // 5. Generate Report
      this.generateReport();

      if (this.options.fix) {
        await this.applyFixes();
      }
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Rule 1: Components and Hooks Must Be Pure
   */
  async auditComponentPurity() {
    console.log('📋 Auditing Component Purity...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      this.stats.filesScanned++;

      // Check for side effects in render
      this.checkSideEffectsInRender(file, content);

      // Check for direct mutations
      this.checkDirectMutations(file, content);

      // Check for non-idempotent patterns
      this.checkIdempotency(file, content);

      // Check for props/state immutability
      this.checkImmutability();
    }
  }

  /**
   * Rule 2: React Calls Components and Hooks
   */
  async auditReactCallPatterns() {
    console.log('🎯 Auditing React Call Patterns...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for direct component function calls
      this.checkDirectComponentCalls(file, content);

      // Check for improper hook usage
      this.checkHookUsagePatterns(file, content);
    }
  }

  /**
   * Rule 3: Rules of Hooks
   */
  async auditHookRules() {
    console.log('🪝 Auditing Hook Rules...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check hooks only at top level
      this.checkHookTopLevel(file, content);

      // Check hooks only in React functions
      this.checkHookInReactFunctions(file, content);

      // Check custom hook naming
      this.checkCustomHookNaming(file, content);
    }
  }

  /**
   * React DOM API Usage
   */
  async auditReactDOMUsage() {
    console.log('🌐 Auditing React DOM Usage...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for modern React 18+ patterns
      this.checkModernReactPatterns(file, content);

      // Check portal usage
      this.checkPortalUsage(file, content);

      // Check createRoot vs legacy render
      this.checkRootApiUsage(file, content);
    }
  }

  /**
   * Form Patterns & useFormStatus
   */
  async auditFormPatterns() {
    console.log('📝 Auditing Form Patterns...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check useFormStatus usage
      this.checkFormStatusUsage(file, content);

      // Check controlled vs uncontrolled components
      this.checkFormControlPatterns(file, content);

      // Check form accessibility
      this.checkFormAccessibility(file, content);
    }
  }

  /**
   * Performance Patterns
   */
  async auditPerformancePatterns() {
    console.log('⚡ Auditing Performance Patterns...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check unnecessary useMemo/useCallback
      this.checkUnnecessaryOptimizations(file, content);

      // Check missing React.memo opportunities
      this.checkMemoOpportunities(file, content);

      // Check key prop usage
      this.checkKeyPropUsage(file, content);
    }
  }

  /**
   * Accessibility Audit
   */
  async auditAccessibility() {
    console.log('♿ Auditing Accessibility...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check ARIA attributes
      this.checkAriaUsage(file, content);

      // Check semantic HTML
      this.checkSemanticHTML(file, content);

      // Check form labels
      this.checkFormLabels(file, content);
    }
  }

  /**
   * Component Architecture
   */
  async auditComponentArchitecture() {
    console.log('🏗️ Auditing Component Architecture...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check component naming conventions
      this.checkNamingConventions(file, content);

      // Check component structure
      this.checkComponentStructure(file, content);

      // Check prop validation
      this.checkPropValidation(file, content);
    }
  }

  /**
   * Error Handling
   */
  async auditErrorHandling() {
    console.log('🛡️ Auditing Error Handling...');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Check ErrorBoundary usage
      this.checkErrorBoundaries(file, content);

      // Check Suspense usage
      this.checkSuspenseUsage(file, content);

      // Check error handling patterns
      this.checkErrorHandlingPatterns(file, content);
    }
  }

  // Implementation methods for each audit category...

  /**
   * Check for props/state immutability violations
   */
  checkImmutability() {
    // This is already covered by checkDirectMutations
    // but we can add specific immutability checks here
    return true;
  }

  /**
   * Check for React DOM usage patterns
   */
  checkPortalUsage(file, content) {
    // Check for proper createPortal usage
    if (content.includes('createPortal')) {
      // Basic check - more detailed implementation can be added
      return true;
    }
    return false;
  }

  /**
   * Check for root API usage
   */
  checkRootApiUsage(file, content) {
    // Check for legacy ReactDOM.render
    if (content.includes('ReactDOM.render')) {
      const lineNumber = this.getLineNumber(content, 'ReactDOM.render');
      this.addViolation('LEGACY_RENDER_API', file, lineNumber, {
        code: 'ReactDOM.render',
        message: 'Use createRoot() instead of ReactDOM.render',
        severity: 'error',
        fix: 'Replace with createRoot().render()',
      });
    }
  }

  /**
   * Check for modern React patterns
   */
  checkModernReactPatterns(file, content) {
    this.checkRootApiUsage(file, content);
    this.checkPortalUsage(file, content);
  }

  /**
   * Check form control patterns
   */
  checkFormControlPatterns(file, content) {
    // Check for controlled vs uncontrolled components
    const formElements = ['input', 'select', 'textarea'];

    formElements.forEach((element) => {
      const pattern = new RegExp(`<${element}[^>]*value=`, 'g');
      const matches = content.match(pattern);

      if (matches) {
        matches.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);
          // Check if onChange is also present
          const elementBlock = this.getElementContext(content, match);
          if (!elementBlock.includes('onChange')) {
            this.addViolation('CONTROLLED_WITHOUT_ONCHANGE', file, lineNumber, {
              code: match,
              message: 'Controlled component missing onChange handler',
              severity: 'error',
              fix: 'Add onChange handler for controlled component',
            });
          }
        });
      }
    });
  }

  /**
   * Check form accessibility
   */
  checkFormAccessibility(file, content) {
    // Check for labels and form accessibility
    const inputPattern = /<input[^>]*>/g;
    let match;

    while ((match = inputPattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match[0]);

      if (!match[0].includes('aria-label') && !match[0].includes('id=')) {
        this.addViolation('MISSING_INPUT_LABEL', file, lineNumber, {
          code: match[0],
          message: 'Input missing label or aria-label',
          severity: 'warning',
          fix: 'Add proper labeling for accessibility',
        });
      }
    }
  }

  /**
   * Check form status usage
   */
  checkFormStatusUsage(file, content) {
    if (content.includes('useFormStatus')) {
      // Check if used correctly (not in same component as form)
      const lineNumber = this.getLineNumber(content, 'useFormStatus');

      if (content.includes('<form')) {
        this.addViolation('FORM_STATUS_SAME_COMPONENT', file, lineNumber, {
          code: 'useFormStatus',
          message:
            'useFormStatus should be in child component, not same component as form',
          severity: 'error',
          fix: 'Move useFormStatus to child component inside form',
        });
      }
    }
  }

  /**
   * Check for unnecessary optimizations
   */
  checkUnnecessaryOptimizations(file, content) {
    // Check for overuse of useMemo/useCallback
    const memoPattern = /useMemo\s*\(/g;
    const callbackPattern = /useCallback\s*\(/g;

    const memoCount = (content.match(memoPattern) || []).length;
    const callbackCount = (content.match(callbackPattern) || []).length;

    if (memoCount > 5 || callbackCount > 5) {
      this.addViolation('EXCESSIVE_OPTIMIZATION', file, 1, {
        code: `useMemo: ${memoCount}, useCallback: ${callbackCount}`,
        message: 'Possible over-optimization with too many useMemo/useCallback',
        severity: 'warning',
        fix: 'Only optimize when performance issues are measured',
      });
    }
  }

  /**
   * Check for React.memo opportunities
   */
  checkMemoOpportunities(file, content) {
    // Find components that might benefit from React.memo
    const componentPattern = /function\s+([A-Z]\w+)/g;
    let match;

    while ((match = componentPattern.exec(content)) !== null) {
      const componentName = match[1];

      if (!content.includes(`memo(${componentName})`)) {
        const lineNumber = this.getLineNumber(content, match[0]);

        this.addWarning('MEMO_OPPORTUNITY', file, lineNumber, {
          component: componentName,
          message: `Consider React.memo for component ${componentName}`,
          severity: 'info',
          fix: `Wrap with memo: export default memo(${componentName})`,
        });
      }
    }
  }

  /**
   * Check key prop usage
   */
  checkKeyPropUsage(file, content) {
    // Look for .map without key
    const mapPattern = /\.map\s*\([^)]*\)\s*=>/g;
    let match;

    while ((match = mapPattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match[0]);
      const context = this.getElementContext(content, match[0]);

      // Check for both HTML attribute syntax (key=) and object property syntax (key:)
      if (!context.includes('key=') && !context.includes('key:')) {
        this.addViolation('MISSING_KEY_PROP', file, lineNumber, {
          code: match[0],
          message: 'Missing key prop in list rendering',
          severity: 'error',
          fix: 'Add unique key prop to mapped elements',
        });
      }
    }
  }

  /**
   * Check ARIA usage
   */
  checkAriaUsage(file, content) {
    // Basic ARIA checks
    const ariaPattern = /aria-\w+/g;
    const ariaUsage = (content.match(ariaPattern) || []).length;

    if (
      (ariaUsage === 0 && content.includes('<button')) ||
      content.includes('<input')
    ) {
      this.addWarning('LIMITED_ARIA_USAGE', file, 1, {
        message: 'Consider adding ARIA attributes for better accessibility',
        severity: 'info',
        fix: 'Add appropriate aria-label, aria-describedby, etc.',
      });
    }
  }

  /**
   * Check semantic HTML usage
   */
  checkSemanticHTML(file, content) {
    // Check for divs that could be semantic elements
    const divCount = (content.match(/<div/g) || []).length;
    const semanticCount = (
      content.match(/<(main|section|article|nav|header|footer)/g) || []
    ).length;

    if (divCount > 10 && semanticCount === 0) {
      this.addWarning('LIMITED_SEMANTIC_HTML', file, 1, {
        message: 'Consider using semantic HTML elements instead of divs',
        severity: 'info',
        fix: 'Use main, section, article, nav, header, footer where appropriate',
      });
    }
  }

  /**
   * Check form labels
   */
  checkFormLabels(file, content) {
    // Already covered in checkFormAccessibility
    this.checkFormAccessibility(file, content);
  }

  /**
   * Check naming conventions
   */
  checkNamingConventions(file, content) {
    // Check component naming (PascalCase)
    const componentPattern = /function\s+([a-z]\w+)/g;
    let match;

    while ((match = componentPattern.exec(content)) !== null) {
      const componentName = match[1];
      const lineNumber = this.getLineNumber(content, match[0]);

      this.addViolation('COMPONENT_NAMING', file, lineNumber, {
        code: match[0],
        message: `Component name should be PascalCase: ${componentName}`,
        severity: 'warning',
        fix: 'Use PascalCase for component names',
      });
    }
  }

  /**
   * Check component structure
   */
  checkComponentStructure(file, content) {
    // Check for proper component structure
    const lines = content.split('\n');

    if (lines.length > 100) {
      this.addWarning('LARGE_COMPONENT', file, 1, {
        message: `Component file has ${lines.length} lines - consider breaking it down`,
        severity: 'info',
        fix: 'Split into smaller, focused components',
      });
    }
  }

  /**
   * Check prop validation
   */
  checkPropValidation(file, content) {
    // Check for PropTypes or TypeScript interfaces
    if (
      content.includes('function ') &&
      !content.includes('PropTypes') &&
      !content.includes('interface ')
    ) {
      this.addWarning('MISSING_PROP_VALIDATION', file, 1, {
        message: 'Consider adding prop validation with PropTypes or TypeScript',
        severity: 'info',
        fix: 'Add PropTypes or TypeScript interface definitions',
      });
    }
  }

  /**
   * Check error boundaries
   */
  checkErrorBoundaries(file, content) {
    // Check for ErrorBoundary usage
    if (
      !content.includes('ErrorBoundary') &&
      !content.includes('componentDidCatch')
    ) {
      this.addWarning('MISSING_ERROR_BOUNDARY', file, 1, {
        message: 'Consider wrapping components with ErrorBoundary',
        severity: 'info',
        fix: 'Add ErrorBoundary components for better error handling',
      });
    }
  }

  /**
   * Check Suspense usage
   */
  checkSuspenseUsage(file, content) {
    // Check for proper Suspense usage with lazy loading
    if (content.includes('lazy(') && !content.includes('Suspense')) {
      const lineNumber = this.getLineNumber(content, 'lazy(');

      this.addViolation('LAZY_WITHOUT_SUSPENSE', file, lineNumber, {
        code: 'lazy()',
        message: 'Lazy-loaded components should be wrapped with Suspense',
        severity: 'error',
        fix: 'Wrap lazy components with <Suspense> boundary',
      });
    }
  }

  /**
   * Check error handling patterns
   */
  checkErrorHandlingPatterns(file, content) {
    this.checkErrorBoundaries(file, content);
    this.checkSuspenseUsage(file, content);
  }

  /**
   * Get element context around a match
   */
  getElementContext(content, searchString) {
    const index = content.indexOf(searchString);
    const start = Math.max(0, index - 200);
    const end = Math.min(content.length, index + 200);
    return content.substring(start, end);
  }

  /**
   * Utility methods
   */
  checkSideEffectsInRender(file, content) {
    const sideEffectPatterns = [
      /console\.(log|warn|error|info)/g,
      /Date\.now\(\)/g,
      /Math\.random\(\)/g,
      /localStorage\./g,
      /sessionStorage\./g,
      /fetch\(/g,
      /axios\./g,
      /document\./g,
      /window\./g,
    ];

    sideEffectPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        // Check if it's inside a useEffect or event handler
        const lines = content.split('\n');
        matches.forEach((match) => {
          const lineIndex = content.indexOf(match);
          const lineNumber = content.substring(0, lineIndex).split('\n').length;

          // Simple heuristic to check if it's in render
          const surroundingCode = lines
            .slice(Math.max(0, lineNumber - 5), lineNumber + 5)
            .join('\n');

          if (!this.isInSafeContext(surroundingCode)) {
            this.addViolation('SIDE_EFFECT_IN_RENDER', file, lineNumber, {
              code: match,
              message: `Potential side effect in render: ${match}`,
              severity: 'error',
              fix: 'Move side effect to useEffect or event handler',
            });
          }
        });
      }
    });
  }

  /**
   * Check for direct component mutations
   */
  checkDirectMutations(file, content) {
    const mutationPatterns = [
      /props\.\w+\s*=/g,
      /state\.\w+\s*=/g,
      /\w+\.push\(/g,
      /\w+\.pop\(/g,
      /\w+\.splice\(/g,
      /\w+\.sort\(/g,
      /\w+\.reverse\(/g,
    ];

    mutationPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);
          this.addViolation('DIRECT_MUTATION', file, lineNumber, {
            code: match,
            message: `Direct mutation detected: ${match}`,
            severity: 'error',
            fix: 'Use immutable update patterns (spread operator, map, filter, etc.)',
          });
        });
      }
    });
  }

  /**
   * Check for non-idempotent patterns
   */
  checkIdempotency(file, content) {
    const nonIdempotentPatterns = [
      /new Date\(\)/g,
      /Date\.now\(\)/g,
      /Math\.random\(\)/g,
      /performance\.now\(\)/g,
    ];

    nonIdempotentPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);
          if (!this.isInSafeContext(content, lineNumber)) {
            this.addViolation('NON_IDEMPOTENT', file, lineNumber, {
              code: match,
              message: `Non-idempotent value in render: ${match}`,
              severity: 'warning',
              fix: 'Move to useEffect or useMemo if needed',
            });
          }
        });
      }
    });
  }

  /**
   * Check for direct component function calls
   */
  checkDirectComponentCalls(file, content) {
    // Look for capitalized function calls that look like components
    const componentCallPattern =
      /(?:const|let|var)\s+\w+\s*=\s*([A-Z]\w+)\s*\(/g;

    let match;
    while ((match = componentCallPattern.exec(content)) !== null) {
      const componentName = match[1];
      const lineNumber = this.getLineNumber(content, match[0]);

      this.addViolation('DIRECT_COMPONENT_CALL', file, lineNumber, {
        code: match[0],
        message: `Direct component function call: ${componentName}()`,
        severity: 'error',
        fix: `Use JSX instead: <${componentName} />`,
      });
    }
  }

  /**
   * Check hook usage patterns
   */
  checkHookUsagePatterns(file, content) {
    // Check for hooks being passed around as values
    const hookPattern = /use[A-Z]\w*\(/g;
    let match;

    while ((match = hookPattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match[0]);

      // Basic check - can be expanded
      if (content.includes(`${match[0].slice(0, -1)} =`)) {
        this.addViolation('HOOK_AS_VALUE', file, lineNumber, {
          code: match[0],
          message: 'Hooks should not be passed around as regular values',
          severity: 'error',
          fix: 'Call hooks directly in components, not as parameters',
        });
      }
    }
  }

  /**
   * Check hooks only at top level
   */
  checkHookTopLevel(file, content) {
    const hookPattern = /use[A-Z]\w*\(/g;
    const lines = content.split('\n');

    let match;
    while ((match = hookPattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match[0]);
      const line = lines[lineNumber - 1];

      // Check if hook is inside if, loop, or nested function
      const indentLevel = line.search(/\S/);
      const surroundingLines = lines.slice(
        Math.max(0, lineNumber - 10),
        lineNumber
      );

      let inConditional = false;
      let inLoop = false;
      let inNestedFunction = false;

      for (let i = surroundingLines.length - 1; i >= 0; i--) {
        const checkLine = surroundingLines[i];
        const checkIndent = checkLine.search(/\S/);

        if (checkIndent < indentLevel) {
          if (/\b(if|else|switch|case)\b/.test(checkLine)) {
            inConditional = true;
          }
          if (/\b(for|while|do)\b/.test(checkLine)) {
            inLoop = true;
          }
          if (/function\s+\w+|=>\s*{|\(\)\s*=>/.test(checkLine)) {
            inNestedFunction = true;
          }
        }
      }

      if (inConditional || inLoop || inNestedFunction) {
        this.addViolation('HOOK_NOT_TOP_LEVEL', file, lineNumber, {
          code: match[0],
          message: `Hook called conditionally or in nested function: ${match[0]}`,
          severity: 'error',
          fix: 'Move hook to top level of component',
        });
      }
    }
  }

  /**
   * Utility methods
   */
  getReactFiles() {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.html'];
    const excludeDirs = ['node_modules', 'build', 'dist', '.git'];

    const files = [];

    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !excludeDirs.includes(item)) {
          scanDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext) || item.endsWith('.html')) {
            files.push(fullPath);
          }
        }
      }
    };

    scanDir(this.options.rootDir);
    return files;
  }

  getLineNumber(content, searchString) {
    const index = content.indexOf(searchString);
    if (index === -1) return 1;
    return content.substring(0, index).split('\n').length;
  }

  isInSafeContext(content) {
    // Check if code is inside useEffect, event handler, or other safe contexts
    const safeContexts = [
      /useEffect\(/,
      /useLayoutEffect\(/,
      /useCallback\(/,
      /useMemo\(/,
      /on[A-Z]\w+\s*=/,
      /addEventListener/,
      /setTimeout/,
      /setInterval/,
      // Module-level patterns (outside function context)
      /if\s*\(\s*typeof\s+window\s*!==\s*['"]undefined['"]\s*\)/,
      /module\.exports/,
      /export\s+(?:default\s+)?/,
    ];

    return safeContexts.some((pattern) => pattern.test(content));
  }

  addViolation(type, file, line, details) {
    this.violations.push({
      type,
      file: path.relative(this.options.rootDir, file),
      line,
      ...details,
    });
    this.stats.violationsFound++;
  }

  addWarning(type, file, line, details) {
    this.warnings.push({
      type,
      file: path.relative(this.options.rootDir, file),
      line,
      ...details,
    });
    this.stats.warningsFound++;
  }

  /**
   * Generate comprehensive audit report
   */
  generateReport() {
    console.log('\n📊 NIGHTINGALE REACT COMPLIANCE AUDIT REPORT');
    console.log('='.repeat(60));

    // Summary
    console.log('\n📈 Summary:');
    console.log(`Files Scanned: ${this.stats.filesScanned}`);
    console.log(`Components Analyzed: ${this.stats.componentsAnalyzed}`);
    console.log(`Violations Found: ${this.stats.violationsFound}`);
    console.log(`Warnings Found: ${this.stats.warningsFound}`);

    // Violations by category
    const violationsByType = {};
    this.violations.forEach((v) => {
      violationsByType[v.type] = (violationsByType[v.type] || 0) + 1;
    });

    if (Object.keys(violationsByType).length > 0) {
      console.log('\n❌ Violations by Type:');
      Object.entries(violationsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    // Detailed violations
    if (this.violations.length > 0) {
      console.log('\n🔍 Detailed Violations:');
      this.violations.forEach((violation, index) => {
        console.log(
          `\n${index + 1}. ${violation.type} - ${violation.severity.toUpperCase()}`
        );
        console.log(`   File: ${violation.file}:${violation.line}`);
        console.log(`   Issue: ${violation.message}`);
        console.log(`   Code: ${violation.code}`);
        console.log(`   Fix: ${violation.fix}`);
      });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (this.violations.length === 0) {
      console.log('✅ Great! No React rule violations found.');
    } else {
      console.log('1. Address critical violations first (errors)');
      console.log('2. Review warnings for potential improvements');
      console.log('3. Run with --fix flag to auto-fix simple issues');
      console.log('4. Consider adding ESLint rules for ongoing compliance');
    }

    // Score
    const totalIssues = this.violations.length + this.warnings.length;
    const score = Math.max(0, 100 - totalIssues * 5);

    console.log(`\n🏆 React Compliance Score: ${score}/100`);

    if (score >= 90) {
      console.log('🌟 Excellent! Your code follows React best practices.');
    } else if (score >= 70) {
      console.log('👍 Good compliance with some room for improvement.');
    } else if (score >= 50) {
      console.log('⚠️ Moderate compliance. Consider addressing key issues.');
    } else {
      console.log('🚨 Low compliance. Significant improvements needed.');
    }
  }

  /**
   * Apply automatic fixes where possible
   */
  async applyFixes() {
    console.log('\n🔧 Applying automatic fixes...');

    const fixableViolations = this.violations.filter((v) => v.autoFix);

    if (fixableViolations.length === 0) {
      console.log('No automatic fixes available.');
      return;
    }

    // Group fixes by file
    const fixesByFile = {};
    fixableViolations.forEach((violation) => {
      if (!fixesByFile[violation.file]) {
        fixesByFile[violation.file] = [];
      }
      fixesByFile[violation.file].push(violation);
    });

    // Apply fixes file by file
    for (const [file, fixes] of Object.entries(fixesByFile)) {
      try {
        let content = fs.readFileSync(
          path.join(this.options.rootDir, file),
          'utf8'
        );

        // Apply fixes in reverse order to preserve line numbers
        fixes.sort((a, b) => b.line - a.line);

        for (const fix of fixes) {
          content = this.applyFix(content, fix);
          this.stats.fixesApplied++;
        }

        fs.writeFileSync(path.join(this.options.rootDir, file), content);
        console.log(`✅ Fixed ${fixes.length} issues in ${file}`);
      } catch (error) {
        console.error(`❌ Failed to fix ${file}:`, error.message);
      }
    }

    console.log(`\n🎉 Applied ${this.stats.fixesApplied} automatic fixes!`);
  }

  applyFix(content, fix) {
    // Implement specific fix logic based on violation type
    switch (fix.type) {
      case 'DIRECT_COMPONENT_CALL':
        return this.fixDirectComponentCall(content, fix);
      case 'SIDE_EFFECT_IN_RENDER':
        return this.fixSideEffectInRender(content, fix);
      default:
        return content;
    }
  }

  fixDirectComponentCall(content, fix) {
    // Convert MyComponent() to <MyComponent />
    return content.replace(fix.code, fix.code.replace(/(\w+)\s*\(/, '<$1 />'));
  }

  fixSideEffectInRender(content, fix) {
    // Add comment suggesting to move to useEffect
    const lines = content.split('\n');
    const lineIndex = fix.line - 1;
    lines[lineIndex] =
      `  // TODO: Move to useEffect - ${lines[lineIndex].trim()}`;
    return lines.join('\n');
  }

  /**
   * Check hooks are only used in React functions
   */
  checkHookInReactFunctions(file, content) {
    // Check for hooks inside functions that aren't React components or custom hooks
    const hookPattern = /use[A-Z][a-zA-Z]*/g;
    const functionPattern =
      /function\s+([a-z][a-zA-Z]*)\s*\([^)]*\)\s*{[^}]*}/g;

    let functionMatch;
    while ((functionMatch = functionPattern.exec(content)) !== null) {
      const [fullMatch, functionName] = functionMatch;

      // Skip React components (start with capital) and custom hooks (start with 'use')
      if (
        functionName[0] === functionName[0].toUpperCase() ||
        functionName.startsWith('use')
      ) {
        continue;
      }

      const hookMatches = fullMatch.match(hookPattern);
      if (hookMatches) {
        const lineNumber = this.getLineNumber(content, fullMatch);
        this.addViolation('HOOKS_IN_REGULAR_FUNCTION', file, lineNumber, {
          code: functionName,
          message: `Hooks found in regular function '${functionName}'. Hooks should only be called in React function components or custom hooks.`,
          severity: 'error',
          fix: 'Move hooks to React component or create a custom hook',
        });
      }
    }
  }

  /**
   * Check custom hook naming convention
   */
  checkCustomHookNaming(file, content) {
    // Find function declarations that use hooks but don't start with 'use'
    const functionPattern =
      /(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=\s*(?:function|\([^)]*\)\s*=>)|(?:\([^)]*\)\s*{))/g;
    const hookPattern = /use[A-Z][a-zA-Z]*/;

    let functionMatch;
    while ((functionMatch = functionPattern.exec(content)) !== null) {
      const [, functionName] = functionMatch;

      // Skip if already follows convention
      if (
        functionName.startsWith('use') &&
        functionName[3] &&
        functionName[3] === functionName[3].toUpperCase()
      ) {
        continue;
      }

      // Check if this function uses hooks
      const functionStart = functionMatch.index;
      const functionBody = this.extractFunctionBody(content, functionStart);

      if (hookPattern.test(functionBody)) {
        const lineNumber = this.getLineNumber(content, functionMatch[0]);
        this.addViolation('CUSTOM_HOOK_NAMING', file, lineNumber, {
          code: functionName,
          message: `Function '${functionName}' uses hooks but doesn't follow naming convention. Custom hooks should start with 'use' followed by a capital letter.`,
          severity: 'warning',
          fix: `Rename to 'use${functionName.charAt(0).toUpperCase()}${functionName.slice(1)}'`,
        });
      }
    }
  }

  /**
   * Helper to extract function body
   */
  extractFunctionBody(content, startIndex) {
    let braceCount = 0;
    let inFunction = false;
    let body = '';

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];

      if (char === '{') {
        inFunction = true;
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }

      if (inFunction) {
        body += char;
      }

      if (inFunction && braceCount === 0) {
        break;
      }
    }

    return body;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const options = {
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose'),
    component: args
      .find((arg) => arg.startsWith('--component='))
      ?.split('=')[1],
  };

  const auditor = new ReactComplianceAuditor(options);
  auditor.runAudit().catch((error) => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = ReactComplianceAuditor;
