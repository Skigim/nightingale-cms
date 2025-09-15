import { normalizeDataset } from '../../src/services/dataFixes.js';
describe('dataFixes.normalizeDataset', () => {
  test('normalizes names and removes resolvable clientName snapshots', async () => {
    const dataset = {
      people: [
        { id: 'p1', firstName: 'Jane', lastName: 'Doe' },
        { id: 'p2', name: 'John Smith' },
        { id: 'p3' },
      ],
      cases: [
        { id: 'c1', personId: 'p1', clientName: 'Stale Name' },
        { id: 'c2', personId: 'p2', clientName: 'John Smith' },
        { id: 'c3', personId: 'missing', clientName: 'Orphan' },
      ],
    };
    const writes = [];
    const fileService = { writeFile: async (data) => writes.push(data) };
    const { changed, updatedData, persisted, summary } = await normalizeDataset(
      dataset,
      fileService,
    );
    expect(changed).toBe(1);
    expect(summary.peopleNameFixed).toBe(2); // p1 & p3
    expect(summary.caseClientNameRemoved).toBe(2); // c1 & c2 (both resolvable)
    expect(summary.orphanClientNamesRetained).toBe(1); // c3
    const c1 = updatedData.cases.find((c) => c.id === 'c1');
    const c2 = updatedData.cases.find((c) => c.id === 'c2');
    const c3 = updatedData.cases.find((c) => c.id === 'c3');
    expect(c1.clientName).toBeUndefined();
    expect(c2.clientName).toBeUndefined();
    expect(c3.clientName).toBe('Orphan');
    expect(persisted).toBe(true);
    expect(writes).toHaveLength(1);
  });

  test('idempotent second run -> no persistence', async () => {
    const dataset = {
      people: [{ id: 'p1', firstName: 'Jane', lastName: 'Doe' }],
      cases: [{ id: 'c1', personId: 'p1', clientName: 'Jane Doe' }],
    };
    const fileService = { writeFile: jest.fn() };
    const first = await normalizeDataset(dataset, fileService);
    expect(first.changed).toBe(1);
    const second = await normalizeDataset(first.updatedData, fileService);
    expect(second.changed).toBe(0);
    // Only first run writes
    expect(fileService.writeFile).toHaveBeenCalledTimes(1);
  });
});
