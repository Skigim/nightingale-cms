# Nightingale CMS Data Migration Documentation

## Overview

The data migration script (`data-migration.js`) safely migrates legacy Nightingale CMS data to the
current format. It handles both individual case records and complete data structures with people,
cases, and relationships.

## Features

- ✅ **Safe Migration**: Creates automatic backups before migration
- ✅ **Dual Format Support**: Handles both single-case and complete data structures
- ✅ **Field Mapping**: Automatically maps legacy fields to current schema
- ✅ **Relationship Preservation**: Maintains spouse and authorized representative relationships
- ✅ **Financial Data Restructuring**: Converts financial records with proper validation
- ✅ **Validation & Reporting**: Comprehensive validation and migration summaries
- ✅ **Rollback Capability**: Maintains backups for easy rollback if needed

## Usage

### Basic Usage

```bash
# Migrate a single case
node .vscode/data-migration.js Data/legacy-single-case.json Data/nightingale-data.json

# Migrate complete data structure
node .vscode/data-migration.js Data/legacy-complete.json Data/nightingale-data.json

# Use default paths
node .vscode/data-migration.js
```

### Input Formats Supported

#### Format 1: Single Case Record

```json
{
  "id": 1,
  "personId": 101,
  "masterCaseNumber": "2025001",
  "status": "Active",
  "priority": true,
  "retroStatus": true,
  "appDetails": {
    "appDate": "2025-01-15",
    "caseType": "LTC"
  },
  "financials": {
    "resources": [...],
    "income": [...],
    "expenses": [...]
  },
  "notes": [...]
}
```

#### Format 2: Complete Data Structure

```json
{
  "people": [
    {
      "id": 101,
      "name": "Doe, John",
      "dob": "1945-05-20",
      "spouseId": 102,
      "authorizedRepIds": [103]
    }
  ],
  "cases": [
    {
      "id": 1,
      "personId": 101,
      "masterCaseNumber": "2025001"
    }
  ]
}
```

## Migration Mappings

### People Records

| Legacy Field                          | Current Field                         | Notes                      |
| ------------------------------------- | ------------------------------------- | -------------------------- |
| `dob`                                 | `dateOfBirth`                         | Date normalization         |
| `address`, `city`, `state`, `zipCode` | `address: {street, city, state, zip}` | Structured address object  |
| `authorizedRepIds`                    | `authorizedRepIds`                    | Converted to string array  |
| `spouseId`                            | Added to `familyMembers`              | Relationship establishment |

### Case Records

| Legacy Field       | Current Field                   | Notes                           |
| ------------------ | ------------------------------- | ------------------------------- |
| `masterCaseNumber` | `masterCaseNumber`, `mcn`       | Backward compatibility          |
| `appDetails.*`     | `appDetails.*`                  | Structure preserved             |
| `financials.*`     | `financials.*`                  | Enhanced with additional fields |
| `retroStatus`      | `retroStatus`, `retroRequested` | Boolean + string format         |

### Financial Items

| Legacy Field | Current Field                  | Notes                              |
| ------------ | ------------------------------ | ---------------------------------- |
| `type`       | `type`, `description`          | Dual field support                 |
| `value`      | `value`, `amount`              | Backward compatibility             |
| `source`     | `source`, `verificationSource` | Enhanced verification tracking     |
| `owner`      | `owner`                        | Preserved (applicant/spouse/joint) |

## Safety Features

### Automatic Backups

- Creates timestamped backups in `Data/backups/`
- Preserves original data before migration
- Enables easy rollback if needed

### Validation

- Validates required fields before migration
- Checks data integrity after migration
- Reports missing or invalid data

### Duplicate Prevention

- Checks for existing records by ID
- Prevents duplicate case/people records
- Merges with existing data safely

## Migration Process

1. **Backup Creation**: Automatic backup of existing data
2. **Data Reading**: Loads and validates legacy data
3. **Format Detection**: Determines input format (single case vs complete)
4. **Field Mapping**: Maps legacy fields to current schema
5. **Relationship Establishment**: Creates family/representative links
6. **Data Merging**: Safely merges with existing records
7. **Validation**: Validates migrated data integrity
8. **Report Generation**: Provides migration summary

## Example Migration Session

```bash
$ node .vscode/data-migration.js Data/legacy-data.json Data/nightingale-data.json

Nightingale CMS Data Migration Tool
===================================
Input: Data/legacy-data.json
Output: Data/nightingale-data.json

🚀 Starting Nightingale CMS Data Migration...
📖 Reading legacy data from: Data/legacy-data.json
✅ Legacy data loaded successfully
✅ Backup created: Data/backups/backup-2025-08-18T18-55-30-503Z.json
🔄 Migrating complete data structure...
💾 Writing migrated data to: Data/nightingale-data.json
🔍 Validating migrated data...

📊 Migration Summary:
   People: 3
   Cases: 1
   Cases with Financials: 1
   People with Relationships: 1

🛡️  Backup available at: Data/backups/backup-2025-08-18T18-55-30-503Z.json

✅ Migration completed successfully!
```

## Error Handling

### Common Issues

1. **Missing Required Fields**
   - Error: "Missing required fields for cases: id, personId"
   - Solution: Ensure legacy data has all required fields

2. **Invalid Date Formats**
   - Warning: "Invalid date format: 2025-13-01"
   - Solution: Check and correct date formats in legacy data

3. **Duplicate Records**
   - Warning: "Case 123 already exists, skipping..."
   - Solution: Review duplicate detection logic or clean source data

### Rollback Procedure

If migration fails or produces unexpected results:

1. **Stop the application**
2. **Restore from backup**:
   ```bash
   cp Data/backups/backup-[timestamp].json Data/nightingale-data.json
   ```
3. **Review error messages**
4. **Fix legacy data issues**
5. **Re-run migration**

## Advanced Configuration

### Customizing Default Paths

```javascript
const CONFIG = {
  backupDir: './Data/backups',
  defaultInput: './Data/legacy-data.json',
  defaultOutput: './Data/nightingale-data.json',
};
```

### Required Fields Validation

```javascript
const requiredFields = {
  cases: ['id', 'personId', 'status'],
  people: ['id', 'name'],
  organizations: ['id', 'name'],
};
```

## Best Practices

1. **Always backup** before running migrations
2. **Test with sample data** before production migration
3. **Validate legacy data** for completeness before migration
4. **Review migration reports** for any warnings or issues
5. **Keep backups** for several migration cycles
6. **Run in staging environment** first when possible

## Support

For migration issues or questions:

1. Check the migration logs for specific error messages
2. Verify legacy data format matches expected structure
3. Review the backup files to ensure data preservation
4. Test with smaller data sets to isolate issues

## File Locations

- **Migration Script**: `.vscode/data-migration.js`
- **Example Files**: `Data/example-legacy-*.json`
- **Backups**: `Data/backups/backup-*.json`
- **Current Data**: `Data/nightingale-data.json`
