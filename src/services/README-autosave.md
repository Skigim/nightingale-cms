# Nightingale CMS Autosave Service v2.0

## Overview

Intelligent automatic saving for the Nightingale CMS with enhanced permission awareness, multi-tab coordination, and production-grade error handling.

## Key Features

### v2.0 Enhancements ✨

- **Permission Awareness**: Real-time directory permission monitoring
- **Multi-Tab Coordination**: Cross-tab communication prevents save conflicts
- **Enhanced Error Classification**: Structured error types with appropriate responses
- **Configuration Persistence**: Settings survive browser sessions
- **Advanced Statistics**: Comprehensive performance and reliability tracking

### Core Features

- **Smart Saving**: Only saves when data actually changes (uses hashing)
- **Configurable**: Customizable save intervals and debounce timing
- **Resilient**: Automatic retry with exponential backoff on errors
- **Event-Driven**: Saves on tab switching and page unload
- **Status Reporting**: Real-time status updates for UI integration

## Quick Integration

### 1. Load the Service

```html
<!-- Add after other Nightingale services -->
<script src="js/services/nightingale.autosave.js"></script>
```

### 2. Initialize in Your App

```javascript
// In your main React component
const autosaveServiceRef = useRef(null);
const [autosaveStatus, setAutosaveStatus] = useState(null);

useEffect(() => {
  if (!window.AutosaveFileService || !fullData) return;

  autosaveServiceRef.current = new window.AutosaveFileService({
    saveInterval: 30000, // Save every 30 seconds
    debounceDelay: 3000, // Wait 3 seconds after changes
    maxRetries: 3, // Retry failed saves 3 times
    enabled: fileStatus === 'connected',
  });

  autosaveServiceRef.current.initialize({
    fileService: window.AutosaveFileService,
    dataProvider: () => fullData,
    statusCallback: setAutosaveStatus,
  });

  return () => autosaveServiceRef.current?.destroy();
}, [fullData, fileStatus]);
```

### 3. Notify on Data Changes

```javascript
const handleDataUpdate = useCallback((newData, changeType) => {
  setFullData(newData);
  setIsDirty(true);

  // Notify autosave service
  autosaveServiceRef.current?.notifyDataChange(changeType);
}, []);
```

### 4. Enhanced Header with Autosave Status

```javascript
// Add autosave indicator to your header
{
  autosaveStatus && (
    <div className="flex items-center space-x-1" title={autosaveStatus.message}>
      <svg
        className={`h-3 w-3 ${
          autosaveStatus.status === 'saving'
            ? 'animate-spin text-blue-400'
            : autosaveStatus.status === 'saved'
              ? 'text-green-400'
              : autosaveStatus.status === 'error'
                ? 'text-red-400'
                : 'text-gray-400'
        }`}
      >
        {/* Appropriate icon based on status */}
      </svg>
      <span className="text-xs text-gray-400">Auto</span>
    </div>
  );
}
```

## Configuration Options

| Option                    | Default | Description                         |
| ------------------------- | ------- | ----------------------------------- |
| `saveInterval`            | 30000   | Auto-save interval (ms)             |
| `debounceDelay`           | 2000    | Delay after changes (ms)            |
| `maxRetries`              | 3       | Max retry attempts                  |
| `minSaveInterval`         | 5000    | Min time between saves (ms)         |
| `enabled`                 | true    | Enable/disable autosave             |
| `saveOnVisibilityChange`  | true    | Save when switching tabs            |
| `saveOnUnload`            | true    | Save on page unload                 |
| `retryDelay`              | 1000    | Initial retry delay (ms) **v2.0**   |
| `maxRetryDelay`           | 30000   | Maximum retry delay (ms) **v2.0**   |
| `permissionCheckInterval` | 60000   | Permission check frequency **v2.0** |

## Enhanced Error Handling (v2.0)

The service now includes structured error classification:

```javascript
ERROR_TYPES = {
  PERMISSION_DENIED: 'permission_denied',
  QUOTA_EXCEEDED: 'quota_exceeded',
  NETWORK_ERROR: 'network_error',
  DATA_ERROR: 'data_error',
  WRITE_ERROR: 'write_error',
  UNKNOWN: 'unknown',
};
```

Different error types trigger appropriate retry strategies:

- **Permission errors**: Check permissions before retry, disable after 3 failures
- **Quota errors**: Longer delays, user notification
- **Network errors**: Standard exponential backoff
- **Data errors**: Immediate failure, no retry

## API Methods

- `initialize(dependencies)` - Set up with file service and data provider
- `start()` / `stop()` - Control autosave operation
- `saveNow(options)` - Force immediate save
- `notifyDataChange(type)` - Trigger debounced save
- `getStatus()` - Get current status and statistics
- `updateConfig(config)` - Update settings at runtime
- `destroy()` - Clean up resources

## Status Types

The service reports these status types via the status callback:

- `saving` - Save in progress
- `saved` - Save completed successfully
- `error` - Save failed (with retry)
- `retry-scheduled` - Retry attempt scheduled
- `no-changes` - No changes detected
- `max-retries` - All retries exhausted
- `permission-denied` - Directory access denied **v2.0**
- `permission-restored` - Directory access restored **v2.0**

## Multi-Tab Coordination (v2.0)

The service coordinates saves across browser tabs using BroadcastChannel:

```javascript
// Automatic coordination - no configuration needed
// Service prevents simultaneous saves from multiple tabs
// Shared statistics and error states across tabs
// Cross-tab notifications for save events
```

## Integration Examples

### Data Update Pattern

```javascript
// When creating/updating data
function createFinancialItem(itemData, handleDataUpdate) {
  const updatedData = {
    ...fullData,
    cases: fullData.cases.map((c) =>
      c.id === caseId
        ? { ...c, financials: { ...c.financials, [type]: [...items, newItem] } }
        : c
    ),
  };

  handleDataUpdate(updatedData, 'financial-item-created');
}
```

### Manual Save Fallback

```javascript
const handleManualSave = async () => {
  if (autosaveServiceRef.current) {
    // Use autosave service for immediate save
    const success = await autosaveServiceRef.current.saveNow({ force: true });
    if (!success) showToast('Save failed', 'error');
  } else {
    // Fallback to direct file service
    await window.AutosaveFileService.writeFile(fullData);
  }
};
```

### Settings Panel Integration

```javascript
// Autosave configuration in settings
<div className="space-y-4">
  <h3>Autosave Settings</h3>

  {/* Status display */}
  <div>
    Status: {autosaveService?.state?.isEnabled ? 'Enabled' : 'Disabled'}
  </div>
  <div>Last Save: {new Date(stats.lastSuccessfulSave).toLocaleString()}</div>
  <div>
    Success Rate: {Math.round((stats.successfulSaves / stats.totalSaves) * 100)}
    %
  </div>

  {/* Configuration controls */}
  <input
    type="checkbox"
    checked={config.enabled}
    onChange={(e) =>
      autosaveService.updateConfig({ enabled: e.target.checked })
    }
  />

  <input
    type="number"
    value={config.saveInterval / 1000}
    onChange={(e) =>
      autosaveService.updateConfig({ saveInterval: e.target.value * 1000 })
    }
  />
</div>
```

## Best Practices

1. **Initialize Early**: Set up autosave as soon as dependencies are available
2. **Notify Changes**: Always call `notifyDataChange()` when data is modified
3. **Handle Status**: Provide user feedback based on status updates
4. **Configure by Environment**: Use different settings for dev vs production
5. **Clean Up**: Call `destroy()` when the component unmounts
6. **Monitor Performance**: Use statistics to track save success rates
7. **Handle Permissions**: Monitor permission status for directory access **v2.0**
8. **Multi-Tab Awareness**: Service automatically coordinates across tabs **v2.0**

## v2.0 Migration Notes

The v2.0 service is backward compatible with v1.0 integrations. New features are opt-in:

- **Permission monitoring**: Automatic when AutosaveFileService supports `checkPermission()`
- **Multi-tab coordination**: Automatic via BroadcastChannel
- **Enhanced statistics**: Available in status callback
- **Error classification**: Provides more detailed error information

No breaking changes to existing API or integration patterns.
