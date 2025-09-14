/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

// Provide minimal global logger mock
globalThis.NightingaleLogger = {
  get: () => ({ error: jest.fn(), info: jest.fn() }),
};

describe('staticSampleLoader service', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('loads and normalizes embedded sample data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        people: [{ id: 'p1', name: 'Test Person' }],
        cases: [{ id: 'c1', title: 'Case 1', personId: 'p1' }],
        organizations: [{ id: 'o1', name: 'Org 1' }],
        meta: { source: 'test' },
      }),
    });
    const { loadEmbeddedSampleData } = await import(
      '../../src/services/staticSampleLoader.js'
    );
    const data = await loadEmbeddedSampleData('/sample-data.json');
    expect(data.people).toHaveLength(1);
    expect(data.cases).toHaveLength(1);
    expect(data.organizations).toHaveLength(1);
    expect(data.meta.source).toBe('test');
    expect(data.isDataLoaded).toBe(true);
  });

  test('throws on network error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const { loadEmbeddedSampleData } = await import(
      '../../src/services/staticSampleLoader.js'
    );
    await expect(loadEmbeddedSampleData('/sample-data.json')).rejects.toThrow(
      /500/,
    );
  });
});
