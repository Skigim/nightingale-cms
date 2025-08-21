# Nightingale CMS Autosave Service

## Overview

The Nightingale Autosave Service provides intelligent automatic saving functionality for the CMS application. It handles periodic saves, data change detection, error recovery, and integrates seamlessly with the existing file service.

## Features

- **Intelligent Saving**: Automatically saves data when changes are detected
- **Configurable Intervals**: Customizable save frequency and debounce timing
- **Change Detection**: Uses data hashing to avoid unnecessary saves
- **Error Recovery**: Automatic retry with exponential backoff
- **Event-Driven**: Saves on visibility changes and page unload
- **Status Reporting**: Comprehensive status and statistics reporting
- **Memory Efficient**: Optimized for long-running sessions

## Quick Start

```javascript
// Initialize the autosave service
const autosaveService = new NightingaleAutosaveService({
  saveInterval: 30000, // Save every 30 seconds
  debounceDelay: 2000, // Wait 2 seconds after last change
  maxRetries: 3, // Retry failed saves up to 3 times
  enabled: true, // Start enabled
});

// Initialize with dependencies
autosaveService.initialize({
  fileService: window.FileSystemService,
  dataProvider: () => window.fullData,
  statusCallback: (status) => {
    console.log('Autosave status:', status);
    // Update UI based on status
  },
});
```

## Configuration Options

| Option                   | Default | Description                             |
| ------------------------ | ------- | --------------------------------------- |
| `saveInterval`           | 30000   | Periodic save interval in milliseconds  |
| `debounceDelay`          | 2000    | Delay after data change before saving   |
| `maxRetries`             | 3       | Maximum retry attempts for failed saves |
| `retryDelayMultiplier`   | 1.5     | Exponential backoff multiplier          |
| `initialRetryDelay`      | 1000    | Initial retry delay in milliseconds     |
| `enabled`                | true    | Enable/disable autosave                 |
| `saveOnVisibilityChange` | true    | Save when tab becomes hidden            |
| `saveOnUnload`           | true    | Save when page is unloading             |
| `minSaveInterval`        | 5000    | Minimum time between saves              |

## API Reference

### Methods

#### `initialize(dependencies)`

Initialize the service with required dependencies.

**Parameters:**

- `dependencies.fileService` - File service for saving data
- `dependencies.dataProvider` - Function that returns current data
- `dependencies.statusCallback` - Optional callback for status updates

#### `start()`

Start the autosave service.

#### `stop()`

Stop the autosave service and clear all timers.

#### `pause()`

Temporarily pause autosave (stops periodic saves but keeps change detection).

#### `resume()`

Resume autosave after pausing.

#### `saveNow(options)`

Trigger an immediate save.

**Parameters:**

- `options.force` - Force save even if no changes detected
- `options.skipThrottle` - Skip minimum save interval check

**Returns:** Promise<boolean> - Save success status

#### `notifyDataChange(changeType)`

Notify the service that data has changed to trigger debounced save.

**Parameters:**

- `changeType` - Optional string describing the type of change

#### `getStatus()`

Get current autosave status and statistics.

**Returns:** Object with status information

#### `updateConfig(newConfig)`

Update autosave configuration at runtime.

#### `destroy()`

Clean up resources and event listeners.

### Status Callback

The status callback receives an object with the following structure:

```javascript
{
  status: 'saving|saved|error|retry-scheduled|...',
  message: 'Human readable status message',
  timestamp: 1234567890,
  data: null, // Additional data if relevant
  statistics: {
    totalSaves: 10,
    successfulSaves: 9,
    failedSaves: 1,
    lastSaveAttempt: 1234567890,
    lastSuccessfulSave: 1234567880,
    averageSaveTime: 156
  }
}
```

## Integration Examples

### Basic Integration

```javascript
// In your main application
let autosaveService;

async function initializeApp() {
  // Initialize autosave service
  autosaveService = new NightingaleAutosaveService({
    saveInterval: 30000,
    debounceDelay: 2000,
  });

  autosaveService.initialize({
    fileService: window.FileSystemService,
    dataProvider: () => window.fullData,
    statusCallback: handleAutosaveStatus,
  });
}

function handleAutosaveStatus(status) {
  // Update UI based on autosave status
  switch (status.status) {
    case 'saving':
      updateSaveIndicator('saving', 'Saving...');
      break;
    case 'saved':
      updateSaveIndicator('saved', 'All changes saved');
      break;
    case 'error':
      updateSaveIndicator('error', `Save failed: ${status.message}`);
      break;
  }
}
```

### React Integration

```javascript
// In your React component
function App() {
  const [autosaveStatus, setAutosaveStatus] = useState(null);
  const autosaveServiceRef = useRef(null);

  useEffect(() => {
    // Initialize autosave service
    autosaveServiceRef.current = new NightingaleAutosaveService();

    autosaveServiceRef.current.initialize({
      fileService: window.FileSystemService,
      dataProvider: () => fullData,
      statusCallback: setAutosaveStatus,
    });

    return () => {
      // Cleanup on unmount
      autosaveServiceRef.current?.destroy();
    };
  }, []);

  // Notify autosave of data changes
  const handleDataUpdate = useCallback((newData, changeType) => {
    setFullData(newData);
    autosaveServiceRef.current?.notifyDataChange(changeType);
  }, []);

  return (
    <div>
      <Header autosaveStatus={autosaveStatus} />
      {/* Rest of your app */}
    </div>
  );
}
```

### Advanced Configuration

```javascript
// Production configuration
const autosaveService = new NightingaleAutosaveService({
  saveInterval: 60000, // Save every minute in production
  debounceDelay: 5000, // Wait 5 seconds after changes
  maxRetries: 5, // More retries for reliability
  minSaveInterval: 10000, // Minimum 10 seconds between saves
  retryDelayMultiplier: 2, // Aggressive backoff
  saveOnVisibilityChange: true, // Always save when switching tabs
  saveOnUnload: true, // Try to save on page exit
});

// Development configuration
const autosaveService = new NightingaleAutosaveService({
  saveInterval: 10000, // More frequent saves for development
  debounceDelay: 1000, // Quick response to changes
  maxRetries: 2, // Fewer retries for faster feedback
  minSaveInterval: 2000, // Allow more frequent saves
});
```

## Status Indicators

The service provides various status updates that can be used to update the UI:

- `initialized` - Service is ready
- `started` - Autosave is active
- `stopped` - Autosave is inactive
- `paused` - Temporarily paused
- `resumed` - Resumed after pause
- `saving` - Save operation in progress
- `saved` - Save completed successfully
- `no-changes` - No changes to save
- `error` - Save operation failed
- `retry-scheduled` - Retry attempt scheduled
- `max-retries` - Maximum retries exceeded
- `config-updated` - Configuration changed

## Best Practices

1. **Initialize Early**: Set up autosave as early as possible in your application lifecycle.

2. **Handle Status Updates**: Always provide a status callback to give users feedback about save operations.

3. **Notify on Changes**: Call `notifyDataChange()` whenever data is modified to trigger intelligent saving.

4. **Configure for Environment**: Use different configurations for development vs production environments.

5. **Clean Up**: Always call `destroy()` when the service is no longer needed.

6. **Monitor Statistics**: Use the statistics provided by `getStatus()` to monitor save performance.

7. **Handle Errors Gracefully**: Implement proper error handling based on status updates.

## Performance Considerations

- The service uses data hashing to detect changes efficiently
- Debouncing prevents excessive save operations during rapid data changes
- Minimum save intervals prevent resource exhaustion
- Memory usage is optimized for long-running sessions
- Event listeners are properly cleaned up to prevent memory leaks

## Browser Compatibility

- Modern browsers with File System Access API support
- Graceful fallback for older browsers
- BroadcastChannel API for cross-tab communication
- Page Visibility API for smart saving

## Troubleshooting

### Common Issues

1. **Service not saving**: Check that `initialize()` was called with valid dependencies
2. **Too frequent saves**: Increase `minSaveInterval` or `debounceDelay`
3. **Save failures**: Check file service connection and disk space
4. **Memory issues**: Ensure `destroy()` is called when cleaning up

### Debug Information

Enable debug logging in the browser console to see detailed autosave operations:

```javascript
// The service automatically logs debug information
// Check browser console for [AutosaveService] messages
```

## Migration from Manual Save

If you're migrating from a manual save system:

1. Keep existing manual save functionality as a fallback
2. Initialize autosave service alongside existing system
3. Gradually transition to using `notifyDataChange()` instead of manual saves
4. Remove manual save UI once autosave is proven stable
5. Monitor statistics to ensure reliable operation
