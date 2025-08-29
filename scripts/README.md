# Data Generation Scripts

This directory contains scripts for generating test data for the Nightingale CMS system.

## generate-data.js

Generates realistic test data based on the templates defined in `Docs/DATA-TEMPLATES.md`.

### Usage

```bash
# Generate default amounts (10 cases, 20 people, 5 organizations)
node scripts/generate-data.js

# Generate custom amounts
node scripts/generate-data.js [cases] [people] [organizations]

# Examples
node scripts/generate-data.js 50 100 25    # Large dataset
node scripts/generate-data.js 5 10 3      # Small dataset
node scripts/generate-data.js 100 200 50  # Very large dataset
```

### Output

Creates `Data/nightingale-data-generated.json` with:

- Complete case records with financial data, notes, todos, VR requests
- Realistic person records with addresses, contact info, relationships
- Organization records with services, contact persons, addresses
- Proper cross-references between entities (cases reference people, etc.)

### Features

- **Realistic Data**: Uses pools of real names, cities, addresses
- **Proper Relationships**: Cases reference actual people, authorized reps are real person records
- **Financial Complexity**: Multiple income/expense/resource types with verification status
- **Date Logic**: Realistic date ranges (applications before case creation, etc.)
- **Optional Fields**: Randomly includes optional fields based on realistic probabilities
- **Validation Ready**: Follows all template requirements and field formats

### Data Quality

- Phone numbers in (555) 123-4567 format
- Email addresses with realistic domains
- SSNs in XXX-XX-XXXX format
- Addresses with real city/state combinations
- ISO 8601 date formats
- Proper boolean values (not strings)
- MCNs as numeric strings (5 digits)
