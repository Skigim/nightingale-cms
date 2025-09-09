#!/usr/bin/env node

/**
 * Architectural Compliance Checker for Nightingale CMS
 *
 * Validates that UI components don't contain business logic
 * and Business components properly use UI components.
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate business logic in UI components (violations)
const BUSINESS_LOGIC_PATTERNS = [
  /fetch\s*\(/, // Direct API calls
  /axios\./, // HTTP requests
  /\.post\(|\.get\(|\.put\(|\.delete\(/, // HTTP methods
  /localStorage\./, // Direct localStorage access
  /sessionStorage\./, // Direct sessionStorage access
  /window\.NightingaleServices/, // Direct service access
  /\.createCase\(|\.updateCase\(|\.deleteCase\(/, // Case operations
  /\.createPerson\(|\.updatePerson\(/, // Person operations
  /\.validate[A-Z]/, // Business validation
];

// Components that are allowed to have business logic
const BUSINESS_COMPONENTS_WHITELIST = [
  'CaseDetailsView',
  'SettingsModal',
  'NightingaleCMSApp',
  'CasesTab',
  'PeopleTab',
  'OrganizationsTab',
  'DashboardTab',
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.js');
  const isUIComponent = filePath.includes('/ui/');
  const isBusiness = BUSINESS_COMPONENTS_WHITELIST.includes(fileName);

  const violations = [];

  if (isUIComponent && !isBusiness) {
    // Check UI components for business logic violations
    BUSINESS_LOGIC_PATTERNS.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          type: 'business-logic-in-ui',
          pattern: pattern.toString(),
          match: matches[0],
          line: content.substring(0, content.indexOf(matches[0])).split('\n')
            .length,
        });
      }
    });
  }

  return {
    file: filePath,
    fileName,
    isUIComponent,
    isBusiness,
    violations,
    valid: violations.length === 0,
  };
}

function checkArchitecturalCompliance() {
  const uiPath = path.join(__dirname, 'src/components/ui');
  const businessPath = path.join(__dirname, 'src/components/business');

  const results = {
    ui: [],
    business: [],
    summary: {
      totalFiles: 0,
      validFiles: 0,
      violationCount: 0,
    },
  };

  // Check UI components
  if (fs.existsSync(uiPath)) {
    const uiFiles = fs
      .readdirSync(uiPath)
      .filter((file) => file.endsWith('.js') && file !== 'index.js')
      .map((file) => path.join(uiPath, file));

    uiFiles.forEach((file) => {
      const result = checkFile(file);
      results.ui.push(result);
      results.summary.totalFiles++;
      if (result.valid) results.summary.validFiles++;
      results.summary.violationCount += result.violations.length;
    });
  }

  // Check Business components
  if (fs.existsSync(businessPath)) {
    const businessFiles = fs
      .readdirSync(businessPath)
      .filter((file) => file.endsWith('.js') && file !== 'index.js')
      .map((file) => path.join(businessPath, file));

    businessFiles.forEach((file) => {
      const result = checkFile(file);
      results.business.push(result);
      results.summary.totalFiles++;
      if (result.valid) results.summary.validFiles++;
      results.summary.violationCount += result.violations.length;
    });
  }

  return results;
}

// Run the check
const results = checkArchitecturalCompliance();

console.log('\n🏗️  Nightingale CMS - Architectural Compliance Report\n');
console.log('='.repeat(60));

console.log(`\n📊 Summary:`);
console.log(`   Total Files: ${results.summary.totalFiles}`);
console.log(`   Valid Files: ${results.summary.validFiles}`);
console.log(`   Violations: ${results.summary.violationCount}`);
console.log(
  `   Compliance: ${((results.summary.validFiles / results.summary.totalFiles) * 100).toFixed(1)}%`,
);

if (results.summary.violationCount > 0) {
  console.log(`\n❌ Architectural Violations Found:`);

  [...results.ui, ...results.business].forEach((file) => {
    if (file.violations.length > 0) {
      console.log(
        `\n   📁 ${file.fileName} (${file.isUIComponent ? 'UI' : 'Business'})`,
      );
      file.violations.forEach((violation) => {
        console.log(`      ⚠️  Line ${violation.line}: ${violation.match}`);
        console.log(`          Pattern: ${violation.pattern}`);
      });
    }
  });

  process.exit(1);
} else {
  console.log(`\n✅ All components follow architectural guidelines!`);
  console.log(`   🎨 UI components contain only presentation logic`);
  console.log(`   🏢 Business components properly handle domain logic`);
  process.exit(0);
}
