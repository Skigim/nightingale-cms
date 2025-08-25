# Nightingale CMS Architecture Context

## Current Implementation vs Future Model

This document maps our existing Nightingale CMS architecture against the planned future model, showing what we've implemented, what needs enhancement, and what's missing.

---

## 📊 Data Schema Evolution

### Current Data Structure (`nightingale-data.json`)

```json
{
  "cases": [...],
  "people": [...],
  "organizations": [...]
}
```

**✅ Implemented:**

- Basic case management
- Person management with living arrangements
- Organization basic data

**🔄 Recently Updated:**

- Moved `livingArrangement` from cases to people (August 2025)
- Enhanced PersonDetailsModal with relationship management
- Integrated SearchBar components for family/authorized reps

---

## 🧑‍💼 Person Data Implementation

### ✅ **Currently Implemented (people[])**

**Core Identity:**

- ✅ `name` (single field - needs splitting)
- ✅ `dateOfBirth`
- ✅ `ssn`
- ❌ Preferred Language (missing)

**Contact Information:**

- ✅ `phone` (single field)
- ✅ `email`
- ✅ `address` (full object: street, city, state, zip)
- ✅ `mailingAddress` (full object)

**Status Information:**

- ✅ `livingArrangement` (newly moved from cases)
- ❌ Demographics (Sex/Gender, Race/Ethnicity, Marital Status)
- ❌ US Citizenship Status
- ❌ Immigration Status
- ❌ Disability Status
- ❌ Pregnancy Status

**Financial Information:**

- ✅ Basic structure exists in cases.financials
- ✅ Resources (income, expenses arrays)
- ❌ Needs to be moved to person level per future model

**Relationships:**

- ✅ `authorizedRepIds` (array of person IDs)
- ✅ `familyMembers` (array of person IDs)
- ✅ Full relationship management in PersonDetailsModal
- ✅ SearchBar integration for adding relationships

### 🎯 **Future Model Alignment Needed**

**Name Structure Enhancement:**

```javascript
// Current: name: "John Doe"
// Future:
names: {
  first: "John",
  middle: "",
  last: "Doe",
  suffix: ""
}
```

**Phone Numbers Enhancement:**

```javascript
// Current: phone: "(555) 123-4567"
// Future:
phoneNumbers: [
  { number: '(555) 123-4567', type: 'primary' },
  { number: '(555) 987-6543', type: 'secondary' },
];
```

**Demographics Addition:**

```javascript
demographics: {
  sex: "",
  gender: "",
  race: "",
  ethnicity: "",
  maritalStatus: ""
}
```

---

## 🏢 Organization Data Implementation

### ✅ **Currently Implemented (organizations[])**

**Core Identity:**

- ✅ `name` (organization name)
- ✅ `type` (organization type)

**Location & Contact:**

- ✅ `address` (full object)
- ✅ `phone`
- ❌ Separate mailing address

**Key Personnel:**

- ❌ Contacts array (missing structured contact persons)

### 🎯 **Future Model Alignment Needed**

**Enhanced Organization Structure:**

```javascript
{
  id: 1,
  name: "Sunset Manor Nursing Home",
  type: "Nursing Facility",
  addresses: {
    physical: { street: "", city: "", state: "", zip: "" },
    mailing: { street: "", city: "", state: "", zip: "" }
  },
  contacts: [
    {
      name: "Jane Administrator",
      title: "Administrator",
      phone: "(555) 123-4567",
      email: "admin@sunset.com"
    },
    {
      name: "Bob Manager",
      title: "BOM",
      phone: "(555) 123-4568",
      email: "bom@sunset.com"
    }
  ]
}
```

---

## 📋 Case Data Implementation

### ✅ **Currently Implemented (cases[])**

**Application Information:**

- ✅ `applicationDate`
- ✅ `caseType`
- ✅ `priority`
- ✅ `retroRequested`
- ❌ Application Type (Initial/Renewal)
- ❌ Programs Requested array

**Case Management:**

- ✅ `mcn` (case number)
- ✅ `status`
- ✅ `personId` (links to primary person)
- ✅ `spouseId` (for SIMP cases)
- ✅ `organizationId` (links to organization)
- ❌ Worker Assignment
- ❌ Office/Unit
- ❌ Review Dates

**Financial Data:**

- ✅ `financials` object with resources, income, expenses arrays
- ✅ Verification tracking within financial items
- ✅ Full CRUD operations in UI

**Relationships:**

- ✅ `authorizedReps` (array of person IDs)
- ❌ Full household composition

### 🎯 **Future Model Alignment Needed**

**Enhanced Case Structure:**

```javascript
{
  // Keep existing fields
  applicationType: "Initial" | "Renewal",
  programsRequested: ["Medicaid", "SNAP", "etc"],
  workerAssignment: "Worker Name",
  office: "Local Office",
  unit: "Unit Name",
  reviewDates: {
    next: "2025-12-01",
    annual: "2026-08-01"
  },
  householdComposition: [personId1, personId2, ...]
}
```

---

## 🔍 Verification Data Implementation

### ❌ **Missing - Needs Implementation**

The future model calls for a separate `vrRequests[]` array for verification tracking:

```javascript
vrRequests: [
  {
    id: 'vr-001',
    caseId: 'case-123',
    personId: 1,
    verificationType: 'Income',
    description: 'Employment verification for John Doe',
    dueDate: '2025-09-15',
    status: 'Pending',
    source: 'Employer',
    dateRequested: '2025-08-15',
    dateReceived: null,
    notes: 'Sent request to HR department',
  },
];
```

**Current State:** Verification is tracked within financial items but not as a separate system.

---

## 🖥️ UI Implementation Status

### ✅ **Fully Implemented**

**People Management:**

- ✅ DataTable with all current person fields
- ✅ PersonDetailsModal with tabs (Basic Info, Address, Relationships)
- ✅ SearchBar integration for relationship management
- ✅ Living Arrangement column (recently updated)
- ✅ Organization/Address smart field display

**Case Management:**

- ✅ Full case CRUD operations
- ✅ Financial management (resources, income, expenses)
- ✅ Multi-step case creation wizard
- ✅ Conditional form logic based on living arrangements
- ✅ Person selection integration

**Search & Navigation:**

- ✅ NightingaleSearchService with Fuse.js
- ✅ SearchBar component with dropdown and keyboard navigation
- ✅ Global search across people and cases

### 🔄 **Needs Enhancement**

**Person Form Fields:**

- Split name into components (First, Middle, Last, Suffix)
- Add demographics section
- Add multiple phone number support
- Add citizenship/immigration status fields

**Organization Management:**

- Enhanced contact person management
- Separate mailing address support
- Better organization type categorization

**Verification System:**

- Separate verification request tracking
- Due date management
- Status workflow

---

## 🏗️ Architecture Strengths

### ✅ **Current Architectural Wins**

1. **Component Library Integration:** Proper use of SearchBar, Modal, DataTable components
2. **Data Migration System:** `normalizeDataMigrations()` handles backward compatibility
3. **Modular Design:** Clear separation between UI components and data logic
4. **Search Integration:** Unified search service with fuzzy matching
5. **Responsive UI:** Modern React patterns with proper state management
6. **Relationship Management:** Full CRUD for person relationships

### 🎯 **Enhancement Opportunities**

1. **Data Normalization:** Move toward the structured future model
2. **Verification Workflows:** Implement dedicated verification tracking
3. **Worker Management:** Add staff assignment and office tracking
4. **Demographics Collection:** Enhanced person data collection
5. **Organization Contacts:** Structured contact person management

---

## 📈 Migration Path

### Phase 1: Data Model Enhancement _(Next Priority)_

- Split name fields in person objects
- Add demographics section to PersonDetailsModal
- Implement multiple phone number support

### Phase 2: Organization Enhancement

- Add contacts array to organizations
- Enhance organization management UI
- Implement organization contact CRUD

### Phase 3: Verification System

- Create vrRequests data structure
- Build verification tracking UI
- Implement due date and status workflows

### Phase 4: Case Enhancement

- Add worker assignment and office tracking
- Implement household composition management
- Add program tracking and review dates

---

## 🔧 Technical Notes

**Migration Strategy:** The existing `normalizeDataMigrations()` function provides a robust foundation for incremental schema updates without breaking existing installations.

**Component Reuse:** The SearchBar and Modal components are well-designed and can be extended for new functionality without architectural changes.

**Data Integrity:** The current person-case relationship model is solid and aligns well with the future model's emphasis on person-centric data organization.

---

_This document reflects the state as of August 16, 2025, after the livingArrangement migration and PersonDetailsModal enhancements._
