// Service to load embedded static sample dataset for UAT without requiring file system connection.
// Keeps logic minimal and normalizes shape similar to generated sampleData.

export async function loadEmbeddedSampleData(url = '/sample-data.json') {
  const candidateUrls = [url, '/public/sample-data.json', './sample-data.json'];
  let lastError = null;
  for (const u of candidateUrls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(u, { cache: 'no-store' });
      if (!res || !res.ok)
        throw new Error(`Request failed (${res?.status || 'no status'})`);
      // eslint-disable-next-line no-await-in-loop
      const raw = await res.json();
      const people = Array.isArray(raw.people) ? raw.people.slice() : [];
      const cases = Array.isArray(raw.cases) ? raw.cases.slice() : [];
      const organizations = Array.isArray(raw.organizations)
        ? raw.organizations.slice()
        : [];
      const enriched = {
        people,
        cases,
        organizations,
        nextPersonId: people.length + 1,
        nextCaseId: cases.length + 1,
        nextOrganizationId: organizations.length + 1,
        nextFinancialItemId: 1,
        nextNoteId: 1,
        showAllCases: true,
        showAllContacts: false,
        showAllPeople: true,
        showAllOrganizations: true,
        caseSortReversed: false,
        priorityFilterActive: false,
        contacts: [],
        vrTemplates: [],
        nextVrTemplateId: 1,
        vrCategories: [],
        vrRequests: [],
        nextVrRequestId: 1,
        vrDraftItems: [],
        activeCase: null,
        isDataLoaded: true,
        meta: raw.meta || { source: 'embedded-sample' },
      };
      return enriched;
    } catch (err) {
      lastError = err;
      // continue to next
    }
  }
  globalThis.NightingaleLogger?.get?.('staticSampleLoader')?.error?.(
    'Failed to load embedded sample',
    { error: lastError?.message },
  );
  throw lastError || new Error('Failed to load embedded sample');
}

export default loadEmbeddedSampleData;
