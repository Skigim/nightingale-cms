/**
 * React DOM API Compliance Checker
 *
 * Specialized tool to audit React DOM specific patterns and modern API usage
 * Focuses on React 18+ patterns, createRoot, portals, and form status
 */

const fs = require('fs');
const path = require('path');

class ReactDOMComplianceChecker {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.violations = [];
    this.recommendations = [];
  }

  async checkCompliance() {
    console.log('🌐 React DOM API Compliance Check Starting...\n');

    const files = this.getReactFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');

      // Core React DOM API checks
      this.checkLegacyRenderAPI(file, content);
      this.checkPortalUsage(file, content);
      this.checkFormStatusUsage(file, content);
      this.checkFlushSyncUsage(file, content);
      this.checkPreloadingAPIs(file, content);

      // Component naming and attributes
      this.checkReactSpecificAttributes(file, content);
      this.checkCustomElements(file, content);
      this.checkResourceComponents(file, content);
    }

    this.generateReport();
  }

  /**
   * Check for legacy ReactDOM.render usage
   */
  checkLegacyRenderAPI(file, content) {
    const legacyPatterns = [
      /ReactDOM\.render\s*\(/g,
      /ReactDOM\.hydrate\s*\(/g,
      /ReactDOM\.unmountComponentAtNode\s*\(/g,
    ];

    legacyPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);
          this.addViolation('LEGACY_RENDER_API', file, lineNumber, {
            code: match,
            message: `Legacy React DOM API usage: ${match}`,
            severity: 'error',
            modernAlternative: this.getLegacyAlternative(match),
            autoFix: true,
          });
        });
      }
    });
  }

  /**
   * Check portal usage patterns
   */
  checkPortalUsage(file, content) {
    if (content.includes('createPortal')) {
      // Check for proper portal patterns
      const portalRegex = /createPortal\s*\((.*?)\)/gs;
      let match;

      while ((match = portalRegex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match[0]);
        const portalContent = match[1];

        // Check if portal target is properly specified
        if (!portalContent.includes('document.')) {
          this.addRecommendation('PORTAL_TARGET', file, lineNumber, {
            message:
              'Consider using document.getElementById() for portal target',
            example:
              'createPortal(children, document.getElementById("modal-root"))',
          });
        }

        // Check for modal-specific patterns
        if (this.isModalComponent(file, content)) {
          if (!content.includes('isOpen') && !content.includes('open')) {
            this.addRecommendation('MODAL_CONTROL', file, lineNumber, {
              message: 'Modal should have open/close control prop',
              example: 'function Modal({ isOpen, onClose, children }) { ... }',
            });
          }
        }
      }
    }

    // Check for modals that should use portals
    if (
      this.isModalComponent(file, content) &&
      !content.includes('createPortal')
    ) {
      this.addRecommendation('MODAL_PORTAL', file, 1, {
        message:
          'Modal components should use createPortal for proper rendering',
        example:
          'return createPortal(<div className="modal">{children}</div>, document.body)',
      });
    }
  }

  /**
   * Check useFormStatus usage patterns
   */
  checkFormStatusUsage(file, content) {
    if (content.includes('useFormStatus')) {
      const formStatusUsage = content.match(/useFormStatus\s*\(\s*\)/g);

      if (formStatusUsage) {
        formStatusUsage.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);

          // Check if it's in the same component as a form
          if (
            content.includes('<form') &&
            this.isInSameComponent(content, lineNumber, '<form')
          ) {
            this.addViolation('FORM_STATUS_SAME_COMPONENT', file, lineNumber, {
              code: match,
              message:
                'useFormStatus cannot be used in same component that renders the form',
              severity: 'error',
              fix: 'Move useFormStatus to a child component inside the form',
            });
          }

          // Check for proper destructuring
          const destructurePattern =
            /const\s*\{\s*pending(?:,\s*data|,\s*method|,\s*action)?\s*\}\s*=\s*useFormStatus/;
          if (!destructurePattern.test(content)) {
            this.addRecommendation(
              'FORM_STATUS_DESTRUCTURE',
              file,
              lineNumber,
              {
                message: 'Consider destructuring useFormStatus return values',
                example:
                  'const { pending, data, method, action } = useFormStatus();',
              }
            );
          }
        });
      }
    }

    // Check for forms that could benefit from useFormStatus
    const formElements = content.match(/<form[\s\S]*?<\/form>/g);
    if (formElements && !content.includes('useFormStatus')) {
      formElements.forEach((form) => {
        if (form.includes('onSubmit') && form.includes('button')) {
          const lineNumber = this.getLineNumber(content, form);
          this.addRecommendation('FORM_STATUS_OPPORTUNITY', file, lineNumber, {
            message: 'Consider using useFormStatus for better form UX',
            example: 'Add pending state to submit button',
          });
        }
      });
    }
  }

  /**
   * Check flushSync usage (should be rare)
   */
  checkFlushSyncUsage(file, content) {
    if (content.includes('flushSync')) {
      const flushSyncUsage = content.match(/flushSync\s*\(/g);

      if (flushSyncUsage) {
        flushSyncUsage.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);
          this.addViolation('FLUSH_SYNC_USAGE', file, lineNumber, {
            code: match,
            message:
              'flushSync should be used sparingly - forces synchronous updates',
            severity: 'warning',
            fix: 'Consider if concurrent updates would work instead',
          });
        });
      }
    }
  }

  /**
   * Check for resource preloading opportunities
   */
  checkPreloadingAPIs(file, content) {
    // Look for large imports or resources that could be preloaded
    const heavyResourcePatterns = [
      /import.*\.css/g,
      /import.*\/lib\//g,
      /src\s*=\s*["'][^"']*\.(js|css|woff|woff2|ttf)["']/g,
    ];

    heavyResourcePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (
        matches &&
        !content.includes('preload') &&
        !content.includes('preinit')
      ) {
        this.addRecommendation('PRELOADING_OPPORTUNITY', file, 1, {
          message:
            'Consider using React DOM preloading APIs for better performance',
          example:
            'preload("/fonts/icons.woff2", { as: "font", type: "font/woff2" })',
        });
      }
    });
  }

  /**
   * Check React-specific HTML attributes
   */
  checkReactSpecificAttributes(file, content) {
    const incorrectAttributes = [
      { wrong: 'class=', correct: 'className=' },
      { wrong: 'for=', correct: 'htmlFor=' },
      { wrong: 'tabindex=', correct: 'tabIndex=' },
      { wrong: 'readonly=', correct: 'readOnly=' },
      { wrong: 'maxlength=', correct: 'maxLength=' },
      { wrong: 'cellpadding=', correct: 'cellPadding=' },
      { wrong: 'cellspacing=', correct: 'cellSpacing=' },
      { wrong: 'rowspan=', correct: 'rowSpan=' },
      { wrong: 'colspan=', correct: 'colSpan=' },
      { wrong: 'usemap=', correct: 'useMap=' },
    ];

    incorrectAttributes.forEach(({ wrong, correct }) => {
      const regex = new RegExp(wrong, 'g');
      const matches = content.match(regex);

      if (matches) {
        matches.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);
          this.addViolation('INCORRECT_ATTRIBUTE_NAMING', file, lineNumber, {
            code: match,
            message: `Use React naming: ${wrong} should be ${correct}`,
            severity: 'error',
            fix: `Change ${wrong} to ${correct}`,
            autoFix: true,
          });
        });
      }
    });
  }

  /**
   * Check custom elements usage
   */
  checkCustomElements(file, content) {
    // Look for custom elements (hyphenated tag names)
    const customElementPattern = /<([a-z]+-[a-z-]+)[\s>]/g;
    let match;

    while ((match = customElementPattern.exec(content)) !== null) {
      const tagName = match[1];
      const lineNumber = this.getLineNumber(content, match[0]);

      // Check if it's using React naming when it should use HTML naming
      const elementContent = this.getElementContent(content, match.index);
      if (
        elementContent.includes('className=') ||
        elementContent.includes('htmlFor=')
      ) {
        this.addViolation('CUSTOM_ELEMENT_REACT_ATTRS', file, lineNumber, {
          code: `<${tagName}`,
          message: `Custom elements should use HTML attributes (class, for) not React attributes (className, htmlFor)`,
          severity: 'warning',
          fix: 'Use HTML attribute names for custom elements',
        });
      }
    }
  }

  /**
   * Check resource and metadata components
   */
  checkResourceComponents(file, content) {
    const resourceComponents = ['link', 'meta', 'script', 'style', 'title'];

    resourceComponents.forEach((component) => {
      const regex = new RegExp(`<${component}[^>]*>`, 'g');
      const matches = content.match(regex);

      if (matches) {
        matches.forEach((match) => {
          const lineNumber = this.getLineNumber(content, match);

          // Check if it's in the document head context
          if (!this.isInDocumentHead(content, lineNumber)) {
            this.addRecommendation(
              'RESOURCE_COMPONENT_PLACEMENT',
              file,
              lineNumber,
              {
                message: `${component} component can be rendered anywhere - React will hoist to document head`,
                example: `<${component}> can be used in any component`,
              }
            );
          }
        });
      }
    });
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

    scanDir(this.rootDir);
    return files;
  }

  getLineNumber(content, searchString) {
    const index = content.indexOf(searchString);
    if (index === -1) return 1;
    return content.substring(0, index).split('\n').length;
  }

  isModalComponent(file, content) {
    const fileName = path.basename(file).toLowerCase();
    return (
      fileName.includes('modal') ||
      content.includes('Modal') ||
      content.includes('overlay') ||
      content.includes('dialog')
    );
  }

  isInSameComponent(content, lineNumber, searchPattern) {
    // Simple heuristic to check if useFormStatus and form are in same component
    const lines = content.split('\n');
    const functionStart = this.findFunctionStart(lines, lineNumber);
    const functionEnd = this.findFunctionEnd(lines, lineNumber);

    const functionContent = lines.slice(functionStart, functionEnd).join('\n');
    return functionContent.includes(searchPattern);
  }

  findFunctionStart(lines, lineNumber) {
    for (let i = lineNumber - 1; i >= 0; i--) {
      if (
        lines[i].includes('function ') ||
        (lines[i].includes('const ') && lines[i].includes('=>'))
      ) {
        return i;
      }
    }
    return 0;
  }

  findFunctionEnd(lines, lineNumber) {
    let braceCount = 0;
    for (let i = lineNumber; i < lines.length; i++) {
      const line = lines[i];
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (braceCount === 0 && line.includes('}')) {
        return i;
      }
    }
    return lines.length;
  }

  isInDocumentHead(content, lineNumber) {
    // Check if the component is likely to be in document head context
    const lines = content.split('\n');
    const surroundingCode = lines
      .slice(Math.max(0, lineNumber - 10), lineNumber + 10)
      .join('\n');

    return (
      surroundingCode.includes('head') ||
      surroundingCode.includes('Head') ||
      surroundingCode.includes('Helmet')
    );
  }

  getElementContent(content, startIndex) {
    let braceCount = 0;
    let endIndex = startIndex;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '<') braceCount++;
      if (content[i] === '>') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    return content.substring(startIndex, endIndex + 1);
  }

  getLegacyAlternative(legacyCode) {
    const alternatives = {
      'ReactDOM.render': 'createRoot().render()',
      'ReactDOM.hydrate': 'hydrateRoot()',
      'ReactDOM.unmountComponentAtNode': 'root.unmount()',
    };

    for (const [legacy, modern] of Object.entries(alternatives)) {
      if (legacyCode.includes(legacy)) {
        return modern;
      }
    }
    return 'Use modern React 18+ API';
  }

  addViolation(type, file, line, details) {
    this.violations.push({
      type,
      file: path.relative(this.rootDir, file),
      line,
      ...details,
    });
  }

  addRecommendation(type, file, line, details) {
    this.recommendations.push({
      type,
      file: path.relative(this.rootDir, file),
      line,
      ...details,
    });
  }

  generateReport() {
    console.log('\n📊 REACT DOM API COMPLIANCE REPORT');
    console.log('='.repeat(50));

    // Violations
    if (this.violations.length > 0) {
      console.log('\n❌ React DOM API Violations:');
      this.violations.forEach((violation, index) => {
        console.log(
          `\n${index + 1}. ${violation.type} - ${violation.severity.toUpperCase()}`
        );
        console.log(`   File: ${violation.file}:${violation.line}`);
        console.log(`   Issue: ${violation.message}`);
        if (violation.modernAlternative) {
          console.log(`   Modern Alternative: ${violation.modernAlternative}`);
        }
        if (violation.fix) {
          console.log(`   Fix: ${violation.fix}`);
        }
      });
    } else {
      console.log('\n✅ No React DOM API violations found!');
    }

    // Recommendations
    if (this.recommendations.length > 0) {
      console.log('\n💡 React DOM Recommendations:');
      this.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. ${rec.type}`);
        console.log(`   File: ${rec.file}:${rec.line}`);
        console.log(`   Suggestion: ${rec.message}`);
        if (rec.example) {
          console.log(`   Example: ${rec.example}`);
        }
      });
    }

    // Summary
    const score = Math.max(
      0,
      100 - this.violations.length * 10 - this.recommendations.length * 2
    );
    console.log(`\n🏆 React DOM Compliance Score: ${score}/100`);

    if (this.violations.length === 0) {
      console.log('🌟 Excellent React DOM API usage!');
    } else {
      console.log(
        '🔧 Consider addressing violations for better React 18+ compatibility.'
      );
    }
  }
}

module.exports = ReactDOMComplianceChecker;

// CLI usage
if (require.main === module) {
  const checker = new ReactDOMComplianceChecker(process.cwd());
  checker.checkCompliance();
}
