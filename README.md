# Nightingale CMS - Case Management System

A comprehensive React-based case management system, featuring modern UI components, robust data management, and streamlined workflows.

## 🎯 Project Overview

Nightingale CMS helps social workers track applications, manage client relationships, monitor financial resources, and generate reports for and long-term care services.

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
2. **Open** `App/NightingaleCMS-React.html` in your web browser 
3. **Create Sample Data** using the "Create Sample Data" button 
4. **Start Managing Cases** with the intuitive interface 

### Development Setup

```bash
# Navigate to project directory
cd CMSWorkspace

# Open in VS Code (recommended)
code .

# Or open App/NightingaleCMS-React.html directly in browser
```

## 🏗️ Architecture

### Component-Based Design

```
App/
├── Components/           # Reusable UI Component Library
│   ├── Button.js        # Multi-variant button with icons
│   ├── DataTable.js     # Sortable, filterable tables
│   ├── Modal.js         # Overlay dialogs and forms
│   ├── SearchBar.js     # Search with real-time filtering
│   ├── Badge.js         # Status and category indicators
│   ├── FormComponents.js # Form inputs with validation
│   └── modals/          # Specialized modal components
├── js/                  # Core Services & Utilities
│   ├── nightingale.utils.js      # General utilities
│   ├── nightingale.parsers.js    # Data parsing/validation
│   ├── nightingale.fileservice.js # File I/O operations  
│   ├── nightingale.search.js     # Search/filtering logic
│   └── nightingale.dayjs.js      # Date/time utilities
├── lib/                 # Third-party libraries
├── build/               # Build artifacts and distributions
└── Docs/                # Component documentation
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
// Create component in Components/
function NewComponent({ prop1, prop2, ...props }) {
  const [state, setState] = useState(initialValue);
  
  return e(
    "div",
    { className: "component-styles", ...props },
    // Component content
  );
}

// Export for use
window.NewComponent = NewComponent;
```

### Data Operations

```javascript
// Save data
await window.NightingaleFileService.saveData(data);

// Load data  
const data = await window.NightingaleFileService.loadData();

// Search data
const results = window.NightingaleSearch.searchCases(data.cases, query);
```

### Styling Guidelines

```javascript
// Use Tailwind CSS classes
className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"

// Responsive design
className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Component variants
const variants = {
  primary: "bg-blue-600 text-white",
  secondary: "bg-gray-600 text-white", 
  success: "bg-green-600 text-white"
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

### Component Documentation
- [Button Integration Guide](App/Components/Docs/Button-Integration.md)
- [DataTable Integration Guide](App/Components/Docs/DataTable-Integration.md) 
- [Modal Usage Examples](App/Components/Docs/Modal-Examples.md)

### API Documentation
- [File Service API](App/js/README.md)
- [Search Service API](App/js/nightingale.search.js)
- [Utility Functions](App/js/nightingale.utils.js)

## 🚀 Deployment

### Development
- Open `App/NightingaleCMS-React.html` directly in browser
- Uses in-browser Babel compilation for rapid development

### Production
- Pre-compile with build tools for performance
- Host static files on web server
- Configure proper MIME types for .js files

## 🔄 Migration & Updates

### Data Migration
The system includes automatic data migration for:
- Legacy case data structures
- New field additions
- Schema changes
- Data validation and cleanup

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
