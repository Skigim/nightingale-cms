# GitHub Copilot Instructions - Nightingale CMS

These instructions define how GitHub Copilot should assist with the Nightingale CMS project. The goal is to ensure consistent, high-quality code generation aligned with our conventions, stack, and best practices.

## 🧠 Context

- **Project Type**: Case Management System (CMS) - React-based frontend with component library
- **Language**: JavaScript (ES6+), HTML5, CSS3
- **Framework / Libraries**: React 18, Tailwind CSS, Day.js, Fuse.js, Lodash
- **Architecture**: Component-based, Modular Design System, File-based Data Storage
- **Development Mode**: In-browser Babel transformation for rapid prototyping

## 🎯 Project Overview

Nightingale CMS is a comprehensive case management system for vocational rehabilitation services, featuring:
- **Case Management**: Track applications, statuses, and client information
- **People & Organizations**: Manage contacts and service providers
- **Financial Tracking**: Monitor resources, income, and expenses
- **Reports & Analytics**: Generate insights and summaries
- **Component Library**: Reusable UI components (Button, DataTable, Modal, SearchBar, Badge, FormComponents)

## 🔧 General Guidelines

- Use React functional components with hooks (useState, useEffect, useMemo, useCallback)
- Follow React 18 patterns and createRoot for rendering
- Use React.createElement (aliased as 'e') for component creation
- Implement proper error boundaries for production resilience
- Add comprehensive JSDoc comments for component interfaces
- Use consistent formatting and React best practices
- Prefer readability and maintainability over cleverness
- Always include fallback UI states and loading indicators

## 📁 File Structure

Current project structure to maintain and extend:

```text
CMSWorkspace/
  App/
    Components/          # Reusable UI components
      Button.js          # Primary/Secondary buttons with icons
      DataTable.js       # Sortable, filterable table component
      Modal.js           # Overlay dialogs and forms
      SearchBar.js       # Search input with filtering
      Badge.js           # Status indicators
      FormComponents.js  # Form inputs and validation
      modals/           # Specialized modal components
    js/                 # Core services and utilities
      nightingale.utils.js      # General utilities
      nightingale.parsers.js    # Data parsing and validation
      nightingale.fileservice.js # File I/O operations
      nightingale.search.js     # Search and filtering
      nightingale.dayjs.js      # Date/time utilities
    lib/                # Third-party libraries
    build/              # Build artifacts
    Docs/               # Component documentation
  Data/                 # JSON data files and backups
  Docs/                 # Project documentation
```

## 🧶 Patterns

### ✅ Patterns to Follow

- **Component Design**:
  - Pure functional components with clear prop interfaces
  - Use controlled components for form inputs
  - Implement proper prop validation and default values
  - Include loading states, error states, and empty states
  
- **Data Management**:
  - Use localStorage for persistence with JSON serialization
  - Implement comprehensive data migration and normalization
  - Include data validation and sanitization
  - Use defensive programming for missing or malformed data

- **State Management**:
  - Local state with useState for component-specific data
  - Lift state up to parent components when needed
  - Use useMemo and useCallback for performance optimization
  - Implement proper cleanup in useEffect

- **Error Handling**:
  - Wrap components in ErrorBoundary for graceful failure
  - Use try-catch blocks for async operations
  - Provide meaningful error messages to users
  - Log errors with context for debugging

- **UI/UX**:
  - Use Tailwind CSS for consistent styling
  - Implement responsive design patterns
  - Include proper ARIA attributes for accessibility
  - Use consistent color schemes and spacing

### 🚫 Patterns to Avoid

- Don't use class components unless specifically needed (ErrorBoundary exception)
- Don't mutate state directly; always use setState functions
- Avoid inline styles; use Tailwind CSS classes
- Don't hardcode data; use sample data generation functions
- Don't ignore PropTypes or component validation
- Avoid deep component nesting; prefer composition
- Don't block the UI thread with heavy computations

## 🧪 Testing Guidelines

- Use React testing patterns with proper component isolation
- Test component behavior, not implementation details
- Include tests for user interactions and state changes
- Mock external dependencies and services
- Test error scenarios and edge cases

## 🎨 Component Library Standards

When creating or modifying components:

- **Button**: Support variants (primary, secondary, success, danger), sizes, icons, loading states
- **DataTable**: Include sorting, pagination, filtering, row selection, custom renderers
- **Modal**: Provide header, body, footer slots with proper focus management
- **FormComponents**: Include validation, error display, accessibility attributes
- **SearchBar**: Implement debounced input with filter callbacks

## 🧩 Example Prompts

- `Copilot, create a React component for case status tracking with badge indicators`
- `Copilot, implement a DataTable column renderer for financial amounts with currency formatting`
- `Copilot, generate a modal form for adding new people with validation`
- `Copilot, create a search filter function for the reports view`
- `Copilot, implement data migration logic for legacy case data structures`

## 🔁 Iteration & Review

- All Copilot output should follow React best practices and component patterns
- Code should be reviewed for accessibility and responsive design
- Ensure proper error handling and fallback states
- Test components in isolation before integration
- Validate data structures and migration logic thoroughly

## 📚 References

- [React 18 Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JavaScript Style Guide (Airbnb)](https://github.com/airbnb/javascript)
- [React Patterns and Best Practices](https://react.dev/learn)
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [Day.js Documentation](https://day.js.org/docs/en/installation/installation)
- [Fuse.js Search Library](https://fusejs.io/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Local Storage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)

## 🎯 Project-Specific Context

- **Data Format**: JSON-based with comprehensive migration support
- **Case Types**: VR (Vocational Rehabilitation), LTC (Long-term Care)
- **User Roles**: Case managers, administrators, service providers
- **Browser Support**: Modern browsers with ES6+ support
- **Development**: File-based development with in-browser compilation
- **Production**: Optimized builds with pre-compilation for performance

## 🚀 Development Workflow

1. **Component Development**: Create in Components/ directory with proper exports
2. **Data Operations**: Use nightingale.fileservice.js for persistence
3. **Styling**: Apply Tailwind classes with consistent design system
4. **Testing**: Validate components in main application context
5. **Documentation**: Update component docs and integration guides
6. **Migration**: Ensure backward compatibility with existing data

This project emphasizes rapid development, component reusability, and robust data management for case management workflows.
