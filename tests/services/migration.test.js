import {
  detectLegacyProfile,
  runFullMigration,
} from '../../src/services/migration.js';

describe('migration service', () => {
  const legacySample = {
    cases: [
      {
        id: 1,
        masterCaseNumber: 'MCN-OLD-001',
        personId: 10,
        financials: {
          resources: [
            { id: 5, type: 'Savings', value: '1000' },
            { id: 6, description: 'Already Migrated', amount: 200 },
          ],
        },
      },
    ],
    people: [
      { id: 10, firstName: 'Jane', lastName: 'Doe' },
      { id: '11', name: 'John Smith' },
    ],
    organizations: [{ id: 100, name: 'Org' }],
  };

  test('detectLegacyProfile flags indicators', () => {
    const detection = detectLegacyProfile(legacySample);
    expect(detection.isLegacy).toBe(true);
    expect(detection.indicators.hasMasterCaseNumber).toBe(true);
    expect(detection.indicators.numericIds).toBe(true);
    expect(detection.indicators.financialValueField).toBe(true);
    expect(detection.indicators.financialTypeWithoutDescription).toBe(true);
  });

  test('runFullMigration normalizes and reports', async () => {
    const { migratedData, report } = await runFullMigration(legacySample);
    expect(report.legacyDetected).toBe(true);
    // Ensure masterCaseNumber migrated into mcn numeric-only string
    expect(migratedData.cases[0].mcn).toBe('001');
    // Financial item migrated value->amount & type->description while keeping compatibility
    const migratedResource = migratedData.cases[0].financials.resources.find(
      (r) => r.type === 'Savings',
    );
    expect(migratedResource.amount).toBe(1000); // coerced number
    expect(migratedResource.description).toBe('Savings');
    // Person ID & case personId stringified
    expect(typeof migratedData.people[0].id).toBe('string');
    expect(typeof migratedData.cases[0].personId).toBe('string');
    // clientName backfilled
    expect(migratedData.cases[0].clientName).toBe('Jane Doe');
  });
});
