#!/usr/bin/env node

/**
 * Nightingale React Compliance Test Suite
 *
 * Comprehensive test runner that executes all React compliance audits
 * and generates a unified compliance report
 */

const ReactComplianceAuditor = require('./react-compliance-audit');
const ReactDOMComplianceChecker = require('./react-dom-compliance');
const ReactPerformanceAuditor = require('./react-performance-audit');
const fs = require('fs');
const path = require('path');

class NightingaleComplianceTestSuite {
  constructor(options = {}) {
    this.options = {
      rootDir: options.rootDir || process.cwd(),
      outputFile: options.outputFile || 'compliance-report.json',
      verbose: options.verbose || false,
      fix: options.fix || false,
      ...options,
    };

    this.results = {
      timestamp: new Date().toISOString(),
      overall: {
        score: 0,
        grade: 'F',
        status: 'FAIL',
      },
      audits: {},
      summary: {
        totalFiles: 0,
        totalComponents: 0,
        totalViolations: 0,
        totalWarnings: 0,
        totalOptimizations: 0,
      },
      recommendations: [],
    };
  }

  async runFullCompliance() {
    console.log('🏥 NIGHTINGALE CMS REACT COMPLIANCE AUDIT SUITE');
    console.log('='.repeat(60));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`📂 Root Directory: ${this.options.rootDir}`);
    console.log('');

    try {
      // 1. Core React Rules Compliance
      await this.runCoreReactAudit();

      // 2. React DOM API Compliance
      await this.runReactDOMAudit();

      // 3. Performance Audit
      await this.runPerformanceAudit();

      // 4. Architecture Analysis
      await this.runArchitectureAnalysis();

      // 5. Generate Final Report
      this.calculateOverallScore();
      this.generateUnifiedReport();
      this.saveResults();

      // 6. Apply fixes if requested
      if (this.options.fix) {
        await this.applyAutomaticFixes();
      }
    } catch (error) {
      console.error('❌ Compliance test suite failed:', error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Run Core React Rules Audit
   */
  async runCoreReactAudit() {
    console.log('🔍 Running Core React Rules Audit...');

    const auditor = new ReactComplianceAuditor({
      rootDir: this.options.rootDir,
      verbose: this.options.verbose,
    });

    await auditor.runAudit();

    this.results.audits.coreReact = {
      name: 'Core React Rules',
      violations: auditor.violations || [],
      warnings: auditor.warnings || [],
      stats: auditor.stats || {},
      score: this.calculateAuditScore(
        auditor.violations || [],
        auditor.warnings || []
      ),
    };

    this.updateSummary(
      auditor.violations || [],
      auditor.warnings || [],
      auditor.stats || {}
    );
    console.log('✅ Core React Rules Audit Complete\n');
  }

  /**
   * Run React DOM API Audit
   */
  async runReactDOMAudit() {
    console.log('🌐 Running React DOM API Audit...');

    const checker = new ReactDOMComplianceChecker(this.options.rootDir);
    await checker.checkCompliance();

    this.results.audits.reactDOM = {
      name: 'React DOM API',
      violations: checker.violations || [],
      recommendations: checker.recommendations || [],
      score: this.calculateAuditScore(
        checker.violations || [],
        checker.recommendations || []
      ),
    };

    this.updateSummary(
      checker.violations || [],
      checker.recommendations || [],
      {}
    );
    console.log('✅ React DOM API Audit Complete\n');
  }

  /**
   * Run Performance Audit
   */
  async runPerformanceAudit() {
    console.log('⚡ Running Performance Audit...');

    const auditor = new ReactPerformanceAuditor(this.options.rootDir);
    await auditor.auditPerformance();

    this.results.audits.performance = {
      name: 'React Performance',
      issues: auditor.issues || [],
      optimizations: auditor.optimizations || [],
      stats: auditor.stats || {},
      score: this.calculateAuditScore(
        auditor.issues || [],
        auditor.optimizations || []
      ),
    };

    this.updateSummary(
      auditor.issues || [],
      auditor.optimizations || [],
      auditor.stats || {}
    );
    console.log('✅ Performance Audit Complete\n');
  }

  /**
   * Run Architecture Analysis
   */
  async runArchitectureAnalysis() {
    console.log('🏗️ Running Architecture Analysis...');

    const analysis = await this.analyzeArchitecture();

    this.results.audits.architecture = {
      name: 'Component Architecture',
      findings: analysis.findings || [],
      metrics: analysis.metrics || {},
      score: analysis.score || 70,
    };

    console.log('✅ Architecture Analysis Complete\n');
  }

  /**
   * Analyze overall architecture patterns
   */
  async analyzeArchitecture() {
    const files = this.getReactFiles();
    const findings = [];
    const metrics = {
      totalComponents: 0,
      functionalComponents: 0,
      classComponents: 0,
      customHooks: 0,
      errorBoundaries: 0,
      averageComponentSize: 0,
      largeComponents: 0,
    };

    let totalLines = 0;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      totalLines += lines;

      // Count component types
      const functionalComponents = (
        content.match(
          /(?:function\s+[A-Z]\w+|const\s+[A-Z]\w+\s*=.*?(?:function|\())/g
        ) || []
      ).length;
      const classComponents = (
        content.match(/class\s+[A-Z]\w+.*?extends.*?Component/g) || []
      ).length;
      const customHooks = (
        content.match(/(?:function\s+use[A-Z]\w+|const\s+use[A-Z]\w+\s*=)/g) ||
        []
      ).length;
      const errorBoundaries =
        content.includes('componentDidCatch') ||
        content.includes('ErrorBoundary')
          ? 1
          : 0;

      metrics.functionalComponents += functionalComponents;
      metrics.classComponents += classComponents;
      metrics.customHooks += customHooks;
      metrics.errorBoundaries += errorBoundaries;
      metrics.totalComponents += functionalComponents + classComponents;

      // Check for large components (>200 lines)
      if (lines > 200) {
        metrics.largeComponents++;
        findings.push({
          type: 'LARGE_COMPONENT',
          file: path.relative(this.options.rootDir, file),
          message: `Component file is ${lines} lines long`,
          severity: 'warning',
          recommendation: 'Consider breaking into smaller components',
        });
      }

      // Check for missing prop validation
      if (
        content.includes('function ') &&
        !content.includes('PropTypes') &&
        !content.includes('props: {')
      ) {
        findings.push({
          type: 'MISSING_PROP_VALIDATION',
          file: path.relative(this.options.rootDir, file),
          message: 'Component missing prop validation',
          severity: 'warning',
          recommendation: 'Add PropTypes or TypeScript interfaces',
        });
      }
    }

    metrics.averageComponentSize =
      metrics.totalComponents > 0
        ? Math.round(totalLines / metrics.totalComponents)
        : 0;

    // Architecture recommendations
    if (metrics.classComponents > 0) {
      this.results.recommendations.push({
        category: 'Architecture',
        priority: 'Medium',
        recommendation:
          'Migrate class components to functional components with hooks',
        impact: 'Better performance and modern React patterns',
      });
    }

    if (metrics.errorBoundaries === 0) {
      this.results.recommendations.push({
        category: 'Error Handling',
        priority: 'High',
        recommendation:
          'Add ErrorBoundary components for better error handling',
        impact: 'Improved user experience and debugging',
      });
    }

    const score = this.calculateArchitectureScore(metrics, findings);

    return { findings, metrics, score };
  }

  /**
   * Calculate architecture score
   */
  calculateArchitectureScore(metrics, findings) {
    let score = 100;

    // Deduct points for issues
    const criticalFindings = findings.filter(
      (f) => f.severity === 'error'
    ).length;
    const warningFindings = findings.filter(
      (f) => f.severity === 'warning'
    ).length;

    score -= criticalFindings * 15;
    score -= warningFindings * 5;

    // Deduct for poor ratios
    if (metrics.classComponents > metrics.functionalComponents) {
      score -= 20; // Prefer functional components
    }

    if (metrics.largeComponents > 0) {
      score -= metrics.largeComponents * 10;
    }

    if (metrics.errorBoundaries === 0) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate overall compliance score
   */
  calculateOverallScore() {
    const auditScores = Object.values(this.results.audits).map(
      (audit) => audit.score || 0
    );
    const weightedScore =
      auditScores.reduce((sum, score) => sum + score, 0) / auditScores.length;

    this.results.overall.score = Math.round(weightedScore);
    this.results.overall.grade = this.getGrade(this.results.overall.score);
    this.results.overall.status =
      this.results.overall.score >= 70 ? 'PASS' : 'FAIL';
  }

  /**
   * Get letter grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Calculate audit-specific score
   */
  calculateAuditScore(violations, warnings) {
    const criticalIssues = violations.filter(
      (v) => v.severity === 'error'
    ).length;
    const warningIssues = violations.filter(
      (v) => v.severity === 'warning'
    ).length;
    const infoIssues = warnings.length;

    let score = 100;
    score -= criticalIssues * 15;
    score -= warningIssues * 8;
    score -= infoIssues * 3;

    return Math.max(0, score);
  }

  /**
   * Update summary statistics
   */
  updateSummary(violations, warnings, stats) {
    this.results.summary.totalViolations += violations.length;
    this.results.summary.totalWarnings += warnings.length;

    if (stats.filesScanned) {
      this.results.summary.totalFiles += stats.filesScanned;
    }
    if (stats.componentsAnalyzed) {
      this.results.summary.totalComponents += stats.componentsAnalyzed;
    }
  }

  /**
   * Generate unified compliance report
   */
  generateUnifiedReport() {
    console.log('\n📊 UNIFIED COMPLIANCE REPORT');
    console.log('='.repeat(50));

    // Overall Results
    console.log(
      `\n🏆 Overall Compliance Score: ${this.results.overall.score}/100 (${this.results.overall.grade})`
    );
    console.log(`📋 Status: ${this.results.overall.status}`);

    // Summary Statistics
    console.log('\n📈 Summary Statistics:');
    console.log(`Files Scanned: ${this.results.summary.totalFiles}`);
    console.log(`Components Found: ${this.results.summary.totalComponents}`);
    console.log(`Total Violations: ${this.results.summary.totalViolations}`);
    console.log(`Total Warnings: ${this.results.summary.totalWarnings}`);

    // Individual Audit Scores
    console.log('\n📊 Individual Audit Scores:');
    Object.entries(this.results.audits).forEach(([, audit]) => {
      const emoji = audit.score >= 80 ? '✅' : audit.score >= 60 ? '⚠️' : '❌';
      console.log(`${emoji} ${audit.name}: ${audit.score}/100`);
    });

    // Top Priority Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Top Priority Recommendations:');
      this.results.recommendations
        .filter((r) => r.priority === 'High')
        .slice(0, 5)
        .forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.category}: ${rec.recommendation}`);
          console.log(`   Impact: ${rec.impact}`);
        });
    }

    // Compliance Status
    if (this.results.overall.status === 'PASS') {
      console.log(
        '\n🎉 Congratulations! Nightingale CMS meets React compliance standards.'
      );
    } else {
      console.log(
        '\n🚨 Compliance improvements needed. Focus on critical violations first.'
      );
    }

    console.log(`\n📄 Detailed report saved to: ${this.options.outputFile}`);
  }

  /**
   * Save results to JSON file
   */
  saveResults() {
    const reportPath = path.join(this.options.rootDir, this.options.outputFile);

    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`💾 Compliance report saved to: ${reportPath}`);
    } catch (error) {
      console.error('❌ Failed to save report:', error.message);
    }
  }

  /**
   * Apply automatic fixes
   */
  async applyAutomaticFixes() {
    console.log('\n🔧 Applying Automatic Fixes...');

    let fixesApplied = 0;

    // Apply fixes from each audit
    for (const [, audit] of Object.entries(this.results.audits)) {
      if (audit.violations) {
        const fixableViolations = audit.violations.filter((v) => v.autoFix);

        for (const violation of fixableViolations) {
          try {
            await this.applyFix(violation);
            fixesApplied++;
          } catch (error) {
            console.error(
              `❌ Failed to apply fix for ${violation.type}:`,
              error.message
            );
          }
        }
      }
    }

    console.log(`✅ Applied ${fixesApplied} automatic fixes`);

    if (fixesApplied > 0) {
      console.log('🔄 Consider re-running the audit to verify fixes');
    }
  }

  /**
   * Apply individual fix
   */
  async applyFix(violation) {
    const filePath = path.join(this.options.rootDir, violation.file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Apply specific fixes based on violation type
    switch (violation.type) {
      case 'LEGACY_RENDER_API':
        content = this.fixLegacyRenderAPI(content);
        break;
      case 'INCORRECT_ATTRIBUTE_NAMING':
        content = this.fixIncorrectAttributes(content);
        break;
      default:
        // Generic fix - add comment
        content = this.addFixComment(content, violation);
        break;
    }

    fs.writeFileSync(filePath, content);
  }

  fixLegacyRenderAPI(content) {
    return content.replace(
      /ReactDOM\.render\s*\(\s*([^,]+),\s*([^)]+)\s*\)/g,
      'const root = createRoot($2);\nroot.render($1);'
    );
  }

  fixIncorrectAttributes(content) {
    const attributeMap = {
      'class=': 'className=',
      'for=': 'htmlFor=',
      'tabindex=': 'tabIndex=',
      'readonly=': 'readOnly=',
      'maxlength=': 'maxLength=',
    };

    for (const [wrong, correct] of Object.entries(attributeMap)) {
      content = content.replace(new RegExp(wrong, 'g'), correct);
    }

    return content;
  }

  addFixComment(content, violation) {
    const lines = content.split('\n');
    const lineIndex = violation.line - 1;

    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines[lineIndex] =
        `// TODO: Fix ${violation.type} - ${violation.message}\n${lines[lineIndex]}`;
    }

    return lines.join('\n');
  }

  /**
   * Get React files in project
   */
  getReactFiles() {
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    const excludeDirs = ['node_modules', 'build', 'dist', '.git', 'audit'];

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

    scanDir(this.options.rootDir);
    return files;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);

  const options = {
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose'),
    outputFile:
      args.find((arg) => arg.startsWith('--output='))?.split('=')[1] ||
      'compliance-report.json',
  };

  const testSuite = new NightingaleComplianceTestSuite(options);
  testSuite.runFullCompliance().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = NightingaleComplianceTestSuite;
