# Nightingale CMS Data Templates

> Last Updated: 2025-09-16

This document contains the data structure templates for the Nightingale CMS system. These templates
define the expected format and fields for each entity type in the system.

## Overview

The Nightingale CMS uses a JSON-based data structure with the following main entity types:

- **Cases**: Individual case records for clients
- **People**: Contact information for clients, representatives, and staff
- **Organizations**: Service providers and partner organizations

## Template Usage

These templates serve as:

- **Reference Documentation**: Field definitions and expected data types
- **Development Guide**: Examples for creating new records
- **Validation Schema**: Structure validation for data imports
- **Testing Data**: Base structure for sample data generation

## Top-Level JSON Structure (Current `nightingale-data.json`)

The persisted data file is a single JSON object with these top-level keys (domain vs non-domain
noted):

| Key                                                                                                                            | Type                    | Domain         | Description                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | -------------- | ---------------------------------------------------------------- |
| `cases`                                                                                                                        | Case[]                  | Yes            | Collection of persisted case records                             |
| `people`                                                                                                                       | Person[]                | Yes            | Collection of person records                                     |
| `organizations`                                                                                                                | Organization[]          | Yes            | Collection of organization records                               |
| `metadata`                                                                                                                     | Metadata                | Yes            | Data file metadata & aggregate counts                            |
| `caseTemplate`                                                                                                                 | Case                    | Yes (template) | Canonical shape used for creating new cases (all fields present) |
| `personTemplate`                                                                                                               | Person                  | Yes (template) | Canonical shape for people                                       |
| `organizationTemplate`                                                                                                         | Organization            | Yes (template) | Canonical shape for organizations                                |
| `contacts`                                                                                                                     | any[]                   | Pending        | Placeholder (shape not yet formalized)                           |
| `vrTemplates`                                                                                                                  | any[]                   | Pending        | Future VR request templates (undetermined shape)                 |
| `vrCategories`                                                                                                                 | any[]                   | Pending        | Category definitions for VR workflows                            |
| `vrRequests`                                                                                                                   | any[]                   | Partially      | Global VR request list (case-level duplicates may exist)         |
| `vrDraftItems`                                                                                                                 | any[]                   | Pending        | In-progress VR artifacts                                         |
| `activeCase`                                                                                                                   | string\|null            | UI             | Currently focused case id (or null)                              |
| `accordionState`                                                                                                               | object<string, boolean> | UI             | Persisted open/closed panel state                                |
| `viewState`                                                                                                                    | ViewState               | UI             | Current navigation & expansion state                             |
| `showAllCases` / `showAllContacts` / `showAllPeople` / `showAllOrganizations`                                                  | boolean                 | UI             | Filter toggles                                                   |
| `caseSortReversed`                                                                                                             | boolean                 | UI             | Sort order toggle for cases                                      |
| `priorityFilterActive`                                                                                                         | boolean                 | UI             | Priority filter flag                                             |
| `isDataLoaded`                                                                                                                 | boolean                 | UI             | Loader readiness state                                           |
| `nextPersonId`, `nextCaseId`, `nextOrganizationId`, `nextFinancialItemId`, `nextNoteId`, `nextVrTemplateId`, `nextVrRequestId` | number                  | Infra          | Auto-increment counters for ID generation                        |

Non-domain (presentation) keys SHOULD be excluded if exporting/sharing data externally. Future
separation: consider a `uiState` root.

## Field Format Standards

### **Date/Time Fields**

- **Format**: ISO 8601 format `"2025-08-28T00:00:00.000Z"`
- **Usage**: All date and timestamp fields

### **ID Fields**

- **Primary Pattern**: `^(case|person|org|financial|income|expense|note|todo|vr|rep)-[0-9]+$`
- **Canonical Prefixes**:
  - Cases: `case-`
  - People: `person-`
  - Organizations: `org-`
  - Financial items (resources/income/expenses): `financial-`, `income-`, `expense-`
  - Notes: `note-`
  - Todos: `todo-`
  - VR Requests / Templates: `vr-`, `vrtpl-`
  - Authorized Representatives: `rep-`
  - Legacy numeric IDs are converted during migration to prefixed form.

### **Address Fields**

- **Preferred**: Object `{ street, city, state, zip }`
- **Legacy Alternative**: Single string (retain for backward compatibility; migration normalizes to
  object)

### **Boolean Fields**

- Use actual JSON booleans (never stringified). Empty template values default to `false`.

### **Financial Fields**

- **Current**: `amount`, `description`
- **Legacy**: `value`, `type` (retained for imported historical data)
- Consumers should prefer `amount`+`description`; treat `value`+`type` as fallback.

### **Validation Patterns (Recommended)**

| Field                   | Pattern / Rule                                                     | Notes                                                              |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | --- | --------- | ------ | ------- | ---- | ---- | --- | ------------- | ----------------------- |
| ID                      | `^(case                                                            | person                                                             | org | financial | income | expense | note | todo | vr  | rep)-[0-9]+$` | Enforced post-migration |
| Date / DateTime         | ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`) or empty string in templates | Empty allowed only in templates / draft state                      |
| SSN                     | `^(?:\d{3}-?\d{2}-?\d{4})$`                                        | Stored unformatted OR formatted; normalize to digits on processing |
| Phone                   | `^\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$`                                | Render formatted `(555) 123-4567`                                  |
| ZIP                     | `^\d{5}(?:-\d{4})?$`                                               | 5 or 9 digit ZIP                                                   |
| State                   | `^[A-Z]{2}$`                                                       | USPS 2-letter code                                                 |
| Currency (amount/value) | Number ≥ 0                                                         | Negative values only if explicitly supported (e.g., adjustments)   |

---

---

## Case Template

Complete case record structure with all possible fields:

```json
{
  "id": "case-template",
  "mcn": "12345",
  "masterCaseNumber": "12345",
  "clientName": "Client Full Name",
  "personId": "person-001",
  "status": "Pending",
  "priority": false,
  "caseType": "SIMP",
  "serviceType": "SIMP",
  "applicationDate": "2025-08-28T00:00:00.000Z",
  "createdDate": "2025-08-28T00:00:00.000Z",
  "lastUpdated": "2025-08-28T00:00:00.000Z",
  "description": "Case description text",
  "withWaiver": false,
  "retroRequested": "No",
  "livingArrangement": "Not specified",
  "organizationAddress": "Not specified",
  "clientAddress": {
    "street": "123 Main Street",
    "city": "City Name",
    "state": "State",
    "zip": "12345"
  },
  "authorizedReps": [
    {
      "id": "rep-001",
      "name": "Representative Name",
      "relationship": "Attorney",
      "phone": "(555) 123-4567",
      "email": "rep@example.com"
    }
  ],
  "appDetails": {
    "appDate": "2025-08-28T00:00:00.000Z",
    "caseType": "SIMP",
    "serviceType": "Vocational Rehabilitation"
  },
  "financials": {
    "resources": [
      {
        "id": "financial-001",
        "description": "Checking Account",
        "type": "Checking Account",
        "amount": 1500,
        "value": 1500,
        "location": "Bank Name",
        "accountNumber": "****1234",
        "frequency": "monthly",
        "dateAdded": "2025-08-28T00:00:00.000Z",
        "source": "Bank Statement",
        "verificationSource": "Bank Statement",
        "notes": "Primary checking account",
        "verified": true
      }
    ],
    "income": [
      {
        "id": "income-001",
        "description": "Employment Income",
        "type": "Employment Income",
        "amount": 2500,
        "value": 2500,
        "frequency": "monthly",
        "dateAdded": "2025-08-28T00:00:00.000Z",
        "source": "Pay Stub",
        "verificationSource": "Pay Stub",
        "location": "Employer Name",
        "notes": "Full-time employment",
        "verified": true
      }
    ],
    "expenses": [
      {
        "id": "expense-001",
        "description": "Housing Costs",
        "type": "Housing Costs",
        "amount": 1200,
        "value": 1200,
        "frequency": "monthly",
        "dateAdded": "2025-08-28T00:00:00.000Z",
        "source": "Lease Agreement",
        "verificationSource": "Lease Agreement",
        "location": "Home Address",
        "notes": "Rent payment",
        "verified": true
      }
    ]
  },
  "notes": [
    {
      "id": "note-001",
      "title": "Case Opening",
      "content": "Initial case assessment completed",
      "author": "Case Manager",
      "date": "2025-08-28T00:00:00.000Z",
      "category": "initial",
      "lastModified": "2025-08-28T00:00:00.000Z"
    }
  ],
  "todos": [
    {
      "id": "todo-001",
      "task": "Complete intake documentation",
      "status": "pending",
      "dueDate": "2025-09-15T00:00:00.000Z",
      "completedDate": "",
      "assignedTo": "Case Manager",
      "priority": "high",
      "notes": "Required for case processing"
    }
  ],
  "vrRequests": [
    {
      "id": "vr-001",
      "type": "Assessment",
      "status": "pending",
      "requestDate": "2025-08-28T00:00:00.000Z",
      "completedDate": "",
      "notes": "Initial vocational assessment",
      "assignedTo": "VR Counselor",
      "description": "Comprehensive vocational evaluation"
    }
  ],
  "verificationRequest": {
    "requestType": "Financial",
    "status": "pending",
    "dateRequested": "2025-08-28T00:00:00.000Z",
    "dateCompleted": "",
    "notes": "Verification of income and resources",
    "requestedBy": "Case Manager",
    "completedBy": ""
  },
  "searchableText": "case search text content",
  "source": "Application Form",
  "verificationSource": "Application Form"
}
```

### Authorized Representatives

Structured objects (preferred) replacing earlier simple string arrays:

| Field          | Type   | Required | Notes                        |
| -------------- | ------ | -------- | ---------------------------- |
| `id`           | String | Yes      | `rep-<n>` pattern            |
| `name`         | String | Yes      | Display name                 |
| `relationship` | String | Yes      | e.g. Attorney, Guardian, POA |
| `phone`        | String | No       | Standard phone format        |
| `email`        | String | No       | Email address                |

Legacy form: an array of strings (names) is accepted but should be migrated.

### Case Field Definitions

| Field                 | Type    | Required | Description                                          |
| --------------------- | ------- | -------- | ---------------------------------------------------- |
| `id`                  | String  | Yes      | Unique case identifier                               |
| `mcn`                 | String  | Yes      | Master Case Number - numeric string, digits 0-9 only |
| `masterCaseNumber`    | String  | No       | Alternative MCN field (legacy compatibility)         |
| `clientName`          | String  | Yes      | Full name of primary client                          |
| `personId`            | String  | Yes      | Reference to person record                           |
| `status`              | String  | Yes      | Case status (Pending, Active, Closed)                |
| `priority`            | Boolean | No       | Priority case flag                                   |
| `caseType`            | String  | Yes      | Case type (SIMP, LTC, etc.)                          |
| `serviceType`         | String  | No       | Service type description                             |
| `applicationDate`     | String  | No       | Date application was submitted (ISO 8601)            |
| `createdDate`         | String  | Yes      | Date case was created (ISO 8601)                     |
| `lastUpdated`         | String  | Yes      | Date case was last modified (ISO 8601)               |
| `description`         | String  | No       | Case description text                                |
| `withWaiver`          | Boolean | No       | Waiver application flag                              |
| `retroRequested`      | String  | Yes      | Retro eligibility (Yes, No)                          |
| `livingArrangement`   | String  | No       | Client living arrangement description                |
| `organizationAddress` | String  | No       | Service organization address                         |
| `clientAddress`       | Object  | No       | Client physical address                              |
| `authorizedReps`      | Array   | No       | Authorized representatives list                      |
| `appDetails`          | Object  | No       | Application details                                  |
| `financials`          | Object  | No       | Financial information arrays                         |
| `notes`               | Array   | No       | Case notes and documentation                         |
| `todos`               | Array   | No       | Outstanding tasks                                    |
| `vrRequests`          | Array   | No       | VR service requests                                  |
| `verificationRequest` | Object  | No       | Verification request details                         |
| `searchableText`      | String  | No       | Full-text search content                             |
| `source`              | String  | No       | Data source reference                                |
| `verificationSource`  | String  | No       | Verification documentation source                    |

---

## Person Template

Complete person record structure:

```json
{
  "id": "person-001",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "ssn": "123-45-6789",
  "dateOfBirth": "1980-01-15T00:00:00.000Z",
  "phone": "(555) 123-4567",
  "email": "john.doe@example.com",
  "status": "active",
  "dateAdded": "2025-08-28T00:00:00.000Z",
  "lastUpdated": "2025-08-28T00:00:00.000Z",
  "relationship": "client",
  "address": {
    "street": "123 Main Street",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701"
  },
  "mailingAddress": {
    "street": "PO Box 456",
    "city": "Springfield",
    "state": "IL",
    "zip": "62702",
    "sameAsPhysical": false
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "(555) 987-6543",
    "relationship": "spouse"
  },
  "notes": "Client notes and additional information",
  "tags": ["client", "active"]
}
```

### Person Field Definitions

| Field              | Type   | Required | Description                                                   |
| ------------------ | ------ | -------- | ------------------------------------------------------------- |
| `id`               | String | Yes      | Unique person identifier                                      |
| `name`             | String | Yes      | Full display name                                             |
| `firstName`        | String | Yes      | First name                                                    |
| `lastName`         | String | Yes      | Last name                                                     |
| `middleName`       | String | No       | Middle name                                                   |
| `ssn`              | String | No       | Social Security Number                                        |
| `dateOfBirth`      | String | No       | Date of birth (ISO 8601)                                      |
| `phone`            | String | No       | Primary phone number                                          |
| `email`            | String | No       | Email address                                                 |
| `status`           | String | Yes      | Person status (active, inactive)                              |
| `dateAdded`        | String | Yes      | Date record was created (ISO 8601)                            |
| `lastUpdated`      | String | Yes      | Date record was last modified (ISO 8601)                      |
| `relationship`     | String | No       | Relationship to other person (spouse, parent, attorney, etc.) |
| `address`          | Object | No       | Physical address                                              |
| `mailingAddress`   | Object | No       | Mailing address if different                                  |
| `emergencyContact` | Object | No       | { name, phone, relationship } emergency/next-of-kin           |
| `notes`            | String | No       | Additional notes about the person                             |
| `tags`             | Array  | No       | Classification tags                                           |

---

## Organization Template

Complete organization record structure:

```json
{
  "id": "org-001",
  "name": "Springfield Community Services",
  "type": "Non-Profit",
  "status": "active",
  "phone": "(555) 987-6543",
  "email": "info@springfieldcs.org",
  "website": "https://www.springfieldcs.org",
  "dateAdded": "2025-08-28T00:00:00.000Z",
  "lastUpdated": "2025-08-28T00:00:00.000Z",
  "address": {
    "street": "100 Community Drive",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701"
  },
  "contactPerson": {
    "name": "Mary Wilson",
    "title": "Program Director",
    "phone": "(555) 987-6544",
    "email": "mary.wilson@springfieldcs.org"
  },
  "services": ["Case Management", "Vocational Training", "Support Services"],
  "notes": "Primary service provider for vocational rehabilitation",
  "tags": ["service-provider", "active"]
}
```

### Organization Field Definitions

| Field           | Type   | Required | Description                                      |
| --------------- | ------ | -------- | ------------------------------------------------ |
| `id`            | String | Yes      | Unique organization identifier                   |
| `name`          | String | Yes      | Organization name                                |
| `type`          | String | No       | Organization type (Non-Profit, Government, etc.) |
| `status`        | String | Yes      | Organization status (active, inactive)           |
| `phone`         | String | No       | Primary phone number                             |
| `email`         | String | No       | Primary email address                            |
| `website`       | String | No       | Organization website                             |
| `dateAdded`     | String | Yes      | Date record was created (ISO 8601)               |
| `lastUpdated`   | String | Yes      | Date record was last modified (ISO 8601)         |
| `address`       | Object | No       | Physical address                                 |
| `contactPerson` | Object | No       | Primary contact information                      |
| `services`      | Array  | No       | List of services provided                        |
| `notes`         | String | No       | Additional notes about the organization          |
| `tags`          | Array  | No       | Classification tags                              |

---

## Status & Enumerations

### Case Status (Recommended Set)

- `"Pending"` - Application submitted, under review
- `"Active"` - Case approved and in progress
- `"Suspended"` - Temporarily on hold
- `"Closed"` - Case completed or terminated

### Priority Values

- `true` - High priority case
- `false` - Normal priority case

### Case Types (Examples—extendable)

- `"SIMP"` - Simplified Application Process
- `"LTC"` - Long-term Care
- `"Waiver"` - Waiver Application Process

### Financial Item Types

- **Resources**: `"Checking Account"`, `"Savings Account"`, `"Vehicle"`, `"Real Estate"`
- **Income**: `"Employment Income"`, `"SSDI"`, `"Social Security"`, `"Pension"`
- **Expenses**: `"Housing"`, `"Medical"`, `"Transportation"`, `"Utilities"`

### Verification Status

- `"Verified"` - Documentation received and confirmed
- `"VR Pending"` - Waiting for verification
- `"Review Pending"` - Under review
- `"Not Required"` - No verification needed

### Note Categories

- `"initial"` - Case opening notes
- `"contact"` - Communication logs
- `"assessment"` - Evaluation results
- `"employment"` - Job placement activities
- `"follow-up"` - Progress monitoring

---

## UI State vs Domain Data

The following keys are considered **UI / presentation state** and should not be required for domain
exports: `accordionState`, `viewState`, all `showAll*` flags, `priorityFilterActive`,
`isDataLoaded`, `activeCase`. Consumers performing analytical export should strip these.

## Schema & Validation Roadmap

Planned JSON Schema (2020-12) deliverables:

1. `$defs` for: Address, MailingAddress, EmergencyContact, ContactPerson, FinancialItem, Note,
   TodoItem, VRRequest, AuthorizedRep, Case, Person, Organization, Metadata, ViewState.
2. Pattern validation for IDs, SSN, phone, dates (see Validation Patterns table above).
3. Backward compatibility: allow legacy fields (`value`, `type`, string address) through `anyOf`
   branches until migration window closes.
4. Provide a `dataVersion` upgrade path via `metadata.schemaVersion`.

## Migration Notes

### Legacy Compatibility

The system maintains backward compatibility with legacy data formats:

- **Financial Items**: Both `"type"`/`"value"` (legacy) and `"description"`/`"amount"` (current) are
  supported
- **Addresses**: Both string format and object format are accepted
- **IDs**: Numeric IDs are automatically converted to string format with prefixes

### Data Validation

- All required fields must be present
- Date fields must be in ISO 8601 format
- Phone numbers should be in (555) 123-4567 format
- Email addresses must be valid format
- Boolean fields must be actual boolean values, not strings

### Performance Considerations

- Use consistent ID prefixes for efficient searching
- Include searchableText fields for full-text search optimization
- Maintain proper referential integrity between entities

---

## Examples and Testing

For complete working examples, see the sample data in `nightingale-data.json` which includes:

- A fully populated case with all financial details
- Associated person and organization records
- Complete workflow documentation from application to employment

This template structure ensures consistent data format across the Nightingale CMS system and
provides clear guidance for developers working with the data layer.

## Migration Notes

### SQLite Migration

**Why migrate to SQLite?**

- Better relationship modeling between entities
- Improved data integrity with foreign key constraints
- Enhanced query performance for complex relationships
- ACID compliance for data consistency
- Proper indexing for search and filtering operations

**What needs to change?**

### Person-to-Person Relationship Modeling

The current JSON structure has poor support for relationships between people. The `relationship`
field is ambiguous (spouse of WHO?).

**Current Problem:**

```json
{
  "id": "person-001",
  "relationship": "spouse" // ← Spouse of who?
}
```

**SQLite Solution (Refined):** Create dedicated relationship + representative link tables to capture
directionality and type granularity:

```sql
CREATE TABLE person_relationships (
  person_id_1 TEXT REFERENCES people(id),
  person_id_2 TEXT REFERENCES people(id),
  relationship_type TEXT,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  created_date TEXT,
  PRIMARY KEY (person_id_1, person_id_2, relationship_type)
);
```

**Supported Person-to-Person Relationship Types (Initial Set):**

- **`spouse`** - Married partner relationship
- **`parent`** - Parent of another person
- **`dependent`** - Person who depends on another (child, elderly parent, etc.)
- **`authorized-representative`** - General authorized representative
  - **`power-of-attorney`** - Legal power of attorney holder
  - **`case-representative`** - Case-specific representative
  - **`legal-guardian`** - Court-appointed legal guardian

**Migration Strategy (Phased):**

1. **Extraction**: Expand `authorizedReps[]` (case-level) into discrete Person + Relation edges
   where representative is not already a Person.
2. **Normalization**: Generate `person_relationships` records (bidirectional where applicable, e.g.,
   spouse) with controlled `relationship_type`.
3. **Deprecation**: Mark original inline `authorizedReps` arrays as legacy; retain for one release;
   remove write support after verification.
4. **Enrichment**: Introduce `effective_start` / `effective_end` for temporal queries.
5. **Indexing**: Add composite index `(relationship_type, person_id_1)` and `(person_id_2)` for
   reverse lookups.

---

## Open Questions / Extension Points

| Area                        | Question                   | Proposed Action                                                 |
| --------------------------- | -------------------------- | --------------------------------------------------------------- |
| VR Templates                | Shape undefined            | Introduce draft `$defs.VRTemplate` once first fields identified |
| contacts[]                  | Usage unclear              | Decide if contacts converge with `people` or distinct entity    |
| searchableText              | Persist vs derive?         | Consider dropping from persistence & computing at load          |
| duplication of `vrRequests` | Case-level + global arrays | Choose one authoritative source; global may become index        |
| UI vs domain separation     | Mixed currently            | Isolate UI keys under `uiState` in a future migration           |

---

This documentation now reflects the current persisted structure (as of 2025-09-16) and aligns
templates with newly clarified fields (`emergencyContact`, structured `authorizedReps`) and
validation recommendations.

- Extract `authorizedReps[]` array entries into people records
- Create relationship entries linking representatives to clients
- Preserve existing relationship data with proper linking
- Support hierarchical relationship types (authorized-representative → power-of-attorney)
