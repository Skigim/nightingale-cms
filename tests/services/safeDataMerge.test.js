import { safeMergeFullData } from '../../src/services/safeDataMerge.js';

describe('safeMergeFullData', () => {
  test('preserves people array when omitted in partial update', () => {
    const prev = {
      people: [{ id: 'p1', name: 'Person One' }],
      cases: [{ id: 'c1', personId: 'p1' }],
      organizations: [{ id: 'o1', name: 'Org' }],
    };
    const partial = {
      cases: [{ id: 'c1', personId: 'p1', status: 'Updated' }],
    };
    const merged = safeMergeFullData(prev, partial);
    expect(merged.people).toBe(prev.people); // same reference preserved
    expect(merged.cases).toHaveLength(1);
    expect(merged.organizations).toBe(prev.organizations);
  });

  test('allows explicit people replacement when provided', () => {
    const prev = { people: [{ id: 'p1' }], cases: [], organizations: [] };
    const partial = { people: [{ id: 'p2' }] };
    const merged = safeMergeFullData(prev, partial);
    expect(merged.people).toEqual([{ id: 'p2' }]);
  });

  test('handles null partial gracefully', () => {
    const prev = { people: [], cases: [] };
    const merged = safeMergeFullData(prev, null);
    expect(merged.people).toBe(prev.people);
    expect(merged.cases).toBe(prev.cases);
  });
});
