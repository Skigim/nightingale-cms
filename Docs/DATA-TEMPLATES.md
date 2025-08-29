# Nightingale CMS Data Templates

This document contains the data structure templates for the Nightingale CMS system. These templates define the expected format and fields for each entity type in the system.

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

## Field Format Standards

### **Date/Time Fields**
- **Format**: ISO 8601 format `"2025-08-28T00:00:00.000Z"`
- **Usage**: All date and timestamp fields

### **ID Fields**
- **Format**: Prefixed strings like `"case-001"`, `"person-001"`, `"org-001"`
- **Usage**: All entity IDs and references

### **Address Fields**
- **Type**: Object with `{street, city, state, zip}` structure
- **Alternative**: String format `"123 Main St, City, State Zip"` (legacy)

### **Boolean Fields**
- **Type**: Actual boolean values (`true`/`false`)
- **Usage**: Priority flags, verification status, etc.

### **Financial Fields**
- **Primary**: `"amount"` (current standard)
- **Legacy**: `"value"` (maintained for backward compatibility)
- **Type**: `"description"` (current) and `"type"` (legacy)

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

### Case Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique case identifier |
| `mcn` | String | Yes | Master Case Number - numeric string, digits 0-9 only |
| `clientName` | String | Yes | Full name of primary client |
| `personId` | String | Yes | Reference to person record |
| `status` | String | Yes | Case status (Pending, Active, Closed) |
| `priority` | Boolean | No | Priority case flag |
| `caseType` | String | Yes | Case type (SIMP, LTC, etc.) |
| `retroRequested` | String | Yes | Retro eligibility (Yes, No) |
| `withWaiver` | Boolean | No | Waiver application flag |
| `financials` | Object | No | Financial information arrays |
| `notes` | Array | No | Case notes and documentation |
| `todos` | Array | No | Outstanding tasks |
| `vrRequests` | Array | No | VR service requests |

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique person identifier |
| `name` | String | Yes | Full display name |
| `firstName` | String | Yes | First name |
| `lastName` | String | Yes | Last name |
| `phone` | String | No | Primary phone number |
| `email` | String | No | Email address |
| `relationship` | String | No | Relationship to other person (spouse, parent, attorney, etc.) |
| `address` | Object | No | Physical address |
| `mailingAddress` | Object | No | Mailing address if different |

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique organization identifier |
| `name` | String | Yes | Organization name |
| `type` | String | No | Organization type (Non-Profit, Government, etc.) |
| `phone` | String | No | Primary phone number |
| `email` | String | No | Primary email address |
| `website` | String | No | Organization website |
| `address` | Object | No | Physical address |
| `contactPerson` | Object | No | Primary contact information |
| `services` | Array | No | List of services provided |

---

## Status Values

### Case Status
- `"Pending"` - Application submitted, under review
- `"Active"` - Case approved and in progress
- `"Suspended"` - Temporarily on hold
- `"Closed"` - Case completed or terminated

### Priority Values
- `true` - High priority case
- `false` - Normal priority case

### Case Types
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

## Migration Notes

### Legacy Compatibility
The system maintains backward compatibility with legacy data formats:

- **Financial Items**: Both `"type"`/`"value"` (legacy) and `"description"`/`"amount"` (current) are supported
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

This template structure ensures consistent data format across the Nightingale CMS system and provides clear guidance for developers working with the data layer.


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

The current JSON structure has poor support for relationships between people. The `relationship` field is ambiguous (spouse of WHO?). 

**Current Problem:**
```json
{
  "id": "person-001",
  "relationship": "spouse"  // ← Spouse of who?
}
```

**SQLite Solution:**
Create a dedicated relationships table to properly link people:

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

**Supported Person-to-Person Relationship Types:**

- **`spouse`** - Married partner relationship
- **`parent`** - Parent of another person
- **`dependent`** - Person who depends on another (child, elderly parent, etc.)
- **`authorized-representative`** - General authorized representative
  - **`power-of-attorney`** - Legal power of attorney holder
  - **`case-representative`** - Case-specific representative
  - **`legal-guardian`** - Court-appointed legal guardian

**Migration Strategy:**
- Extract `authorizedReps[]` array entries into people records
- Create relationship entries linking representatives to clients
- Preserve existing relationship data with proper linking
- Support hierarchical relationship types (authorized-representative → power-of-attorney)
