# Nightingale CMS Architecture Context

## Current Implementation Status (September 2025)

This document provides an up-to-date view of the Nightingale CMS architecture, reflecting the
current ES6 module system, two-layer component architecture, and modern React implementation.

---

## 🏗️ Architecture Overview

### **ES6 Module System + Vite** ✅

**Main Entry Point:** `src/main.js`

- Proper ES6 imports with dependency ordering
- Service registration and global compatibility
- React 18 with createRoot initialization
- External library management (Day.js, Fuse.js)
- Vite dev server and build pipeline; GitHub Pages deployment (base path configured)

**Directory Structure:**

```
src/
├── components/
│   ├── ui/              # Generic UI components
│   └── business/        # Domain-specific components
├── services/            # Core utilities and services
├── assets/             # External libraries
└── pages/              # Standalone pages
```

### **Two-Layer Component Architecture** ✅

**UI Layer** (`src/components/ui/`):

- Framework-agnostic, reusable presentation components
- Button, Modal, DataTable, SearchBar, FormComponents
- Preferred modern React + JSX; legacy `React.createElement` only in migration-pending files
- Self-registration into UI registry for backward compatibility

**Business Layer** (`src/components/business/`):

- Domain-specific CMS workflows and logic
- CaseCreationModal, PersonCreationModal, tab components
- Uses UI components as building blocks
- Implements Nightingale business validation
- Orchestrates services (normalization, migration, persistence)

---

## 📊 Data Schema Status

### Current Data Structure (`Data/nightingale-data.json`)

```json
{
  "cases": [...],
  "people": [...],
  "organizations": [...],
  "vrRequests": [...]  // Recently added
}
```

**✅ Fully Implemented:**

- Complete case management system with MCN tracking
- Person management with relationships and living arrangements
- Organization management with facility data
- Financial tracking (resources, income, expenses)
- Verification request system (recently added)

**🔄 Recently Updated (August 2025):** **🔄 Recently Updated (September 2025):**

- Vite build + GitHub Pages deployment workflow (lint → test → build → deploy)
- Custom ESLint internal rule to prevent suppressing PropTypes checks
- Search refactor: direct Fuse.js usage (no global constructor dependency)
- Normalization enhancements: string IDs, MCN cleanup, person.name derivation, case.clientName
  backfill
- One-time data fixers and migration orchestration service added

---

## 🧑‍💼 Person Management Implementation

### ✅ **Fully Implemented**

**Core Identity:**

- ✅ `name` (full name field; derived from first/last if missing)
- ✅ `dateOfBirth` with date picker
- ✅ `ssn` with masking
- ✅ `id` (auto-generated)

**Contact Information:**

- ✅ `phone` with formatting
- ✅ `email` with validation
- ✅ `address` (street, city, state, zip)
- ✅ `mailingAddress` with same-as-physical option

**Status & Relationships:**

- ✅ `livingArrangement` (Apartment/House, Assisted Living, Nursing Home, etc.)
- ✅ `organizationId` (linked facility)
- ✅ `familyMembers` (array of person IDs)
- ✅ `authorizedRepIds` (array of person IDs)

**User Interface:**

- ✅ PersonCreationModal with comprehensive form
- ✅ PersonDetailsModal with tabbed interface
- ✅ SearchBar integration for relationship management
- ✅ DataTable with sorting and filtering

---

## 🏢 Organization Management Implementation

### ✅ **Fully Implemented**

**Core Data:**

- ✅ `name` (organization name)
- ✅ `type` (Assisted Living, Nursing Home, Hospital, etc.)
- ✅ `address` (full address object)
- ✅ `phone` with formatting
- ✅ `id` (auto-generated)

**User Interface:**

- ✅ OrganizationModal for CRUD operations
- ✅ DataTable with organization listing
- ✅ Integration with case creation workflow

---

## 📋 Case Management Implementation

### ✅ **Fully Implemented**

**Application Data:**

- ✅ `mcn` (Master Case Number)
- ✅ `applicationDate` with date picker
- ✅ `caseType` (LTC, Waiver, SIMP)
- ✅ `priority` flag
- ✅ `retroRequested` (Yes/No)
- ✅ `status` (Active, Pending, Closed, etc.)

**Relationships:**

- ✅ `personId` (primary client; foreign key to people)
- ✅ `spouseId` (for SIMP cases)
- ✅ `organizationId` (linked facility)
- ✅ `authorizedReps` (array of person IDs)

**Financial Management:**

- ✅ `financials.resources` (vehicles, bank accounts, etc.)
- ✅ `financials.income` (SSA, pension, wages)
- ✅ `financials.expenses` (rent, utilities, medical)
- ✅ Full CRUD operations with validation

**User Interface:**

- ✅ CaseCreationModal with multi-step wizard
- ✅ CaseDetailsView with comprehensive display
- ✅ Financial item management with modals
- ✅ SearchBar integration for client selection
- ✅ Grid rendering uses denormalized `clientName` for performance/stability

---

## 🔍 Verification System Implementation

### ✅ **Recently Added**

**VR Requests:**

- ✅ `vrRequests` array in data structure
- ✅ Verification tracking with due dates
- ✅ Status management (Pending, Received, Overdue)
- ✅ Source and description tracking

---

## 🧩 Service Layer Implementation

### ✅ **Core Services**

**Data Management:**

- ✅ `core.js` - Security, validation, formatting utilities
- ✅ `nightingale.datamanagement.js` - Data operations and persistence (includes normalization
  pipeline)
- ✅ `nightingale.autosavefile.js` - Auto-save functionality
- ✅ `nightingale.search.js` - Fuse.js integration (now instantiated directly where needed)

**Migration & Fixers:**

- ✅ `migration.js` - Detect legacy profiles and orchestrate full migration (normalize + fixers +
  report)
- ✅ `dataFixes.js` - One-time corrective scripts (e.g., backfill missing `case.clientName` from
  person)

**UI Services:**

- ✅ `ui.js` - UI utilities and helpers
- ✅ `nightingale.toast.js` - Notification system
- ✅ `nightingale.clipboard.js` - Clipboard operations

**Business Services:**

- ✅ `cms.js` - CMS-specific utilities
- ✅ `nightingale.logger.js` - Comprehensive logging
- ✅ `nightingale.parsers.js` - Data parsing and validation

---

## 🧱 Component Library Status

### ✅ **UI Components (Complete)**

**Form Components:**

- ✅ Button (8 variants, icon support, loading states)
- ✅ FormComponents (TextInput, Select, DateInput, etc.)
- ✅ SearchBar (dropdown, keyboard navigation)

**Layout Components:**

- ✅ Modal (basic, confirmation, form variants)
- ✅ StepperModal (multi-step workflows)
- ✅ DataTable (sorting, filtering, pagination)
- ✅ Badge (status indicators)

**Navigation:**

- ✅ Header (application header)
- ✅ Sidebar (navigation sidebar)
- ✅ TabBase/TabHeader (tab system)

### ✅ **Business Components (Complete)**

**Case Management:**

- ✅ CaseCreationModal (multi-step wizard)
- ✅ CaseDetailsView (comprehensive case display)
- ✅ CasesTab (case listing and management)

**Person Management:**

- ✅ PersonCreationModal (person creation form)
- ✅ PeopleTab (person listing and management)

**Organization Management:**

- ✅ OrganizationModal (organization CRUD)
- ✅ OrganizationsTab (organization listing)

**Financial Management:**

- ✅ FinancialItemModal (financial item CRUD)
- ✅ FinancialItemCard (financial item display)
- ✅ FinancialManagementSection (comprehensive financial UI)

**Application:**

- ✅ NightingaleCMSApp (main application component)
- ✅ DashboardTab (dashboard overview)
- ✅ SettingsModal (application settings)
- ⏩ Migration submodal planned (detect → migrate → backup/write)

---

## �️ Migration Workflow (Submodal)

A dedicated submodal in Settings handles end-to-end migration of legacy JSON files into the modern
schema. It is explicit, reversible (backup), and surfaces a report before/after write.

**Wire-Up Checklist**

- Load: `const raw = await fileService.readFile()`.
- Detect: `const detection = detectLegacyProfile(raw)` → show badges/counters.
- Migrate: `const { migratedData, report } = await runFullMigration(raw, { applyFixes: true })`.
- Backup + write:
  - Prefer writing a backup first: `nightingale-data.backup-<timestamp>.json` (if provider supports
    named writes) or provide a Download JSON fallback.
  - Persist migrated: `await fileService.writeFile(migratedData)`.
- Refresh: `onDataLoaded?.(migratedData)` and success toast.
- Errors: catch → `window.NightingaleLogger?.get('Migration').error(e)` and
  `showToast('Migration failed','error')`.

**Service Imports**

- `import { detectLegacyProfile, runFullMigration } from '../../src/services/migration.js'`
- `import { getFileService } from '../../src/services/fileServiceProvider.js'` (optional centralized
  access)

**Report Contents**

- `appliedTransforms`: e.g., masterCaseNumber → mcn, value → amount, type → description, string ID
  coercion.
- `counts.before/after`: cases, people, organizations.
- `fixes.clientNamesAdded`: number of denormalized names added.
- `warnings.orphanCasePersonIds`: unresolved references to review.

**UI States**

- Buttons disabled during actions; clear labels: Detecting…, Migrating…, Saving…
- Summary panel: detection indicators and migration report.
- CTAs: Download migrated JSON, Write & Backup, Cancel.

**Edge Cases**

- Empty/invalid JSON: present error and abort.
- Already modern: `isLegacy=false`; optionally expose a “Re-run fixers only” path.
- Read-only provider: fallback to Download JSON; skip write.
- Partial legacy (mixed shapes): run best-effort transforms; list skipped items in report.

---

## �🚀 Development Workflow

### ✅ **Current Development Setup**

**Build System:**

- Vite dev server and build pipeline (`npm run dev`, `npm run build`)
- GitHub Actions: CI (lint + tests) and Pages deploy
- Jest + React Testing Library configured
- ESLint with custom internal plugin rule (no new PropTypes disables)
- Prettier for code formatting

**Quality Assurance:**

- Conventional commits specification
- Husky git hooks for pre-commit checks
- Lint-staged for automated formatting
- Targeted unit tests for normalization and migration report invariants

**Component Development:**

- Component-scoped React.createElement pattern
- Two-layer architecture (UI/Business)
- Self-registering components for compatibility
- Comprehensive JSDoc documentation

---

## 🎯 Current Status Summary

### ✅ **Production Ready Features**

- **Complete Case Management System** with multi-step creation
- **Person Management** with relationships and living arrangements
- **Organization Management** with facility tracking
- **Financial Management** with full CRUD operations
- **Search System** with fuzzy matching across all data
- **Modern React Architecture** with proper patterns and performance
- **Automated Build & Deploy** via Vite + GitHub Pages

### 🔄 **Active Development Areas**

- **Migration UI** (submodal in Settings for detect → migrate → backup/write)
- **Integrity Audits** (report orphan links, invalid IDs, incomplete addresses)
- **Global Cleanup** (remove remaining legacy global lookups)
- **Minor assets** (404 page and static asset base-path fixes)

### 📈 **Architecture Maturity**

The Nightingale CMS has evolved into a **production-ready** case management system with:

- **Solid Foundation**: ES6 modules, React 18, proper service layer
- **Scalable Architecture**: Two-layer components, service-oriented design
- **Modern Patterns**: Component purity, proper state management, performance optimization
- **Maintainable Code**: Consistent patterns, comprehensive documentation, proper error handling

---

_Document last updated: September 11, 2025 - Reflects Vite build/deploy, migration/fixers services,
and recent normalization/search updates._
