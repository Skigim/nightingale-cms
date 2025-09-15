import { normalizeDataset } from '../../src/services/dataFixes.js';

describe('normalizeDataset vrRequests clientName cleanup', () => {
  it('removes vrRequests.clientName when person resolvable and retains when orphaned', async () => {
    const data = {
      people: [{ id: 'p1', name: 'Alice Resolved' }],
      cases: [
        {
          id: 'c1',
          personId: 'p1',
          vrRequests: [
            { id: 'vr-1', clientName: 'Old Snapshot', type: 'Assessment' },
            { id: 'vr-2', type: 'Training' },
          ],
        },
        {
          id: 'c2',
          personId: 'missing-person',
          vrRequests: [
            { id: 'vr-3', clientName: 'Orphan Snapshot', type: 'Support' },
          ],
        },
        {
          id: 'c3',
          vrRequests: [
            {
              id: 'vr-4',
              clientName: 'No PersonId Snapshot',
              type: 'Equipment',
            },
          ],
        },
      ],
    };

    const result = await normalizeDataset(
      JSON.parse(JSON.stringify(data)),
      null,
      false,
    );
    const { updatedData, summary } = result;

    expect(summary.vrRequestClientNameRemoved).toBe(1); // vr-1 removed
    expect(summary.orphanVrRequestClientNamesRetained).toBe(2); // vr-3 & vr-4 retained

    const c1 = updatedData.cases.find((c) => c.id === 'c1');
    const c2 = updatedData.cases.find((c) => c.id === 'c2');
    const c3 = updatedData.cases.find((c) => c.id === 'c3');

    expect(
      c1.vrRequests.find((v) => v.id === 'vr-1').clientName,
    ).toBeUndefined();
    expect(c2.vrRequests.find((v) => v.id === 'vr-3').clientName).toBe(
      'Orphan Snapshot',
    );
    expect(c3.vrRequests.find((v) => v.id === 'vr-4').clientName).toBe(
      'No PersonId Snapshot',
    );
  });
});
