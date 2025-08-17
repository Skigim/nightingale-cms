# Nightingale Component Library

A reusable component library for the Nightingale Case Management Suite, providing consistent UI components across all applications.

## Architecture

The component library is designed to work seamlessly with the existing Nightingale architecture:
- **Script-tag compatible** for immediate use in current applications
- **ES6 module support** for future development  
- **React.createElement** based for consistency with existing React patterns
- **Tailwind CSS** styling to match current design system
- **Service Integration** with Nightingale's core utilities and services

### Integration with Nightingale Services

The component library leverages and extends the existing Nightingale infrastructure:

#### **Core Services Integration**
- **`nightingale.utils.js`** - Validators, formatters, sanitization, search service
- **`nightingale.dayjs.js`** - Date utilities (`dateUtils`) for consistent date handling
- **`nightingale.fileservice.js`** - File system operations for data persistence
- **`nightingale.search.js`** - `NightingaleSearchService` for fuzzy search capabilities
- **`nightingale.parsers.js`** - AVS (Asset Verification System) bank data report parsing for alerts functionality

#### **External Library Dependencies**
- **Day.js + plugins** - Date manipulation and formatting
- **Fuse.js** - Fuzzy search capabilities (via NightingaleSearchService)
- **React/ReactDOM** - Component framework
- **Tailwind CSS** - Utility-first styling system

## Available Components

### ✅ SearchBar
A flexible, reusable search input component with advanced features and service integration.

**Features:**
- Configurable placeholder text and sizing
- Optional search icon and clear button
- **Fuse.js integration** via `NightingaleSearchService`
- **Dropdown search results** with custom rendering
- **Keyboard navigation** and accessibility
- Consistent focus states and transitions

### ✅ Modal System
A comprehensive modal system providing consistent modal behavior across applications.

**Components:**
- **`Modal`** - Base modal wrapper with size variants and accessibility
- **`ConfirmationModal`** - Pre-configured confirmation dialogs with variants
- **`FormModal`** - Form-specific modal with validation integration

**Features:**
- Multiple size variants (small, default, large, xlarge)
- Escape key and backdrop click handling
- Focus management and keyboard navigation
- Integration with existing `showToast` notification system

### ✅ Badge System  
Status badges and indicators with consistent color schemes and variants.

**Components:**
- **`Badge`** - Main status badge with multiple variants
- **`ProgressBadge`** - Shows completion percentages
- **`CountBadge`** - Numeric count indicators
- **`MultiBadge`** - Multiple badges in a row

**Variants:**
- **Verification Status** - "Needs VR", "VR Pending", "Verified", etc.
- **Case Status** - "Active", "Pending", "Closed", "Denied", etc.
- **Case Types** - "LTC", "SIMP", "QMB", etc.
- **Priority Levels** - "High", "Medium", "Low", "Critical"

### ✅ Form Components
Form components with integrated validation and consistent styling.

**Components:**
- **`FormField`** - Wrapper with labels, errors, and hints
- **`TextInput`** - Text input with validation and formatting
- **`Select`** - Dropdown with consistent styling
- **`DateInput`** - Date input with `dateUtils` integration
- **`Textarea`** - Multi-line text input
- **`Checkbox`** - Checkbox with label support

**Features:**
- **Validator Integration** - Uses `Validators` from `nightingale.utils.js`
- **Formatter Integration** - Uses formatters like `formatPhoneNumber`
- **Date Integration** - Uses `dateUtils` for date handling
- **Error Handling** - Consistent error display and validation

### ✅ Button System
A comprehensive button component with multiple variants, sizes, and states.

**Components:**
- **`Button`** - Main button component with full configuration
- **`PrimaryButton`** - Pre-configured primary button
- **`SecondaryButton`** - Pre-configured secondary button
- **`DangerButton`** - Pre-configured danger/delete button
- **`SuccessButton`** - Pre-configured success button
- **`OutlineButton`** - Pre-configured outline variant
- **`GhostButton`** - Pre-configured ghost variant
- **`LinkButton`** - Pre-configured link-style button

**Variants:**
- **Primary** - Main action buttons (blue)
- **Secondary** - Secondary actions (gray)
- **Success** - Confirmation actions (green)
- **Danger** - Destructive actions (red)
- **Warning** - Warning actions (yellow)
- **Outline** - Transparent with border
- **Ghost** - Transparent minimal style
- **Link** - Link-style button with underline

**Features:**
- **Multiple Sizes** - xs, sm, md, lg, xl
- **Loading States** - Built-in spinner animation
- **Icon Support** - Left/right icon positioning with common icon library
- **Accessibility** - Focus states, keyboard navigation, disabled states
- **Full Width** - Optional full-width layout
- **Consistent Styling** - Matches Nightingale design system

### ✅ DataTable System
Comprehensive table component with sorting, pagination, and actions.

**Features:**
- **Sortable Headers** - Click to sort by any column
- **Pagination** - Configurable page sizes and navigation
- **Row Actions** - Customizable action buttons per row
- **Search Integration** - Works with SearchBar component
- **Multiple Variants** - Light, dark, striped styling options
- **Empty States** - Customizable no-data messages
- **Responsive Design** - Mobile-friendly layouts

### 🚧 Planned Components

#### Card/Panel Components
- Card wrapper with header/body/footer
- Collapsible panels
- Info panels with icons

#### Layout Components
- List components with styling
- Divider/separator components
- Container/wrapper components

#### Advanced Components
- Stepper component (extract from CMS-React)
- Progress indicators
- Loading spinners

## Usage

### Method 1: Script Tag (Current Architecture)

```html
<!-- Include in HTML head -->
<script src="Components/index.js"></script>
<script src="Components/SearchBar.js"></script>

<!-- Use in React components -->
<script>
function MyComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  
  return React.createElement(
    "div", 
    {},
    React.createElement(SearchBar, {
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      placeholder: "Search...",
      size: "md"
    })
  );
}
</script>
```

### Method 2: ES6 Modules (Future)

```javascript
import { SearchBar } from './Components/index.js';

function MyComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  
  return (
    <SearchBar
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
      size="md"
    />
  );
}
```

## Integration Examples

### Replace Existing Search Inputs

**Before (CasesTab):**
```javascript
e("input", {
  type: "text",
  placeholder: "Search cases by MCN, name, status, or date...",
  value: searchTerm,
  onChange: (e) => setSearchTerm(e.target.value),
  className: "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
})
```

**After:**
```javascript
e(SearchBar, {
  value: searchTerm,
  onChange: (e) => setSearchTerm(e.target.value),
  placeholder: "Search cases by MCN, name, status, or date...",
  size: "md"
})
```

### With Fuse.js Integration

```javascript
function PeopleTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchService] = useState(() => 
    new NightingaleSearchService(people, {
      keys: ['name', 'email', 'phone'],
      threshold: 0.3
    })
  );
  
  const results = searchService.search(searchTerm);
  
  return e(
    "div",
    {},
    e(SearchBar, {
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      placeholder: "Search people..."
    }),
    // Render results...
  );
}
```

### Button Usage Examples

```javascript
// Basic button usage
e(Button, {
  children: "Click Me",
  onClick: handleClick,
  variant: "primary",
  size: "md"
})

// Button with icon
e(Button, {
  children: "Save Case",
  onClick: handleSave,
  variant: "success",
  icon: ButtonIcons.save,
  loading: isSaving
})

// Convenience components
e(DangerButton, {
  children: "Delete",
  onClick: handleDelete,
  icon: ButtonIcons.delete,
  size: "sm"
})

// Full width button
e(PrimaryButton, {
  children: "Create New Case",
  onClick: openModal,
  fullWidth: true,
  icon: ButtonIcons.add
})
```

## Design System

### Colors
- Background: `bg-gray-700`
- Border: `border-gray-600`
- Text: `text-white`
- Placeholder: `placeholder-gray-400`
- Focus: `focus:ring-blue-500`

### Sizes
- **Small**: `px-3 py-1.5 text-sm`
- **Medium**: `px-3 py-2 text-base`
- **Large**: `px-4 py-3 text-lg`

### Icons
- Search: Heroicons magnifying glass
- Clear: Heroicons X mark
- Responsive sizing based on component size

## Development Guidelines

### Adding New Components

1. Create component file in `/Components/`
2. Follow React.createElement pattern
3. Use Tailwind CSS classes
4. Support both script-tag and ES6 module usage
5. Add to ComponentRegistry in index.js
6. Create usage examples
7. Update this README

### Styling Conventions

1. Use Tailwind CSS utility classes
2. Follow existing color scheme (gray-700, gray-600, blue-500)
3. Support size variants where appropriate
4. Include focus states and transitions
5. Use consistent spacing (px-3, py-2, etc.)

### Testing

Test components in multiple contexts:
- NightingaleCMS-React.html
- NightingaleCorrespondence.html
- NightingaleReports.html
- Future applications

## File Structure

```
Components/
├── index.js              # Component registry and loader
├── SearchBar.js           # Search input component
├── examples.js            # Usage examples
├── README.md             # This documentation
└── [future components]    # DataTable.js, Modal.js, etc.
```

## Benefits

1. **Consistency** - Uniform look and behavior across applications
2. **Maintainability** - Single source of truth for component updates
3. **Development Speed** - Reusable components reduce duplicate code
4. **Testing** - Centralized component testing
5. **Documentation** - Clear usage patterns and examples
6. **Future-Proof** - Ready for ES6 module transition
