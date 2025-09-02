# Nightingale CMS - Legacy Application Suite

> **Note**: This is the `legacy` branch containing the original standalone HTML application suite. For the modern React-based version, see the [`dev`](https://github.com/Skigim/nightingale-cms/tree/dev) branch. This version will only receive updates to correct breaking issues - it is no longer in active development.

## Overview

The Nightingale CMS Legacy Suite is a collection of standalone HTML applications designed for case management, document generation, and administrative tasks in healthcare/eligibility settings. Built with vanilla JavaScript and modern web APIs, these applications provide a complete workflow solution without requiring a server or complex setup.

## Applications Included

### 🏥 Core Case Management
- **`NightingaleCMS.html`** - Primary case management system with client data, financial tracking, and workflow management
- **`NightingaleReports.html`** - Comprehensive reporting and analytics dashboard

### 📄 Document Generation & Communication
- **`NightingaleCorrespondence.html`** - Standalone verification request (VR) generator with template management
- **`ReactCorr.html`** - React-based correspondence system (modern implementation)

### 🔧 Specialized Tools
- **`NightingaleStatements.html`** - Bank statement reviewer and financial document analyzer
- **`nightingalePhoneLog.html`** - Call tracking and communication log management
- **`todo.html`** - Private task management system with React implementation

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, Tailwind CSS
- **Data Storage**: File System Access API with JSON persistence
- **Date Management**: Day.js with plugins (relativeTime, customParseFormat)
- **Search**: Fuse.js for fuzzy searching
- **Styling**: Tailwind CSS via CDN
- **Security**: Content Security Policy headers

### Core Services (`js/` directory)

| Service | Purpose |
|---------|---------|
| `nightingale.utils.js` | Shared utility functions (sanitization, date formatting, validation) |
| `nightingale.fileservice.js` | File System Access API wrapper with persistence |
| `nightingale.dayjs.js` | Enhanced date management and formatting |
| `nightingale.parsers.js` | Data parsing and transformation utilities |
| `nightingale.search.js` | Fuzzy search implementation with Fuse.js |

### Dependencies (`lib/` directory)
- Day.js core and plugins (date manipulation)
- Fuse.js (fuzzy search capabilities)

## Key Features

### 🔐 **Privacy-First Design**
- **Local-Only**: All data stays on the user's device
- **No Server Required**: Completely client-side applications
- **File System Integration**: Direct file access without uploads

### 🚀 **Modern Web APIs**
- **File System Access API**: Direct file/folder access in supported browsers
- **IndexedDB**: Persistent storage for directory handles
- **Broadcast Channel**: Cross-tab communication
- **Content Security Policy**: Security hardening

### 📱 **Responsive Design**
- Mobile-friendly interfaces
- Dark mode support (where implemented)
- Accessibility considerations

### 🔄 **Data Management**
- JSON-based data persistence
- Automatic backup and recovery
- Cross-application data sharing
- Multi-tab coordination

## Browser Compatibility

### Fully Supported
- **Chrome/Edge 86+** (File System Access API support)
- **Firefox 90+** (with feature flags)
- **Safari 15.2+** (partial File System Access API)

### Graceful Degradation
- Fallback file download/upload for unsupported browsers
- Progressive enhancement approach

## Getting Started

### Prerequisites
- Modern web browser with File System Access API support
- Local web server (for development) or direct file access

### Quick Start
1. Clone or download the legacy branch
2. Navigate to the `App/` directory
3. Open any HTML file in a supported browser
4. Grant file system permissions when prompted
5. Select a working directory for data storage

### Recommended Setup
```bash
# Serve locally (recommended for development)
python -m http.server 8000
# or
npx serve App/

# Then navigate to:
http://localhost:8000/NightingaleCMS.html
```

## Deploying to GitHub Pages (Static Hosting)

The legacy suite is pure static assets, so it can be hosted directly from the repository without a build step while preserving its local‑only security model.

### Branch & Directory Strategy
You have two common options:
1. Use the `main` (or `legacy`) branch and set the Pages source to the root. Assets live under `App/` so the main application URL will be:
```
https://<username>.github.io/nightingale-cms/App/NightingaleCMS.html
```
2. Or create a `gh-pages` branch that contains only the `App/` directory contents at the root (optional if you want a shorter URL).

### Added Deployment Artifacts
| File | Purpose |
|------|---------|
| `App/index.html` | Lightweight redirect to `NightingaleCMS.html` so you can link to `/App/` root. |
| `App/404.html` | Fallback page required by GitHub Pages (also provides a link back to the app). |

### Security Preservation
The File System Access API already enforces:
- Secure context (HTTPS) – GitHub Pages supplies this automatically.
- Explicit user permission for directory handles.

Enhancements included in this branch:
- `FileSystemService.isSupported()` now checks `window.isSecureContext` and provides clearer guidance if opened via an insecure context or unsupported browser.

### Limitations on GitHub Pages
- No service workers or server APIs required/used, so no additional config needed.
- The File System Access API won’t work in browsers that block it (e.g., some mobile browsers or Firefox without flags). Users will see a friendly error.

### Quick Deployment Steps
1. Merge this branch (with the new `App/index.html` and `App/404.html`) into `main` if desired.
2. In the GitHub repository settings, enable Pages and select the branch (`main`) and root (`/`).
3. After Pages builds, visit: `https://<username>.github.io/nightingale-cms/App/` (redirects to the main app).
4. Bookmark `NightingaleCMS.html` for direct access.

### Optional: Custom Domain
Add a `CNAME` file at the repository root (or configure via Settings) containing your domain; GitHub Pages will still serve over HTTPS, satisfying the API’s secure-context requirement.

### Offline / Local Usage Still Recommended
While Pages hosting is convenient for distribution, users handling sensitive data may prefer local offline usage to reduce any theoretical attack surface (even though no data leaves the browser). Provide instructions for cloning and opening locally for high‑sensitivity environments.


## Application Workflows

### Case Management Workflow
1. **NightingaleCMS.html** - Create and manage cases
2. **NightingaleCorrespondence.html** - Generate verification requests
3. **NightingaleStatements.html** - Review financial documents
4. **NightingaleReports.html** - Generate compliance reports

### Data Flow
```
Directory Selection → JSON File Creation → Cross-App Data Sharing → Report Generation
```

## File Structure
```
App/
├── NightingaleCMS.html          # Primary case management
├── NightingaleCorrespondence.html # VR generation
├── NightingaleReports.html      # Reporting dashboard
├── NightingaleStatements.html   # Statement reviewer
├── ReactCorr.html               # React correspondence
├── nightingalePhoneLog.html     # Call tracking
├── todo.html                    # Task management
├── js/                          # Core services
│   ├── nightingale.utils.js
│   ├── nightingale.fileservice.js
│   ├── nightingale.dayjs.js
│   ├── nightingale.parsers.js
│   └── nightingale.search.js
└── lib/                         # External dependencies
    ├── dayjs.min.js
    ├── dayjs-relativeTime.min.js
    ├── dayjs-customParseFormat.min.js
    └── fuse.min.js
```

## Security Features
- Content Security Policy (CSP) implementation
- HTML sanitization for user inputs
- Local-only data processing
- No external data transmission

## Development Notes

### Legacy Considerations
- **Script-based Architecture**: Uses global namespace and script tags
- **Inline Styling**: CSS embedded in HTML files
- **CDN Dependencies**: External libraries loaded via CDN
- **Browser-Specific Features**: Relies on modern browser APIs

### Migration Path
This legacy codebase serves as the foundation for the modern React-based implementation in the `dev` branch, which features:
- ES6 modules and modern bundling
- React component architecture
- Improved state management
- Enhanced error handling and logging

## Support & Documentation

### Known Limitations
- Requires modern browser with File System Access API
- Limited offline functionality
- Single-user design (no collaboration features)

### Troubleshooting
- Ensure File System Access API is enabled in browser
- Grant necessary permissions for file access
- Use local server for development (avoid file:// protocol)

---

**Legacy Branch**: This codebase represents the stable, production-ready legacy implementation. For new development and modern features, see the [`dev`](https://github.com/Skigim/nightingale-cms/tree/dev) branch.
