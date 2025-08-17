/**
 * React Performance Audit Tool
 *
 * Analyzes React components for performance anti-patterns and optimization opportunities
 * Focuses on useMemo, useCallback, React.memo, and rendering optimization
 */

const fs = require('fs');
const path = require('path');

class ReactPerformanceAuditor {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.issues = [];
    this.optimizations = [];
    this.stats = {
      componentsScanned: 0,
      hooksAnalyzed: 0,
      memoUsage: 0,
      callbackUsage: 0,
      memoComponentsFound: 0,
    };
  }

  async auditPerformance() {
    // eslint-disable-next-line no-console
    console.log('⚡ React Performance Audit Starting...\n');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      this.stats.componentsScanned++;

      // Core performance checks
      this.checkUnnecessaryUseMemo(file, content);
      this.checkUnnecessaryUseCallback(file, content);
      this.checkMissingReactMemo(file, content);
      this.checkExpensiveRenderCalculations(file, content);
      this.checkKeyPropUsage(file, content);
      this.checkInlineObjectCreation(file, content);
      this.checkAnonymousFunctionProps(file, content);
      this.checkLargeComponentTrees(file, content);
      this.checkConditionalHooks(file, content);
      this.checkUseEffectOptimizations(file, content);
    }

    this.generatePerformanceReport();
  }

  /**
   * Check for unnecessary useMemo usage
   */
  checkUnnecessaryUseMemo(file, content) {
    const useMemoPattern =
      /useMemo\s*\(\s*\(\)\s*=>\s*([^,]+),\s*\[([^\]]*)\]\s*\)/g;
    let match;

    while ((match = useMemoPattern.exec(content)) !== null) {
      this.stats.memoUsage++;
      const calculation = match[1].trim();
      const deps = match[2].trim();
      const lineNumber = this.getLineNumber(content, match[0]);

      // Check for simple calculations that don't need memoization
      if (this.isSimpleCalculation(calculation)) {
        this.addIssue('UNNECESSARY_USE_MEMO', file, lineNumber, {
          code: match[0],
          message: `Unnecessary useMemo for simple calculation: ${calculation}`,
          severity: 'warning',
          fix: 'Remove useMemo for simple calculations like string concatenation or basic arithmetic',
        });
      }

      // Check for primitive values
      if (this.isPrimitiveValue(calculation)) {
        this.addIssue('MEMO_PRIMITIVE_VALUE', file, lineNumber, {
          code: match[0],
          message: `useMemo used for primitive value: ${calculation}`,
          severity: 'warning',
          fix: "Primitive values don't need memoization",
        });
      }

      // Check for missing dependencies
      if (this.hasMissingDependencies(calculation, deps)) {
        this.addIssue('MEMO_MISSING_DEPS', file, lineNumber, {
          code: match[0],
          message: 'Potential missing dependencies in useMemo',
          severity: 'error',
          fix: 'Add all referenced variables to dependency array',
        });
      }
    }
  }

  /**
   * Check for unnecessary useCallback usage
   */
  checkUnnecessaryUseCallback(file, content) {
    const useCallbackPattern =
      /useCallback\s*\(\s*(.*?),\s*\[([^\]]*)\]\s*\)/gs;
    let match;

    while ((match = useCallbackPattern.exec(content)) !== null) {
      this.stats.callbackUsage++;
      const functionBody = match[1];
      const deps = match[2].trim();
      const lineNumber = this.getLineNumber(content, match[0]);

      // Check if callback is passed to non-memoized component
      if (!this.isCallbackNeeded(content, match[0], lineNumber)) {
        this.addIssue('UNNECESSARY_USE_CALLBACK', file, lineNumber, {
          code: match[0].substring(0, 100) + '...',
          message: 'useCallback used but may not be necessary',
          severity: 'info',
          fix: 'Only use useCallback when passing to memoized components or as dependency',
        });
      }

      // Check for missing dependencies
      if (this.hasMissingDependencies(functionBody, deps)) {
        this.addIssue('CALLBACK_MISSING_DEPS', file, lineNumber, {
          code: match[0].substring(0, 100) + '...',
          message: 'Potential missing dependencies in useCallback',
          severity: 'error',
          fix: 'Add all referenced variables to dependency array',
        });
      }
    }
  }

  /**
   * Check for missing React.memo opportunities
   */
  checkMissingReactMemo(file, content) {
    // Find function components that could benefit from React.memo
    const componentPattern =
      /(?:function\s+([A-Z]\w+)|const\s+([A-Z]\w+)\s*=.*?(?:function|\())/g;
    let match;

    while ((match = componentPattern.exec(content)) !== null) {
      const componentName = match[1] || match[2];
      const lineNumber = this.getLineNumber(content, match[0]);

      // Check if component is wrapped with memo
      if (!content.includes(`memo(${componentName})`)) {
        // Check if component receives complex props
        if (this.hasComplexProps(content, componentName)) {
          this.addOptimization('REACT_MEMO_OPPORTUNITY', file, lineNumber, {
            component: componentName,
            message: `Consider wrapping ${componentName} with React.memo`,
            reason:
              'Component receives complex props and may re-render unnecessarily',
            example: `export default memo(${componentName});`,
          });
        }
      } else {
        this.stats.memoComponentsFound++;
      }
    }
  }

  /**
   * Check for expensive calculations in render
   */
  checkExpensiveRenderCalculations(file, content) {
    const expensivePatterns = [
      {
        pattern: /\.filter\(.*?\.map\(/g,
        message: 'Chained filter and map operations',
      },
      { pattern: /\.sort\(/g, message: 'Array sorting in render' },
      { pattern: /JSON\.parse\(/g, message: 'JSON parsing in render' },
      {
        pattern: /JSON\.stringify\(/g,
        message: 'JSON stringification in render',
      },
      { pattern: /new Date\(/g, message: 'Date object creation in render' },
      {
        pattern: /\.reduce\(.*?\.reduce\(/g,
        message: 'Nested reduce operations',
      },
    ];

    expensivePatterns.forEach(({ pattern, message }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match[0]);

        // Check if it's inside a useMemo
        if (!this.isInsideMemo(content, lineNumber)) {
          this.addIssue('EXPENSIVE_RENDER_CALCULATION', file, lineNumber, {
            code: match[0],
            message: `${message} - consider memoizing`,
            severity: 'warning',
            fix: 'Wrap expensive calculations in useMemo',
          });
        }
      }
    });
  }

  /**
   * Check for proper key prop usage in lists
   */
  checkKeyPropUsage(file, content) {
    // Look for map functions in JSX
    const mapPattern = /\.map\s*\(\s*\([^)]*\)\s*=>/g;
    let match;

    while ((match = mapPattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match[0]);
      const mapContext = this.getMapContext(content, match.index);

      // Check if key prop is present
      if (!mapContext.includes('key=')) {
        this.addIssue('MISSING_KEY_PROP', file, lineNumber, {
          code: match[0],
          message: 'Missing key prop in list rendering',
          severity: 'error',
          fix: 'Add unique key prop to list items',
        });
      }

      // Check for array index as key
      if (
        mapContext.includes('key={index}') ||
        mapContext.includes('key={i}')
      ) {
        this.addIssue('INDEX_AS_KEY', file, lineNumber, {
          code: 'key={index}',
          message: 'Using array index as key can cause performance issues',
          severity: 'warning',
          fix: 'Use stable, unique identifier as key',
        });
      }
    }
  }

  /**
   * Check for inline object creation in props
   */
  checkInlineObjectCreation(file, content) {
    const inlineObjectPatterns = [
      /\w+\s*=\s*\{\{[^}]+\}\}/g, // style={{}}
      /\w+\s*=\s*\{[^}]*:\s*[^}]*\}/g, // prop={{key: value}}
    ];

    inlineObjectPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match[0]);

        this.addIssue('INLINE_OBJECT_CREATION', file, lineNumber, {
          code: match[0],
          message:
            'Inline object creation causes new reference on every render',
          severity: 'warning',
          fix: 'Move object creation outside render or use useMemo',
        });
      }
    });
  }

  /**
   * Check for anonymous function props
   */
  checkAnonymousFunctionProps(file, content) {
    const anonFunctionPattern = /\w+\s*=\s*\{[^}]*=>/g;
    let match;

    while ((match = anonFunctionPattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match[0]);

      this.addIssue('ANONYMOUS_FUNCTION_PROP', file, lineNumber, {
        code: match[0],
        message:
          'Anonymous function in props creates new reference on every render',
        severity: 'warning',
        fix: 'Use useCallback or define function outside render',
      });
    }
  }

  /**
   * Check for large component trees
   */
  checkLargeComponentTrees(file, content) {
    const jsxElements = content.match(/<[A-Z]\w*[^>]*>/g);

    if (jsxElements && jsxElements.length > 20) {
      this.addOptimization('LARGE_COMPONENT_TREE', file, 1, {
        message: `Component renders ${jsxElements.length} JSX elements`,
        reason: 'Large component trees can cause performance issues',
        suggestion: 'Consider breaking into smaller components',
      });
    }
  }

  /**
   * Check for conditional hooks (performance issue)
   */
  checkConditionalHooks(file, content) {
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('use') && /use[A-Z]/.test(line)) {
        const indent = line.search(/\S/);

        // Check if hook is inside conditional block
        for (let i = index - 1; i >= 0; i--) {
          const prevLine = lines[i];
          const prevIndent = prevLine.search(/\S/);

          if (
            prevIndent < indent &&
            /\b(if|else|switch|case)\b/.test(prevLine)
          ) {
            this.addIssue('CONDITIONAL_HOOK', file, index + 1, {
              code: line.trim(),
              message: 'Hook called conditionally',
              severity: 'error',
              fix: 'Move hook to top level or use conditional logic inside hook',
            });
            break;
          }
        }
      }
    });
  }

  /**
   * Check useEffect optimizations
   */
  checkUseEffectOptimizations(file, content) {
    const useEffectPattern =
      /useEffect\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[([^\]]*)\]\s*\)/g;
    let match;

    while ((match = useEffectPattern.exec(content)) !== null) {
      const effectBody = match[1];
      const deps = match[2].trim();
      const lineNumber = this.getLineNumber(content, match[0]);

      // Check for missing cleanup
      if (this.needsCleanup(effectBody) && !effectBody.includes('return')) {
        this.addIssue('MISSING_EFFECT_CLEANUP', file, lineNumber, {
          code: 'useEffect',
          message: 'Effect may need cleanup function',
          severity: 'warning',
          fix: 'Return cleanup function from useEffect',
        });
      }

      // Check for empty dependency array with non-stable values
      if (deps === '' && this.hasNonStableReferences(effectBody)) {
        this.addIssue('EMPTY_DEPS_WITH_REFERENCES', file, lineNumber, {
          code: 'useEffect(..., [])',
          message:
            'Empty dependency array but effect references changing values',
          severity: 'warning',
          fix: 'Add dependencies or ensure values are stable',
        });
      }
    }
  }

  /**
   * Utility methods
   */
  isSimpleCalculation(calculation) {
    const simplePatterns = [
      /^\w+\s*\+\s*\w+$/, // a + b
      /^\w+\s*\?\s*\w+\s*:\s*\w+$/, // a ? b : c
      /^`[^`]*`$/, // template literal
      /^\w+\.\w+$/, // object.property
    ];

    return simplePatterns.some((pattern) => pattern.test(calculation.trim()));
  }

  isPrimitiveValue(calculation) {
    const primitivePatterns = [
      /^(true|false|null|undefined)$/,
      /^[\d.]+$/,
      /^["'].*["']$/,
    ];

    return primitivePatterns.some((pattern) =>
      pattern.test(calculation.trim())
    );
  }

  hasMissingDependencies(code, deps) {
    // Simple heuristic - look for variables that might be dependencies
    const variablePattern = /\b[a-zA-Z_$]\w*\b/g;
    const variables = code.match(variablePattern) || [];
    const depList = deps
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    // Check if commonly referenced variables are in deps
    const commonlyReferencedVars = variables.filter(
      (v) =>
        ![
          'true',
          'false',
          'null',
          'undefined',
          'console',
          'document',
          'window',
        ].includes(v)
    );

    return commonlyReferencedVars.some((v) => !depList.includes(v));
  }

  isCallbackNeeded(content, callbackCode) {
    // Check if callback is passed to memoized component or used as dependency
    const callbackVar = this.extractCallbackVariableName(callbackCode);
    if (!callbackVar) return false;

    const usagePattern = new RegExp(`\\b${callbackVar}\\b`, 'g');
    const usages = content.match(usagePattern) || [];

    return usages.length > 1; // Used more than just definition
  }

  extractCallbackVariableName(callbackCode) {
    const match = callbackCode.match(/const\s+(\w+)\s*=\s*useCallback/);
    return match ? match[1] : null;
  }

  hasComplexProps(content, componentName) {
    // Look for component usage with object props or many props
    const usagePattern = new RegExp(`<${componentName}[^>]*>`, 'g');
    const usages = content.match(usagePattern) || [];

    return usages.some((usage) => {
      const propCount = (usage.match(/\w+=/g) || []).length;
      return propCount > 3 || usage.includes('={{') || usage.includes('={[');
    });
  }

  isInsideMemo(content, lineNumber) {
    const lines = content.split('\n');

    // Look backwards for useMemo
    for (let i = lineNumber - 1; i >= 0; i--) {
      if (lines[i].includes('useMemo')) {
        // Look forward for closing of useMemo
        for (let j = i; j < Math.min(lines.length, lineNumber + 10); j++) {
          if (lines[j].includes('}, [') || lines[j].includes('},[')) {
            return j > lineNumber;
          }
        }
      }
    }

    return false;
  }

  getMapContext(content, startIndex) {
    // Get the JSX context around the map function
    let endIndex = startIndex;
    let braceCount = 0;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    return content.substring(startIndex, endIndex + 100); // Get a bit more context
  }

  needsCleanup(effectBody) {
    const cleanupPatterns = [
      /addEventListener/,
      /setTimeout/,
      /setInterval/,
      /subscribe/,
      /WebSocket/,
      /EventSource/,
    ];

    return cleanupPatterns.some((pattern) => pattern.test(effectBody));
  }

  hasNonStableReferences(effectBody) {
    const nonStablePatterns = [/\bprops\./, /\bstate\./, /\b[a-z]\w*\(/];

    return nonStablePatterns.some((pattern) => pattern.test(effectBody));
  }

  getReactFiles() {
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    const excludeDirs = ['node_modules', 'build', 'dist', '.git'];

    const files = [];

    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !excludeDirs.includes(item)) {
            scanDir(fullPath);
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    scanDir(this.rootDir);
    return files;
  }

  getLineNumber(content, searchString) {
    const index = content.indexOf(searchString);
    if (index === -1) return 1;
    return content.substring(0, index).split('\n').length;
  }

  addIssue(type, file, line, details) {
    this.issues.push({
      type,
      file: path.relative(this.rootDir, file),
      line,
      ...details,
    });
  }

  addOptimization(type, file, line, details) {
    this.optimizations.push({
      type,
      file: path.relative(this.rootDir, file),
      line,
      ...details,
    });
  }

  generatePerformanceReport() {
    // eslint-disable-next-line no-console
    console.log('\n📊 REACT PERFORMANCE AUDIT REPORT');
    // eslint-disable-next-line no-console
    console.log('='.repeat(50));

    // Statistics
    // eslint-disable-next-line no-console
    console.log('\n📈 Performance Statistics:');
    // eslint-disable-next-line no-console
    console.log(`Components Scanned: ${this.stats.componentsScanned}`);
    // eslint-disable-next-line no-console
    console.log(`useMemo Usage: ${this.stats.memoUsage}`);
    // eslint-disable-next-line no-console
    console.log(`useCallback Usage: ${this.stats.callbackUsage}`);
    // eslint-disable-next-line no-console
    console.log(`React.memo Components: ${this.stats.memoComponentsFound}`);

    // Performance Issues
    if (this.issues.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n⚠️ Performance Issues:');
      this.issues.forEach((issue, index) => {
        // eslint-disable-next-line no-console
        console.log(
          `\n${index + 1}. ${issue.type} - ${issue.severity.toUpperCase()}`
        );
        // eslint-disable-next-line no-console
        console.log(`   File: ${issue.file}:${issue.line}`);
        // eslint-disable-next-line no-console
        console.log(`   Issue: ${issue.message}`);
        // eslint-disable-next-line no-console
        console.log(`   Fix: ${issue.fix}`);
      });
    }

    // Optimization Opportunities
    if (this.optimizations.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\n💡 Optimization Opportunities:');
      this.optimizations.forEach((opt, index) => {
        // eslint-disable-next-line no-console
        console.log(`\n${index + 1}. ${opt.type}`);
        // eslint-disable-next-line no-console
        console.log(`   File: ${opt.file}:${opt.line}`);
        // eslint-disable-next-line no-console
        console.log(`   Opportunity: ${opt.message}`);
        if (opt.example) {
          // eslint-disable-next-line no-console
          console.log(`   Example: ${opt.example}`);
        }
      });
    }

    // Performance Score
    const totalIssues = this.issues.length;
    const criticalIssues = this.issues.filter(
      (i) => i.severity === 'error'
    ).length;
    const score = Math.max(0, 100 - criticalIssues * 15 - totalIssues * 5);

    // eslint-disable-next-line no-console
    console.log(`\n🏆 Performance Score: ${score}/100`);

    if (score >= 90) {
      // eslint-disable-next-line no-console
      console.log(
        '🚀 Excellent performance! Your React code is well optimized.'
      );
    } else if (score >= 70) {
      // eslint-disable-next-line no-console
      console.log('👍 Good performance with room for improvement.');
    } else if (score >= 50) {
      // eslint-disable-next-line no-console
      console.log('⚠️ Moderate performance. Consider addressing key issues.');
    } else {
      // eslint-disable-next-line no-console
      console.log(
        '🚨 Performance improvements needed. Focus on critical issues first.'
      );
    }
  }
}

module.exports = ReactPerformanceAuditor;

// CLI usage
if (require.main === module) {
  const auditor = new ReactPerformanceAuditor(process.cwd());
  auditor.auditPerformance();
}
