# Nightingale CMS - Autonomous Component Extraction Workflow

## 📋 Prerequisites & Context

### Required Reading (Complete BEFORE starting any tasks)

1. Read `.github/copilot-instructions.md` for React patterns and architecture guidelines
2. Examine `src/components/ui/TabBase.js` to understand the factory pattern
3. Review `src/components/business/index.js` for component registry patterns
4. Study existing business components for extraction examples
5. Read `src/pages/NightingaleCMS-React.html` to understand current embedded structure

### Project Architecture Rules

- Use React functional components with `const e = window.React.createElement;` within each component
- Separate generic UI components (`src/components/ui/`) from business logic (`src/components/business/`)
- All components must be self-registering for both module and script loading
- Follow the two-layer architecture: UI (presentation) + Business (domain logic)

## 🎯 Autonomous Workflow Tasks

### Phase 1: Analysis & Documentation

- [ ] **ANALYSIS TASK**: Examine `src/pages/NightingaleCMS-React.html` lines 1-2000 and create detailed inventory of:
  - Embedded React components that should be extracted
  - Current TabBase.js usage patterns
  - Existing component registry implementations
  - Dependencies between embedded components
  - **DELIVERABLE**: Create `analysis-embedded-components.md` with findings and extraction plan

### Phase 2: TabBase.js Factory Implementation

- [ ] **Extract DashboardTab**:
  - **SOURCE**: `src/pages/NightingaleCMS-React.html` (search for "DashboardTab")
  - **TARGET**: `src/components/business/DashboardTab.js`
  - **PATTERN**: Use TabBase.js factory (study existing pattern in business components)
  - **VALIDATION**: Component renders correctly when imported
  - **REGISTRY**: Add to `src/components/business/index.js`

- [ ] **Extract CasesTab**:
  - **SOURCE**: `src/pages/NightingaleCMS-React.html` (search for "CasesTab")
  - **TARGET**: `src/components/business/CasesTab.js`
  - **PATTERN**: Use TabBase.js factory pattern
  - **VALIDATION**: Component renders correctly when imported
  - **REGISTRY**: Add to `src/components/business/index.js`

- [ ] **Extract PeopleTab**:
  - **SOURCE**: `src/pages/NightingaleCMS-React.html` (search for "PeopleTab")
  - **TARGET**: `src/components/business/PeopleTab.js`
  - **PATTERN**: Use TabBase.js factory pattern
  - **VALIDATION**: Component renders correctly when imported
  - **REGISTRY**: Add to `src/components/business/index.js`

### Phase 3: Component Testing & Validation

- [ ] **Test Extracted Components**:
  - Open `src/pages/NightingaleCMS-React.html` in browser
  - Verify all three extracted tabs load and function correctly
  - Check browser console for errors
  - Test tab switching functionality
  - **SUCCESS CRITERIA**: No console errors, all tabs functional

- [ ] **Test Component Registry**:
  - Verify components are properly registered in business registry
  - Test fallback behavior if components fail to load
  - Check that both window.ComponentName and registry access work
  - **SUCCESS CRITERIA**: Components accessible via both patterns

### Phase 4: Additional Component Extraction

- [ ] **Extract CaseDetailsView**:
  - **SOURCE**: `src/pages/NightingaleCMS-React.html` (search for "CaseDetailsView")
  - **TARGET**: `src/components/business/CaseDetailsView.js`
  - **PATTERN**: Follow business component structure (not TabBase.js)
  - **VALIDATION**: Component renders correctly in case workflows
  - **REGISTRY**: Add to business component registry

- [ ] **Final Embedded Component Analysis**:
  - **TASK**: After major extractions, re-examine main file for remaining embedded components
  - **CRITERIA**: Look for React.createElement blocks > 20 lines that could be extracted
  - **DELIVERABLE**: Update `analysis-embedded-components.md` with remaining work

## 🔧 Technical Implementation Guidelines

### Component Extraction Pattern

```javascript
// Template for extracted components
function ComponentName({ prop1, prop2 }) {
  const e = window.React.createElement;

  // Component logic here

  return e(
    'div',
    { className: 'component-class' }
    // Component JSX structure
  );
}

// Self-registration
if (typeof window !== 'undefined') {
  window.ComponentName = ComponentName;

  if (window.NightingaleBusiness) {
    window.NightingaleBusiness.registerComponent(
      'ComponentName',
      ComponentName
    );
  }
}
```

### Success Validation Checklist

For each extracted component:

- [ ] Component file created in correct directory
- [ ] Follows React patterns from copilot-instructions.md
- [ ] Self-registers with both window and registry
- [ ] Original functionality maintained
- [ ] No console errors when loaded
- [ ] Added to appropriate index.js registry

## 🚨 Safety & Rollback Instructions

### Before Starting Any Changes

- Current branch: `dev` (confirmed safe for experimentation)
- All changes can be rolled back with `git reset --hard HEAD^`
- Create checkpoint commits after each major extraction

### Error Handling

- If component extraction breaks functionality, immediately revert that specific change
- Check browser console for specific error messages
- Validate each component in isolation before proceeding to next extraction

### Commit Strategy

- One commit per component extraction: `feat(components): extract [ComponentName] from main file`
- Include validation results in commit messages
- Use conventional commit format for easy rollback identification

---

**Final Note**: This workflow prioritizes analysis and incremental extraction with validation at each step. The autonomous agent should complete Phase 1 analysis before proceeding to any code changes.
