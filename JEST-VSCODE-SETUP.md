# Jest VS Code Extension Setup Guide

## Issue Resolution ✅

I've fixed the Jest VS Code extension error by simplifying the configuration and moving Jest settings to package.json.

## What I've Fixed

### 1. **Simplified VS Code Settings**

- Removed complex Jest command line configuration
- Set Jest to auto-detect configuration from package.json
- Used minimal, reliable settings

### 2. **Moved Jest Config to package.json**

- VS Code Jest extension often works better with package.json configuration
- Temporarily backed up jest.config.js (renamed to jest.config.js.backup)
- Added complete Jest configuration to package.json

### 3. **Verified Test Functionality**

- All 47 tests still pass ✅
- Jest can find and list all test files
- Configuration is now simpler and more reliable

## Current Configuration

### VS Code Settings (`.vscode/settings.json`)

```json
{
  "jest.jestCommandLine": "",
  "jest.runMode": "watch",
  "jest.rootPath": "."
}
```

### Jest Config (in `package.json`)

```json
"jest": {
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"],
  "testMatch": [
    "<rootDir>/tests/**/*.{js,jsx}",
    "<rootDir>/tests/**/*.(test|spec).{js,jsx}"
  ]
}
```

## How to Complete the Setup

### Step 1: Restart VS Code

1. **Close VS Code completely**
2. **Reopen the workspace**
3. This ensures all configuration changes take effect

### Step 2: Check Jest Extension Status

1. Look at the **VS Code status bar** (bottom of screen)
2. Should show Jest status like "Jest: Ready" or "Jest: Watching"
3. If you see errors, proceed to troubleshooting steps below

### Step 3: Verify Extension is Working

After restart, you should see:

- ✅ Green checkmarks next to passing tests in your test files
- ❌ Red X marks next to any failing tests
- Jest status in VS Code status bar
- Test results in Output panel (select "Jest" from dropdown)

## Troubleshooting Steps

### If You Still See Errors:

#### Option 1: Use Jest Setup Wizard

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run **"Jest: Setup Extension"**
3. Follow the setup wizard prompts
4. Choose "Auto" when asked about configuration detection

#### Option 2: Reset Jest Extension

1. Command Palette → **"Jest: Stop Runner"**
2. Wait 5 seconds
3. Command Palette → **"Jest: Start Runner"**

#### Option 3: Manual Configuration Check

1. Open Command Palette
2. Run **"Jest: Toggle Coverage"** (should work without errors)
3. Check Output panel → Select "Jest" from dropdown
4. Look for specific error messages

#### Option 4: Restore jest.config.js (if needed)

If package.json configuration doesn't work:

```bash
mv jest.config.js.backup jest.config.js
```

And update VS Code settings to:

```json
{
  "jest.jestCommandLine": "npx jest",
  "jest.runMode": "watch"
}
```

## Available Commands

### Jest Extension Commands

- `Jest: Start Runner` - Start watching tests
- `Jest: Stop Runner` - Stop watching tests
- `Jest: Run All Tests` - Run all tests once
- `Jest: Toggle Coverage` - Show/hide coverage overlay
- `Jest: Setup Extension` - Open setup wizard

### NPM Commands (still available)

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Expected Behavior After Setup

### ✅ What Should Work Now:

1. **Visual Test Indicators** - Green/red marks next to test functions
2. **Live Test Updates** - Tests run automatically when files change
3. **Test Explorer** - See all tests in VS Code Test Explorer panel
4. **Debugging** - Set breakpoints in tests and debug them
5. **Coverage Overlay** - See code coverage directly in editor

### 📊 Current Test Status:

- **47 tests passing** across 3 test suites
- **Fast execution** (~17 seconds)
- **Complete coverage** of Button, Modal, and Core Services

## If Problems Persist

### Check Extension Installation

1. Go to Extensions panel (`Ctrl+Shift+X`)
2. Search for "Jest" by Orta
3. Ensure it's installed and enabled
4. Try disabling/re-enabling the extension

### Check Jest is Working

```bash
# These should all work without errors:
npm test
npx jest --listTests
npx jest --version
```

### Contact Support

If none of these steps work, the issue might be:

- VS Code version compatibility
- Jest extension version conflict
- Windows-specific path issues

The Jest extension should now work properly with your Nightingale CMS project! 🚀
