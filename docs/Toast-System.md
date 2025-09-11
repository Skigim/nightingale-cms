# Nightingale Toast System Documentation

## Overview

The Nightingale Toast System provides a comprehensive, centralized notification system for all
Nightingale applications. It replaces the multiple duplicate `showToast` implementations with a
single, feature-rich system.

## Features

- **Centralized Management**: Single source of truth for all toast notifications
- **Multiple Types**: Success, Error, Warning, and Info toasts with distinct styling
- **Queue Management**: Automatic handling of multiple toasts with configurable limits
- **Interactive Controls**: Click-to-dismiss and hover-to-pause functionality
- **Customizable Duration**: Per-toast or global duration settings
- **Smooth Animations**: CSS transitions with proper show/hide animations
- **Auto-cleanup**: Automatic DOM cleanup and memory management
- **Responsive Design**: Consistent with Nightingale's Tailwind CSS styling

## Installation

### For HTML Files

```html
<!-- Include the toast system script -->
<script src="js/nightingale.toast.js"></script>
```

### For React Components

```javascript
// Import in your component files
import { showToast, showSuccessToast, showErrorToast } from '../js/nightingale.toast.js';

// Or use the global functions (auto-available after script load)
// window.showToast, window.showSuccessToast, etc.
```

## Basic Usage

### Simple Toast

```javascript
showToast('Hello World!', 'success');
```

### Type-Specific Functions

```javascript
showSuccessToast('Operation completed successfully!');
showErrorToast('Something went wrong!');
showWarningToast('Please be careful!');
showInfoToast('Here is some information.');
```

### Custom Duration

```javascript
showToast('Quick message', 'info', 1000); // 1 second
showSuccessToast('Long message', 5000); // 5 seconds
```

## API Reference

### Main Functions

#### `showToast(message, type, duration)`

- **message** (string): Text to display
- **type** (string): 'success', 'error', 'warning', 'info' (default: 'info')
- **duration** (number): Duration in milliseconds (default: 3000)
- **Returns**: Toast data object or null

#### Type-Specific Functions

- `showSuccessToast(message, duration)`
- `showErrorToast(message, duration)`
- `showWarningToast(message, duration)`
- `showInfoToast(message, duration)`

### Utility Functions

#### `clearAllToasts()`

Immediately removes all active toasts.

#### `getActiveToastCount()`

Returns the number of currently active toasts.

#### `updateToastConfig(newConfig)`

Updates the global toast configuration.

### Configuration Options

```javascript
// Example configuration update
updateToastConfig({
  defaultDuration: 5000, // 5 seconds default
  maxToasts: 3, // Max 3 toasts at once
  animationDelay: 50, // 50ms animation delay
});
```

## Migration Guide

### From Duplicate Implementations

**Before (multiple files with duplicate code):**

```javascript
// In Modal.js
const showToast = (message, type = 'info') => {
  console.log(`Toast: ${type.toUpperCase()} - ${message}`);
};

// In todo.html
function showToast(message, type = 'success') {
  // 20+ lines of DOM manipulation
}
```

**After (centralized system):**

```javascript
// Remove duplicate implementations
// Import or use global function
showSuccessToast('Operation completed!');
```

### HTML File Updates

1. **Remove existing showToast functions**
2. **Include the centralized script**:
   ```html
   <script src="js/nightingale.toast.js"></script>
   ```
3. **Update function calls** (API is backward compatible)

### React Component Updates

1. **Remove duplicate showToast declarations**
2. **Import functions**:
   ```javascript
   import { showToast } from '../js/nightingale.toast.js';
   ```
3. **Use imported functions** in your components

## Advanced Usage

### Custom Styling

The toast system uses Tailwind CSS classes. You can customize the appearance by updating the
configuration:

```javascript
updateToastConfig({
  types: {
    success: 'bg-green-600 border border-green-500',
    error: 'bg-red-600 border border-red-500',
    warning: 'bg-yellow-600 border border-yellow-500',
    info: 'bg-blue-600 border border-blue-500',
  },
});
```

### Toast Queue Management

```javascript
// Check if toasts are queued
if (getActiveToastCount() >= 5) {
  console.log('Toast queue is full');
}

// Clear all before showing important message
clearAllToasts();
showErrorToast('Critical system error!');
```

### Integration with Form Validation

```javascript
// In form components
const handleSubmit = async (formData) => {
  try {
    await submitForm(formData);
    showSuccessToast('Form submitted successfully!');
  } catch (error) {
    showErrorToast(`Submission failed: ${error.message}`);
  }
};
```

## Browser Support

- Modern browsers with ES6+ support
- CSS transitions and transform support
- DOM manipulation APIs

## Dependencies

- **Tailwind CSS**: For styling classes
- **Modern JavaScript**: ES6+ features used

## Testing

A test file is available at `App/test-toast.html` to verify the system functionality:

```bash
# Open in browser to test all features
open App/test-toast.html
```

## Troubleshooting

### Toast Container Missing

The system automatically creates the container if missing. Ensure your page doesn't prevent DOM
modifications.

### Styles Not Applied

Verify Tailwind CSS is loaded and the auto-injected CSS is not blocked.

### Function Not Found

Check that the script is loaded before use:

```javascript
if (typeof showToast === 'function') {
  showToast('Script loaded successfully!');
}
```

## Performance Considerations

- **Memory Management**: Automatic cleanup prevents memory leaks
- **DOM Efficiency**: Minimal DOM manipulation with event delegation
- **Animation Performance**: CSS transitions for smooth performance
- **Queue Limits**: Prevents UI overload with toast limits

## Future Enhancements

- Sound notifications
- Position customization (top, bottom, left, right)
- Rich content support (HTML messages)
- Persistent toasts (manual dismiss only)
- Toast history/log
- Accessibility improvements (screen reader support)

---

## Questions or Issues?

For implementation questions or bug reports, check the existing toast implementations in the HTML
files for reference patterns, or refer to the test file for working examples.
