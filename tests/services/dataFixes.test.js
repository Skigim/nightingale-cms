import { backfillClientNames } from '../../src/services/dataFixes.js';

describe('dataFixes.backfillClientNames', () => {
  test('adds clientName for cases referencing people and persists', async () => {
    const dataset = {
      people: [
        { id: 'p1', firstName: 'Jane', lastName: 'Doe' },
        { id: 'p2', name: 'John Smith' },
      ],
      cases: [
        { id: 'c1', personId: 'p1', status: 'Pending' },
        {
          id: 'c2',
          personId: 'p2',
          status: 'Active',
          clientName: 'John Smith',
        },
        { id: 'c3', personId: 'missing', status: 'Active' },
      ],
    };
    const writes = [];
    const fileService = {
      writeFile: async (data) => writes.push(data),
    };
    const { changed, updatedData, persisted } = await backfillClientNames(
      dataset,
      fileService,
    );
    expect(changed).toBe(1); // only c1 gains a clientName
    expect(updatedData.cases.find((c) => c.id === 'c1').clientName).toBe(
      'Jane Doe',
    );
    expect(updatedData.cases.find((c) => c.id === 'c2').clientName).toBe(
      'John Smith',
    );
    expect(persisted).toBe(true);
    expect(writes).toHaveLength(1);
  });

  test('no changes -> no persistence', async () => {
    const dataset = {
      people: [{ id: 'p1', name: 'Jane Doe' }],
      cases: [{ id: 'c1', personId: 'p1', clientName: 'Jane Doe' }],
    };
    const fileService = { writeFile: jest.fn() };
    const { changed, persisted } = await backfillClientNames(
      dataset,
      fileService,
    );
    expect(changed).toBe(0);
    expect(persisted).toBe(false);
    expect(fileService.writeFile).not.toHaveBeenCalled();
  });
});
