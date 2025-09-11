# Nightingale CMS - Case Management System

A comprehensive React-based case management system, featuring modern UI components, robust data
management, and streamlined workflows.

## 🎯 Project Overview

Nightingale CMS helps social workers track applications, manage client relationships, monitor
financial resources, and generate reports for and long-term care services.

### Key Features

- **📋 Case Management**: Complete application lifecycle tracking
- **👥 People & Organizations**: Contact and service provider management
- **💰 Financial Tracking**: Resources, income, and expense monitoring
- **📊 Reports & Analytics**: Data insights and summary generation
- **🧩 Component Library**: Reusable UI components with consistent design
- **🔄 Data Migrations**: Backward compatibility with legacy data

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local file system access
- No build tools required (uses in-browser Babel)

### Running the Application

1. **Clone/Download** the project to your local machine
2. **Open** `index.html` in your web browser for the main suite, or use individual pages:
   - Main CMS Suite: `index.html`
   - Main React App: `index.html` (Unified CMS application)
   - Reports: `src/pages/NightingaleReports.html`
   - Correspondence: `src/pages/NightingaleCorrespondence.html`
3. **Create Sample Data** using the "Create Sample Data" button (in legacy app)
4. **Start Managing Cases** with the intuitive interface

### Development Setup

```bash
# Navigate to project directory
cd CMSWorkspace

# Open in VS Code (recommended)
code .

# Serve files with Python (recommended for local development)
python -m http.server 8080

# Or open index.html directly in browser
```

## 🏗️ Architecture

### Component-Based Design

```
src/
├── components/           # Reusable Component Library
│   ├── ui/              # Generic UI components (framework-agnostic)
│   │   ├── Button.js    # Multi-variant button with icons
│   │   ├── DataTable.js # Sortable, filterable tables
│   │   ├── Modal.js     # Overlay dialogs and forms
│   │   ├── SearchBar.js # Search with real-time filtering
│   │   ├── Badge.js     # Status and category indicators
│   │   ├── FormComponents.js # Form inputs with validation
│   │   └── TabBase.js   # Tab component factory
│   └── business/        # Domain-specific CMS components
│       ├── CaseCreationModal.js   # Case creation workflows
│       ├── PersonCreationModal.js # Person management forms
│       ├── OrganizationModal.js   # Organization management
│       └── FinancialItemModal.js  # Financial item management
├── services/            # Core Services & Utilities
│   ├── core.js          # Core application services
│   ├── cms.js           # CMS-specific business logic
│   ├── ui.js            # UI interaction utilities
│   ├── nightingale.fileservice.js    # File I/O operations
│   ├── nightingale.search.js         # Search/filtering logic
│   ├── nightingale.dayjs.js          # Date/time utilities
│   ├── nightingale.autosave.js       # Auto-save functionality
│   └── nightingale.toast.js          # Toast notifications
├── pages/               # Application Pages
│   ├── NightingaleReports.html       # Reports and analytics
│   └── NightingaleCorrespondence.html # Document generation
├── assets/              # Third-party libraries
│   ├── dayjs.min.js     # Date manipulation
│   ├── fuse.min.js      # Fuzzy search
│   └── lodash.min.js    # Utility functions
Data/                    # JSON data files and backups
Docs/                    # Project documentation
index.html              # Main application shell
```

### Technology Stack

- **Frontend**: React 18, HTML5, CSS3
- **Styling**: Tailwind CSS for responsive design
- **Data**: JSON-based with localStorage persistence
- **Date/Time**: Day.js for manipulation and formatting
- **Search**: Fuse.js for fuzzy searching
- **Utilities**: Lodash for data manipulation
- **Development**: In-browser Babel transformation

## 📚 Component Library

### Button Components

- **PrimaryButton**: Main action buttons with icon support
- **SecondaryButton**: Secondary actions and navigation
- **SuccessButton**: Confirmation and save actions
- **DangerButton**: Delete and destructive actions

### Data Components

- **DataTable**: Sortable, paginated tables with custom renderers
- **SearchBar**: Real-time search with debounced input
- **Badge**: Status indicators with variant styling

### Layout Components

- **Modal**: Overlay dialogs with focus management
- **FormComponents**: Input fields with validation and error display

## 💾 Data Management

### Data Structure

```javascript
{
  cases: [
    {
      id: "case-001",
      mcn: "MCN-2025-001",
      personId: "person-001",
      status: "Pending",
      applicationDate: "2025-08-01",
      caseType: "VR",
      // ... additional fields
    }
  ],
  people: [
    {
      id: "person-001",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      status: "active"
      // ... additional fields
    }
  ],
  organizations: [
    {
      id: "org-001",
      name: "Springfield Community Services",
      type: "Non-Profit",
      contactPerson: "Mary Wilson",
      // ... additional fields
    }
  ],
  financials: [...],
  notes: [...],
  vrRequests: [...]
}
```

### Data Persistence

- **Local Storage**: Automatic save/load from browser storage
- **JSON Export/Import**: Backup and restore capabilities
- **Migration System**: Automatic data structure updates
- **Validation**: Schema validation and error handling

## 🔧 Development

### Adding New Components

```javascript
// Create component in src/components/ui/ (generic) or src/components/business/ (domain-specific)
function NewComponent({ prop1, prop2, ...props }) {
  const e = window.React.createElement; // Component-scoped React.createElement
  const [state, setState] = useState(initialValue);

  return e(
    'div',
    { className: 'component-styles', ...props },
    // Component content
  );
}

// Register component
if (typeof window !== 'undefined') {
  window.NewComponent = NewComponent;

  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent('NewComponent', NewComponent);
  }
}
```

### Data Operations

```javascript
// Save data (using modern service pattern)
await window.NightingaleServices.getService('fileService').saveData(data);

// Load data
const data = await window.NightingaleServices.getService('fileService').loadData();

// Search data
const results = window.NightingaleServices.getService('search').searchCases(data.cases, query);

// Legacy compatibility (still works)
await window.NightingaleFileService.saveData(data);
const results = window.NightingaleSearch.searchCases(data.cases, query);
```

### Styling Guidelines

```javascript
// Use Tailwind CSS classes
className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700';

// Responsive design
className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

// Component variants
const variants = {
  primary: 'bg-blue-600 text-white',
  secondary: 'bg-gray-600 text-white',
  success: 'bg-green-600 text-white',
};
```

## 🧪 Testing

### Manual Testing

1. **Component Isolation**: Test each component individually
2. **User Workflows**: Complete case management scenarios
3. **Data Validation**: Test with various data formats
4. **Error Handling**: Verify graceful failure modes

### Browser Testing

- Chrome (recommended for development)
- Firefox
- Safari
- Edge

## 📖 Documentation

### Project Documentation

- [Architecture Context](Docs/Architecture-Context.md) - Current implementation vs future model
- [Service Organization](Docs/Service-Reorganization-Migration-Guide.md) - Service layer
  architecture
- [Data Migration Guide](Docs/Data-Migration-Guide.md) - Legacy data migration procedures
- [Component Analysis](Docs/Tab-Component-Analysis.md) - Component architecture patterns
- [React Best Practices](Docs/react-best-practices.md) - Development guidelines

### API Documentation

- [File Service API](src/services/nightingale.fileservice.js) - File I/O operations
- [Search Service API](src/services/nightingale.search.js) - Search and filtering
- [Autosave Service](src/services/README-autosave.md) - Automatic data saving

## 🚀 Deployment

### Development

- Open `index.html` directly in browser for the main suite
- Uses in-browser Babel compilation for rapid development
- Individual pages can be accessed directly in `src/pages/`

### Production

- Pre-compile with build tools for performance
- Host static files on web server
- Configure proper MIME types for .js files
- Consider using a local server (Python, Node.js, etc.) for development

## 🔄 Migration & Updates

### Data Migration

The system includes automatic data migration for:

- Legacy case data structures
- New field additions
- Schema changes
- Data validation and cleanup

### Migration UI (Recommended)

Use the built-in Migration UI (in Settings) to safely migrate legacy JSON data to the modern schema.

- Open `Settings → Data Migration` in the app.
- Connect to your data directory if prompted (File System Access API).
- Click Detect to see a summary of legacy indicators (e.g., `masterCaseNumber → mcn`, numeric IDs,
  financial field renames).
- Review the report; then choose how to proceed:
  - `Download Migrated JSON`: Exports the transformed data so you can manually replace
    `nightingale-data.json`.
  - `Write & Backup` (recommended):
    - Creates `nightingale-data.backup-<timestamp>.json` in the same folder (if provider supports
      named writes).
    - Writes the migrated data to `nightingale-data.json`.
- On read-only or unsupported providers, prefer `Download Migrated JSON` and replace the file
  manually.
- The migration report includes:
  - `appliedTransforms` (e.g., value→amount, type→description, string ID coercion)
  - `counts.before/after` for cases/people/organizations
  - `fixes.clientNamesAdded`
  - `warnings.orphanCasePersonIds`

Notes:

- Errors are logged via the app logger and surfaced via toasts; no changes are written on failure.
- If data is already modern, you can still re-run fixers (e.g., client name backfill) from Settings.

### Version Updates

- Component library updates
- New feature additions
- Bug fixes and improvements
- Performance optimizations

## 📞 Support

### Development Environment

- VS Code with React extensions recommended
- Browser DevTools for debugging
- React DevTools extension helpful

### Troubleshooting

- Check browser console for errors
- Verify data structure integrity
- Clear localStorage for fresh start
- Review component documentation

## 🎯 Roadmap

### Planned Features

- [ ] Advanced reporting dashboard
- [ ] Multi-user authentication
- [ ] Real-time collaboration
- [ ] Mobile responsive optimization
- [ ] API integration capabilities
- [ ] Advanced search and filtering
- [ ] Document management system

### Performance Improvements

- [ ] Component lazy loading
- [ ] Virtual scrolling for large datasets
- [ ] Optimized re-rendering
- [ ] Bundle size optimization

---

**Nightingale CMS** - Empowering case management with modern web technology.
