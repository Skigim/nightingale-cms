// Service to load embedded static sample dataset for UAT without requiring file system connection.
// Keeps logic minimal and normalizes shape similar to generated sampleData.

export async function loadEmbeddedSampleData(url = '/sample-data.json') {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res || !res.ok)
      throw new Error(`Request failed (${res?.status || 'no status'})`);
    const raw = await res.json();
    const people = Array.isArray(raw.people) ? raw.people.slice() : [];
    const cases = Array.isArray(raw.cases) ? raw.cases.slice() : [];
    const organizations = Array.isArray(raw.organizations)
      ? raw.organizations.slice()
      : [];

    // Provide counters/flags expected by parts of app (align with generateSampleData defaults where safe)
    const enriched = {
      people,
      cases,
      organizations,
      // Derive next ids counts (simple increment)
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
    globalThis.NightingaleLogger?.get?.('staticSampleLoader')?.error?.(
      'Failed to load embedded sample',
      { error: err.message },
    );
    throw err;
  }
}

export default loadEmbeddedSampleData;
