# Nightingale CMS Architecture Context

## Current Implementation Status (August 2025)

This document provides an up-to-date view of the Nightingale CMS architecture, reflecting the current ES6 module system, two-layer component architecture, and modern React implementation.

---

## 🏗️ Architecture Overview

### **ES6 Module System** ✅

**Main Entry Point:** `src/main.js`

- Proper ES6 imports with dependency ordering
- Service registration and global compatibility
- React 18 with createRoot initialization
- External library management (Day.js, Fuse.js)

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
- Component-scoped React.createElement pattern
- Global registration for backward compatibility

**Business Layer** (`src/components/business/`):

- Domain-specific CMS workflows and logic
- CaseCreationModal, PersonCreationModal, tab components
- Uses UI components as building blocks
- Implements Nightingale business validation

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

**🔄 Recently Updated (August 2025):**

- Migrated to ES6 module system
- Implemented two-layer architecture
- Enhanced component registration system
- Added comprehensive logging service
- Updated React patterns to follow best practices

---

## 🧑‍💼 Person Management Implementation

### ✅ **Fully Implemented**

**Core Identity:**

- ✅ `name` (full name field)
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

- ✅ `personId` (primary client)
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

---

## 🔍 Verification System Implementation

### ✅ **Recently Added**

**VR Requests:**

- ✅ `vrRequests` array in data structure
- ✅ Verification tracking with due dates
- ✅ Status management (Pending, Received, Overdue)
- ✅ Source and description tracking

---

## �️ Service Layer Implementation

### ✅ **Core Services**

**Data Management:**

- ✅ `core.js` - Security, validation, formatting utilities
- ✅ `nightingale.datamanagement.js` - Data operations and persistence
- ✅ `nightingale.autosavefile.js` - Auto-save functionality
- ✅ `nightingale.search.js` - Fuse.js integration

**UI Services:**

- ✅ `ui.js` - UI utilities and helpers
- ✅ `nightingale.toast.js` - Notification system
- ✅ `nightingale.clipboard.js` - Clipboard operations

**Business Services:**

- ✅ `cms.js` - CMS-specific utilities
- ✅ `nightingale.logger.js` - Comprehensive logging
- ✅ `nightingale.parsers.js` - Data parsing and validation

---

## � Component Library Status

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

---

## 🚀 Development Workflow

### ✅ **Current Development Setup**

**Build System:**

- ES6 modules with in-browser loading for development
- NPM scripts for development server (`npm run dev`)
- Jest testing framework configured
- ESLint with React rules
- Prettier for code formatting

**Quality Assurance:**

- Conventional commits specification
- Husky git hooks for pre-commit checks
- Lint-staged for automated formatting

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

### 🔄 **Active Development Areas**

- **Testing System** (test files exist but need implementation)
- **Build Optimization** (currently development-focused)
- **Enhanced Verification Tracking** (VR system needs UI)

### 📈 **Architecture Maturity**

The Nightingale CMS has evolved into a **production-ready** case management system with:

- **Solid Foundation**: ES6 modules, React 18, proper service layer
- **Scalable Architecture**: Two-layer components, service-oriented design
- **Modern Patterns**: Component purity, proper state management, performance optimization
- **Maintainable Code**: Consistent patterns, comprehensive documentation, proper error handling

---

_Document last updated: August 30, 2025 - Reflects current ES6 module system and complete feature implementation_
