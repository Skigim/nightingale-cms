# Nightingale CMS Autosave Service

## Overview

Intelligent automatic saving for the Nightingale CMS with change detection, error recovery, and configurable intervals.

## Features

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
  if (!window.FileSystemService || !fullData) return;

  autosaveServiceRef.current = new window.NightingaleAutosaveService({
    saveInterval: 30000, // Save every 30 seconds
    debounceDelay: 3000, // Wait 3 seconds after changes
    maxRetries: 3, // Retry failed saves 3 times
    enabled: connectionStatus === 'connected',
  });

  autosaveServiceRef.current.initialize({
    fileService: window.FileSystemService,
    dataProvider: () => fullData,
    statusCallback: setAutosaveStatus,
  });

  return () => autosaveServiceRef.current?.destroy();
}, [fullData, connectionStatus]);
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

| Option                   | Default | Description                 |
| ------------------------ | ------- | --------------------------- |
| `saveInterval`           | 30000   | Auto-save interval (ms)     |
| `debounceDelay`          | 2000    | Delay after changes (ms)    |
| `maxRetries`             | 3       | Max retry attempts          |
| `minSaveInterval`        | 5000    | Min time between saves (ms) |
| `enabled`                | true    | Enable/disable autosave     |
| `saveOnVisibilityChange` | true    | Save when switching tabs    |
| `saveOnUnload`           | true    | Save on page unload         |

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
    await window.FileSystemService.writeFile(fullData);
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

## Migration from Manual Save

1. Keep existing manual save as fallback
2. Initialize autosave alongside current system
3. Replace manual save calls with `notifyDataChange()`
4. Update UI to show autosave status
5. Remove manual save UI once autosave is stable
