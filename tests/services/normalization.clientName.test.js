/**
 * @jest-environment node
 */
import { normalizeDataMigrations } from '../../src/services/nightingale.datamanagement.js';

describe('normalizeDataMigrations clientName backfill', () => {
  test('derives person.name and case.clientName when missing', async () => {
    const input = {
      people: [{ id: 'p1', firstName: 'Jane', lastName: 'Doe' }],
      cases: [{ id: 'c1', personId: 'p1', status: 'Active' }],
    };
    const out = await normalizeDataMigrations(input);
    expect(out.people[0].name).toBe('Jane Doe');
    expect(out.cases[0].clientName).toBe('Jane Doe');
  });
});
