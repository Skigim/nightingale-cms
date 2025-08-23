# Correspondence Logic Extraction Summary

## Overview

Successfully extracted core correspondence functionality from `NightingaleCorrespondence.html` for integration into the main Nightingale CMS case details view. The extraction focused on pure business logic services without UI components, following the user's directive to avoid UI migration complexity.

## Extracted Services

### 1. Placeholder Processing Service

**File:** `App/js/services/nightingale.placeholders.js`
**Size:** 201 lines
**Purpose:** Core placeholder replacement engine for dynamic template content

**Key Functions:**

- `processPlaceholders(template, caseData, fullData, additionalPlaceholders)` - Main processing function
- `getAvailablePlaceholders(caseData, fullData)` - Lists all available placeholders
- `validatePlaceholders(template)` - Finds undefined placeholders in templates
- `previewPlaceholders(template, caseData, fullData)` - Shows placeholder preview
- `formatCurrency(amount)` - Formats monetary values
- `formatDate(dateStr, format)` - Formats dates with dayjs integration

**Placeholders Supported:**

- Case: `{CaseMCN}`, `{CaseStatus}`, `{CaseType}`, `{ServiceType}`
- Client: `{ClientName}`, `{ClientAddress}`, `{ClientPhone}`, `{ClientEmail}`
- Organization: `{OrganizationName}`, `{OrgAddress}`, `{OrgPhone}`, `{OrgEmail}`
- Dates: `{CurrentDate}`, `{CaseOpenDate}`, `{CaseCloseDate}`
- Financial: `{ItemName}`, `{Location}`, `{AccountNumber}`, `{Value}`

### 2. Template Management Service

**File:** `App/js/services/nightingale.templates.js`
**Size:** 568 lines
**Purpose:** Complete template CRUD operations with category management

**Key Functions:**

- `createTemplate(templateData, fullData, options)` - Create new templates
- `updateTemplate(templateId, templateData, fullData, options)` - Update existing templates
- `deleteTemplate(templateId, fullData, options)` - Delete templates
- `validateTemplate(templateData, fullData, excludeId)` - Comprehensive validation
- `addCategory(categoryName, fullData, options)` - Category management
- `getTemplatesByCategory(data, category)` - Filter templates by category
- `searchTemplates(data, searchTerm, options)` - Search by name/content

**Features:**

- Name uniqueness validation (3-100 characters)
- Content validation (minimum 10 characters)
- Category management with automatic sorting
- Immediate file persistence with CMS synchronization via BroadcastChannel
- Comprehensive error handling and toast notifications

### 3. Document Generation Service

**File:** `App/js/services/nightingale.documentgeneration.js`
**Size:** 570 lines
**Purpose:** VR request creation and document generation workflows

**Key Functions:**

- `generateDocumentContent(template, activeCase, fullData, selectedFinancialItems)` - Generate content
- `appendDocumentContent(...)` - Append content to existing documents
- `createVrRequest(requestData, activeCase, fullData, selectedFinancialItemIds)` - Create VR requests
- `updateVrRequestStatus(requestId, newStatus, fullData)` - Update request status
- `getCaseFinancialItems(caseData)` - Get all financial items for a case
- `getVrRequestStats(data, caseId)` - Get statistics about requests

**VR Request Data Structure:**

```javascript
{
  id: number,
  caseId: number,
  mcn: string,
  clientName: string,
  content: string,
  createdDate: string,
  dueDate: string,
  status: 'Pending'|'Approved'|'Rejected'|'Completed',
  financialItemIds: number[],
  templateId: number|null
}
```

## Data Structure Requirements

The services expect these data structures in the main Nightingale data:

```javascript
{
  // Template management
  vrTemplates: [
    { id: number, name: string, category: string, content: string }
  ],
  vrCategories: string[], // ['Banking', 'Facility', 'Government']
  nextVrTemplateId: number,

  // VR requests
  vrRequests: [
    {
      id: number, caseId: number, mcn: string, clientName: string,
      content: string, createdDate: string, dueDate: string,
      status: string, financialItemIds: number[], templateId: number
    }
  ],
  nextVrRequestId: number,

  // Existing CMS data
  cases: [...],
  people: [...],
  organizations: [...]
}
```

## Integration Strategy

### Step 1: Service Registration

Add service loading to the main CMS HTML file:

```html
<!-- Load extracted services -->
<script src="js/services/nightingale.placeholders.js"></script>
<script src="js/services/nightingale.templates.js"></script>
<script src="js/services/nightingale.documentgeneration.js"></script>
```

### Step 2: Service Access

Services are available globally:

```javascript
// Access services
const placeholderService = window.NightingalePlaceholderService;
const templateService = window.NightingaleTemplateService;
const docService = window.NightingaleDocumentGenerationService;

// Or through NightingaleServices if registered
const services = window.NightingaleServices;
```

### Step 3: Case Details Integration

Add correspondence functionality to case details view:

```javascript
// Example: Generate VR request from case details
const result = await docService.createVrRequest(
  {
    content: generatedContent,
    dueDays: 15,
    templateId: selectedTemplateId,
  },
  activeCase,
  fullData,
  selectedFinancialItemIds,
  { saveToFile: true, showToast: true }
);
```

### Step 4: Template Management Integration

Add template management to admin/settings:

```javascript
// Example: Create new template
const result = await templateService.createTemplate(
  {
    name: 'Bank Verification Request',
    category: 'Banking',
    content: 'Please verify account for {ClientName}...',
  },
  fullData,
  { saveToFile: true, showToast: true }
);
```

## Dependencies

All services have optional dependencies and graceful fallbacks:

- **Required:** None (services work without dependencies)
- **Enhanced with:**
  - `nightingale.fileservice.js` - For file persistence
  - `nightingale.toast.js` - For notifications
  - `nightingale.dayjs.js` - For date formatting
  - `lodash` - For deep cloning (falls back to JSON methods)
  - `BroadcastChannel` - For CMS synchronization

## BroadcastChannel Integration

Services send data update broadcasts for CMS synchronization:

```javascript
// Listen for updates in main CMS
const channel = new BroadcastChannel('nightingale_suite');
channel.addEventListener('message', (event) => {
  if (
    event.data.type === 'data_updated' &&
    event.data.source === 'correspondence'
  ) {
    // Refresh CMS data
    loadData();
  }
});
```

## Migration Requirements

For existing Nightingale CMS instances, ensure these data migrations:

1. **Add VR data structures** to main data file:
   - `vrTemplates: []`
   - `vrCategories: ['Banking', 'Facility', 'Government']`
   - `vrRequests: []`
   - `nextVrTemplateId: 1`
   - `nextVrRequestId: 1`

2. **Update financial items** to support verification status:
   - Add `verificationStatus` field to financial items
   - Possible values: `null`, `'VR Pending'`, `'VR Approved'`, `'VR Rejected'`

## Integration Examples

### Generate Document from Template

```javascript
const content = docService.generateDocumentContent(
  template,
  activeCase,
  fullData,
  selectedFinancialItems,
  { additionalPlaceholders: { CustomField: 'Value' } }
);
```

### Process Template with Placeholders

```javascript
const processed = placeholderService.processPlaceholders(
  template.content,
  activeCase,
  fullData,
  { ItemName: 'Checking Account', Value: '$1,500.00' }
);
```

### Create VR Request with Financial Items

```javascript
const result = await docService.createVrRequest(
  {
    content: finalDocumentContent,
    dueDays: 15,
    templateId: selectedTemplate.id,
  },
  activeCase,
  fullData,
  [financialItem1.id, financialItem2.id],
  {
    saveToFile: true,
    showToast: true,
    updateItemStatus: true,
  }
);
```

## Next Steps

1. **Review extracted services** - Validate functionality matches requirements
2. **Plan UI integration** - Design case details correspondence interface
3. **Add service loading** - Include services in main CMS HTML
4. **Test integration** - Verify services work with existing CMS data
5. **Create UI components** - Build correspondence interface using existing UI component library
6. **Data migration** - Update existing CMS data with VR structures

## Service File Locations

- `App/js/services/nightingale.placeholders.js` - ✅ Created
- `App/js/services/nightingale.templates.js` - ✅ Created
- `App/js/services/nightingale.documentgeneration.js` - ✅ Created

All services follow the Nightingale CMS service patterns with:

- Self-contained functionality
- Global window registration
- Optional dependency injection
- Comprehensive error handling
- CMS integration via BroadcastChannel
- Promise-based async operations
