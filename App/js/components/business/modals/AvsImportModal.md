# AVS Data Import Modal

## Overview

The `AvsImportModal` is a React business component that enables users to import and merge Asset Verification System (AVS) data with existing financial resources in the Nightingale CMS. This component follows React best practices and the Nightingale CMS component architecture.

## Features

- ✅ **React Best Practices Compliant**: Follows all Rules of React
- ✅ **Component Purity**: No side effects in render, immutable state
- ✅ **Error Handling**: Comprehensive error boundaries and user feedback
- ✅ **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- ✅ **Performance**: Memoized calculations, efficient re-renders
- ✅ **Nightingale Patterns**: Self-registering, component-scoped React.createElement

## Architecture

```
AvsImportModal (Business Layer)
├── Modal (UI Layer)
├── FormField (UI Layer)
├── Button (UI Layer)
└── PreviewList (Local Component)
    └── PreviewItem (Local Component)
        └── ImportButton (Local Component - useFormStatus ready)
```

## Usage

### Basic Integration

```javascript
// Import the component (automatically loaded via business component system)
const { AvsImportModal } = window;

// Use in your React component
function FinancialManagement({ caseData }) {
  const e = window.React.createElement;
  const [showAvsImport, setShowAvsImport] = useState(false);

  const handleAvsImport = (importedItems) => {
    // Process imported financial items
    console.log('Imported items:', importedItems);

    // Update your application state
    importedItems.forEach((item) => {
      addFinancialResource(caseData.id, item);
    });

    // Show success notification
    window.NightingaleToast?.show({
      message: `Imported ${importedItems.length} financial items`,
      type: 'success',
    });
  };

  return e(
    'div',
    null,
    e(
      'button',
      {
        onClick: () => setShowAvsImport(true),
      },
      'Import AVS Data'
    ),

    e(AvsImportModal, {
      isOpen: showAvsImport,
      onClose: () => setShowAvsImport(false),
      onImport: handleAvsImport,
      masterCaseId: caseData.mcn,
      ownerFilter: 'applicant', // 'applicant' | 'spouse' | 'both'
      existingResources: caseData.financialResources || [],
    })
  );
}
```

### Advanced Usage with Context

```javascript
// Using with Nightingale context for better integration
function CaseManagementWithAvs() {
  const e = window.React.createElement;
  const { currentCase, updateCase } = useContext(NightingaleContext);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleImport = useCallback(
    async (importedItems) => {
      try {
        // Transform AVS data to Nightingale format
        const transformedItems = importedItems.map((item) => ({
          ...item,
          caseId: currentCase.id,
          dateAdded: new Date().toISOString(),
          addedBy: currentUser.id,
        }));

        // Update case with new financial resources
        await updateCase(currentCase.id, {
          financialResources: [
            ...currentCase.financialResources,
            ...transformedItems,
          ],
        });

        setImportModalOpen(false);
      } catch (error) {
        console.error('Import failed:', error);
        // Handle error appropriately
      }
    },
    [currentCase, updateCase]
  );

  return e(AvsImportModal, {
    isOpen: importModalOpen,
    onClose: () => setImportModalOpen(false),
    onImport: handleImport,
    masterCaseId: currentCase.mcn,
    existingResources: currentCase.financialResources,
  });
}
```

## Props API

| Prop                | Type       | Required | Default       | Description                        |
| ------------------- | ---------- | -------- | ------------- | ---------------------------------- |
| `isOpen`            | `boolean`  | ✅       | -             | Controls modal visibility          |
| `onClose`           | `function` | ✅       | -             | Callback when modal is closed      |
| `onImport`          | `function` | ✅       | -             | Callback with selected items array |
| `masterCaseId`      | `string`   | ✅       | -             | Case identifier for context        |
| `ownerFilter`       | `string`   | ❌       | `"applicant"` | Filter for owner matching          |
| `existingResources` | `array`    | ❌       | `[]`          | Existing financial resources       |

### Callback Signatures

```typescript
onClose: () => void

onImport: (selectedItems: Array<{
  id: string;
  type: string;
  owner: string;
  location: string;
  accountNumber: string;
  value: number;
  verificationStatus: string;
  source: string;
  isNew: boolean;
  isDuplicate: boolean;
  importAction: 'create' | 'update';
}>) => void
```

## Data Flow

### Input Data Format (Raw AVS)

```
Account Owner: John Doe Checking Account
First National Bank - (1234)
Balance as of 08/22/2025 - $1,500.00

Account Owner: Jane Doe Savings Account
Community Credit Union - (5678)
Balance as of 08/22/2025 - $3,250.50
```

### Parsed Data Structure

```javascript
{
  id: "avs-CASE001-0",
  type: "Checking",
  owner: "John Doe",
  location: "First National Bank",
  accountNumber: "1234",
  value: 1500.00,
  verificationStatus: "Verified",
  source: "AVS as of 08/22/2025",
  isNew: true,
  isDuplicate: false,
  importAction: "create"
}
```

## Error Handling

The component implements comprehensive error handling:

### Parse Errors

- Invalid AVS data format
- Empty input validation
- Parser service unavailability

### Import Errors

- No items selected
- Validation failures
- Network/storage errors

### Error Display

```javascript
// Errors are displayed in context-appropriate locations
<div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
  <div className="text-sm text-red-700">{error}</div>
</div>
```

## State Management

The component uses local state management following React best practices:

```javascript
const [rawData, setRawData] = useState(''); // Textarea input
const [previewItems, setPreviewItems] = useState([]); // Parsed results
const [selectedItems, setSelectedItems] = useState(new Set()); // User selection
const [isLoading, setIsLoading] = useState(false); // Parse operation
const [error, setError] = useState(null); // Error messages
```

## Accessibility Features

- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Error announcements

## Performance Optimizations

- ✅ `useMemo` for expensive calculations
- ✅ `useCallback` for stable function references
- ✅ Component-level memoization for preview items
- ✅ Efficient Set operations for selections

## Testing

### Integration Test

Run the included integration test:

```javascript
// In browser console
window.runAvsImportIntegrationTest();
```

### Unit Testing Pattern

```javascript
// Mock the required dependencies
const mockProps = {
  isOpen: true,
  onClose: jest.fn(),
  onImport: jest.fn(),
  masterCaseId: 'TEST-001',
  existingResources: [],
};

// Test component rendering
const component = render(AvsImportModal(mockProps));
```

## Dependencies

### UI Components

- `window.Modal` - Base modal component
- `window.FormField` - Form field wrapper
- `window.Button` - Button component

### Services

- `window.parseAvsData` - AVS parsing service
- `window.dateUtils` - Date formatting utilities

### React

- `window.React` - React library
- `window.ReactDOM` - React DOM library

## Browser Support

- Modern browsers with ES6+ support
- React 18+ compatible
- File:// protocol supported (for local development)

## Migration Notes

### From Legacy Implementation

When migrating from the legacy modal implementation:

1. **State Management**: Replace direct DOM manipulation with React state
2. **Event Handling**: Convert jQuery event listeners to React event handlers
3. **Data Flow**: Replace global state mutations with controlled props
4. **Error Handling**: Implement React error boundaries

### Breaking Changes

- No global modal functions (use React props)
- Different callback signatures
- State management through React instead of DOM

## Future Enhancements

### Planned Features

- [ ] `useFormStatus` integration for enhanced form feedback
- [ ] Batch import validation
- [ ] Import preview with diff view
- [ ] Undo/redo functionality
- [ ] Export functionality

### Component Evolution

- [ ] TypeScript conversion
- [ ] Unit test coverage
- [ ] Storybook documentation
- [ ] Performance profiling

## Related Components

- `CaseCreationModal` - Similar stepper pattern
- `PersonCreationModal` - Form validation patterns
- `FinancialItemCard` - Financial data display
- `StepperModal` - Multi-step workflow base

## Support

For issues or questions about the AVS Import Modal:

1. Check the integration test for usage examples
2. Review the React best practices documentation
3. Verify all dependencies are loaded
4. Check browser console for error messages

---

_Last Updated: August 22, 2025_
_Component Version: 1.0.0_
_React Best Practices Compliant: ✅_
