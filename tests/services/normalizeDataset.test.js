import { normalizeDataset } from '../../src/services/dataFixes.js';

describe('normalizeDataset', () => {
  it('returns unchanged when input invalid', async () => {
    const res = await normalizeDataset(null, null, false);
    expect(res.changed).toBe(0);
  });

  it('adds name to people lacking it and removes case.clientName when resolvable', async () => {
    const data = {
      people: [
        { id: 'p1', firstName: 'Jane', lastName: 'Doe' },
        { id: 'p2', name: 'Existing Name' },
        { id: 'p3' },
      ],
      cases: [
        { id: 'c1', personId: 'p1', clientName: 'OLD SNAPSHOT' },
        { id: 'c2', personId: 'pX', clientName: 'Orphan Snapshot' },
        { id: 'c3', personId: 'p2' },
      ],
    };

    const { changed, updatedData, summary } = await normalizeDataset(
      data,
      null,
      false,
    );
    expect(changed).toBe(1);
    expect(summary.peopleNameFixed).toBe(2); // p1 composed, p3 unknown
    expect(summary.caseClientNameRemoved).toBe(1); // c1 removed
    expect(summary.orphanClientNamesRetained).toBe(1); // c2 retained

    const p1 = updatedData.people.find((p) => p.id === 'p1');
    const p3 = updatedData.people.find((p) => p.id === 'p3');
    expect(p1.name).toBe('Jane Doe');
    expect(p3.name).toBe('Unknown Person');

    const c1 = updatedData.cases.find((c) => c.id === 'c1');
    const c2 = updatedData.cases.find((c) => c.id === 'c2');
    expect(c1.clientName).toBeUndefined();
    expect(c2.clientName).toBe('Orphan Snapshot');
  });

  it('is idempotent when run twice', async () => {
    const data = {
      people: [{ id: 'p1', firstName: 'A', lastName: 'B' }],
      cases: [{ id: 'c1', personId: 'p1', clientName: 'AB' }],
    };
    const first = await normalizeDataset(data, null, false);
    const second = await normalizeDataset(first.updatedData, null, false);
    expect(first.changed).toBe(1);
    expect(second.changed).toBe(0);
  });
});
