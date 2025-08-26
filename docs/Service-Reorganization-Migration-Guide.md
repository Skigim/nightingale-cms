# Service Reorganization Migration Guide

## Overview

The Nightingale CMS utility services have been reorganized to improve maintainability, reduce code duplication, and provide better separation of concerns. This guide outlines the changes and provides migration instructions.

## Previous Issues

1. **Clipboard Functionality Duplication**: Both `nightingale.utils.js` and `nightingale.cmsutilities.js` contained similar clipboard operations
2. **Mixed Concerns**: General utilities were mixed with domain-specific business logic
3. **Poor Service Boundaries**: Unclear responsibilities between services
4. **Maintenance Overhead**: Similar functions in multiple places

## New Service Architecture

### 🔧 Core Services

- **`nightingale.coreutilities.js`** - Pure utility functions (security, formatting, validation)
- **`nightingale.clipboard.js`** - Dedicated clipboard operations with modern API
- **`nightingale.uiutilities.js`** - UI interaction utilities (focus management, navigation)

### 🏢 Business Services

- **`nightingale.cmsutilities.v2.js`** - CMS-specific business logic only

## Service Boundaries

### ✅ Core Utilities (`nightingale.coreutilities.js`)

**Purpose**: Framework-agnostic, reusable utility functions

- Security: `sanitize()`, `setSanitizedInnerHTML()`, `encodeURL()`, `sanitizeHTML()`
- Date/Time: `formatDate()`, `toInputDateFormat()`
- Text Formatting: `formatPhoneNumber()`, `formatProperCase()`, `formatPersonName()`
- Validation: `Validators` object with validation functions
- Generic Data: `getNextId()`, `NightingaleSearchService`

### 📋 Clipboard Service (`nightingale.clipboard.js`)

**Purpose**: Modern clipboard operations with fallback support

- Primary: `NightingaleClipboard.copyText()`
- Specialized: `NightingaleClipboard.copyMCN()`, `NightingaleClipboard.copyFinancialItem()`
- Legacy wrappers: `copyToClipboard()`, `copyMCN()`, `fallbackCopyTextToClipboard()`

### 🎨 UI Utilities (`nightingale.uiutilities.js`)

**Purpose**: UI interaction and user experience utilities

- Focus Management: `NightingaleFocusManager` class
- Navigation: `scrollToSection()`, `scrollToNotes()`
- Development: `testDataIntegrityBroadcast()`, `checkAppStatus()`, `debugComponentLibrary()`

### 🏢 CMS Utilities (`nightingale.cmsutilities.v2.js`)

**Purpose**: CMS-specific business logic and domain knowledge

- Data Processing: `getFlatFinancials()`, `getAppDateLabel()`, `getDefaultAppDetails()`, `getUniqueNoteCategories()`
- Case Actions: `generateCaseSummary()`, `openVRApp()`
- Testing: `testFinancialMigration()`

## Migration Steps

### 1. Update Service Loading

**Old** (in HTML files):

```html
<script src="js/services/nightingale.utils.js"></script>
<script src="js/services/nightingale.cmsutilities.js"></script>
```

**New** (automatic via services index):

```html
<script src="js/services/index.js"></script>
<!-- Services auto-load in correct order -->
```

### 2. Function Reference Updates

#### Clipboard Functions

**Old**:

```javascript
// From nightingale.cmsutilities.js
copyToClipboard(text, successMessage, errorMessage);
copyMCN(mcn);
fallbackCopyTextToClipboard(text, successMessage, errorMessage);
```

**New** (modern):

```javascript
// Using new clipboard service
await NightingaleClipboard.copyText(text, { successMessage, errorMessage });
await NightingaleClipboard.copyMCN(mcn);
// Or legacy compatibility (still works)
copyToClipboard(text, successMessage, errorMessage);
copyMCN(mcn);
```

#### Core Utilities

**Old**:

```javascript
// From nightingale.utils.js
window.sanitize(text);
window.formatDate(dateString);
window.Validators.email('Custom message')(value);
```

**New** (modern):

```javascript
// Using new core utilities service
NightingaleCoreUtilities.sanitize(text);
NightingaleCoreUtilities.formatDate(dateString);
NightingaleCoreUtilities.Validators.email('Custom message')(value);
// Or legacy compatibility (still works)
window.sanitize(text);
window.formatDate(dateString);
window.Validators.email('Custom message')(value);
```

#### Focus Management

**Old**:

```javascript
// From nightingale.utils.js
window.NightingaleFocusManager.focusFirst(container, options);
```

**New**:

```javascript
// Using new UI utilities service
NightingaleUIUtilities.FocusManager.focusFirst(container, options);
// Or direct access (still works)
window.NightingaleFocusManager.focusFirst(container, options);
```

#### CMS Functions

**Old**:

```javascript
// From nightingale.cmsutilities.js
window.NightingaleCMSUtilities.generateCaseSummary(caseData);
window.NightingaleCMSUtilities.openVRApp(caseData, 'correspondence');
```

**New**:

```javascript
// Using new CMS utilities service
NightingaleCMSUtilities.generateCaseSummary(caseData);
NightingaleCMSUtilities.openVRApp(caseData, 'correspondence');
// Or legacy compatibility (still works)
window.generateCaseSummary(caseData);
window.openVRApp(caseData, 'correspondence');
```

### 3. Service Registry Access

**New Pattern** (recommended):

```javascript
// Access via service registry
const clipboardService = window.NightingaleServices.getService('clipboard');
const coreUtils = window.NightingaleServices.getService('coreUtilities');
const uiUtils = window.NightingaleServices.getService('uiUtilities');
const cmsUtils = window.NightingaleServices.getService('cmsUtilities');

// Check service status
const status = window.NightingaleServices.listServices();
const isReady = window.NightingaleServices.isReady();
```

## Backward Compatibility

### ✅ All legacy function calls continue to work

- No breaking changes to existing code
- Global function references maintained for compatibility
- Existing component code requires no immediate updates

### 🔄 Gradual Migration Recommended

1. **Phase 1**: Update new code to use modern service patterns
2. **Phase 2**: Gradually update existing code during maintenance
3. **Phase 3**: Remove legacy global exports (future major version)

## Benefits Achieved

### 🎯 Clear Separation of Concerns

- **Core**: Framework-agnostic utilities
- **Clipboard**: Dedicated modern clipboard operations
- **UI**: User interface and interaction utilities
- **CMS**: Business logic specific to Nightingale CMS

### 🔧 Improved Maintainability

- Single responsibility per service
- Reduced code duplication
- Clear service boundaries
- Better testing isolation

### 📦 Better Dependency Management

- Services auto-load in correct order
- Clear dependency relationships
- Service registry for discovery
- Enhanced error handling

### 🚀 Modern API Design

- Promise-based clipboard operations
- Configurable options objects
- Consistent error handling
- Progressive enhancement patterns

## Testing the Migration

### Service Loading Test

```javascript
// Check that all services loaded correctly
window.debugNightingaleServices();

// Verify specific services
console.log('Clipboard:', !!window.NightingaleClipboard);
console.log('Core Utils:', !!window.NightingaleCoreUtilities);
console.log('UI Utils:', !!window.NightingaleUIUtilities);
console.log('CMS Utils:', !!window.NightingaleCMSUtilities);
```

### Function Compatibility Test

```javascript
// Test that legacy functions still work
console.log('Legacy sanitize:', typeof window.sanitize === 'function');
console.log('Legacy copyMCN:', typeof window.copyMCN === 'function');
console.log('Legacy formatDate:', typeof window.formatDate === 'function');
console.log(
  'Legacy generateCaseSummary:',
  typeof window.generateCaseSummary === 'function'
);
```

### Modern API Test

```javascript
// Test modern service access
const coreUtils = window.NightingaleServices.getService('coreUtilities');
const clipboardService = window.NightingaleServices.getService('clipboard');

console.log('Modern core utils:', !!coreUtils);
console.log('Modern clipboard:', !!clipboardService);

// Test modern clipboard operation
clipboardService.copyText('Test text', {
  successMessage: 'Migration test successful!',
  showToast: true,
});
```

## File Status

### ✅ New Files (Active)

- `nightingale.coreutilities.js` - Core utility functions
- `nightingale.clipboard.js` - Clipboard operations
- `nightingale.uiutilities.js` - UI interaction utilities
- `nightingale.cmsutilities.v2.js` - CMS business logic

### ⚠️ Legacy Files (Deprecated but Still Present)

- `nightingale.utils.js` - Will be phased out
- `nightingale.cmsutilities.js` - Will be phased out

### 📝 Updated Files

- `index.js` - Updated to load new service architecture

## Next Steps

1. **Immediate**: Test that existing application functionality works unchanged
2. **Short Term**: Update new development to use modern service patterns
3. **Medium Term**: Gradually migrate existing code during maintenance cycles
4. **Long Term**: Remove legacy files and global exports in next major version

## Support

If you encounter issues during migration:

1. Check that services are loading: `window.debugNightingaleServices()`
2. Verify legacy functions: `typeof window.functionName === 'function'`
3. Test modern services: `window.NightingaleServices.getService('serviceName')`
4. Review browser console for loading errors or deprecation warnings

The reorganization maintains full backward compatibility while providing a cleaner, more maintainable foundation for future development.
