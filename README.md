# Nightingale CMS - Case Management System

A React 18 + Tailwind CSS case management system with a clean two-layer architecture, robust data
services, and a modern build (Vite).

## 🎯 What it does

- 📋 Case management: full lifecycle tracking with MCN, status, and relationships
- 👥 People & Organizations: contacts and facilities with relationships
- 💰 Financial tracking: resources, income, expenses
- 📊 Reports & correspondence: standalone pages for generation and review
- 🧩 Component library: reusable UI in a presentational layer; business layer composes workflows
- 🔄 Migration tooling: detect → migrate → backup/write for legacy JSON

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Modern browser

### Install and run (recommended)

```bash
npm install
npm run dev
```

Vite will start the dev server. Open the URL it prints (usually http://localhost:5173).

### Build and preview

```bash
npm run build
npm run start:preview
```

### Static HTML entry (optional)

You can open `index.html` directly in a browser for a static demo. For development, prefer the Vite
server to avoid file protocol and module import limitations.

## 🏗️ Architecture

```
src/
├── components/
│   ├── ui/            # Generic presentational components (no business logic)
│   └── business/      # Domain workflows that compose UI + services
├── services/          # ES module services (data, migration, search, etc.)
├── assets/            # Third-party libs (Day.js, Fuse.js) for non-bundled usage
└── pages/             # Standalone HTML pages (reports, correspondence)
```

- ES modules throughout; React 18 render via `createRoot`
- Self-registration via a dedicated registry: `registerComponent('ui'|'business', name, component)`
- Data stored as JSON; persisted via a file service abstraction
- Search powered by `fuse.js`; dates via `dayjs`

## 📚 Components

- UI: Button, Modal, DataTable, SearchBar, Badge, Form inputs, StepperModal
- Business: CaseCreationModal, CaseDetailsView, PeopleTab, OrganizationsTab, SettingsModal

## 💾 Data

Example shape:

```json
{
  "cases": [
    { "id": "case-001", "mcn": "MCN-2025-001", "personId": "person-001", "status": "Pending" }
  ],
  "people": [{ "id": "person-001", "name": "John Doe" }],
  "organizations": [{ "id": "org-001", "name": "Regional Health" }],
  "vrRequests": []
}
```

Persistence:

- JSON files via a file service provider
- Export/Import supported via the Settings modal

## 🔧 Development

### Adding a UI component (modern pattern)

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from './src/services/registry.js';

function NewComponent({ label }) {
  return <div className="p-2 text-white">{label}</div>;
}

NewComponent.propTypes = { label: PropTypes.string };

registerComponent('ui', 'NewComponent', NewComponent);
export default NewComponent;
```

### Using services

```js
import { detectLegacyProfile, runFullMigration } from './src/services/migration.js';
import { getFileService } from './src/services/fileServiceProvider.js';

const fs = getFileService();
const raw = await fs.readFile();
const detection = detectLegacyProfile(raw);
const { migratedData, report } = await runFullMigration(raw, { applyFixes: true });
await fs.writeFile(migratedData);
```

## 🧪 Testing

- Jest + React Testing Library (jsdom)
- Run tests: `npm test`
- Coverage: `npm run test:coverage`

## 📖 Documentation

- Architecture: `docs/Architecture-Context.md`
- Data Migration Guide: `docs/Data-Migration-Guide.md`
- React Best Practices: `docs/react-best-practices.md`
- Toast System: `docs/Toast-System.md`

API references:

- File Service Provider: `src/services/fileServiceProvider.js`
- Search Service: `src/services/nightingale.search.js`
- Autosave: `src/services/README-autosave.md`

## � Deployment

- Build with Vite: `npm run build`
- GitHub Pages supported (see `homepage` in package.json)

## 🔄 Migration UI (in Settings)

1. Connect to your data directory
2. Detect legacy indicators (e.g., `masterCaseNumber → mcn`, numeric IDs)
3. Run full migration (includes fixers, e.g., client name backfill)
4. Download migrated JSON or Write & Backup to `nightingale-data.json`

Errors are logged and surfaced via toasts. If the provider is read-only, use Download and replace
manually.

## 🗺️ Roadmap (highlights)

- Advanced reporting
- Integrity audits (orphan links, invalid IDs)
- Cleanup remaining legacy globals

—

Nightingale CMS — modern, modular case management.
