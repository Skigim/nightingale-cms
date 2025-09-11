#!/usr/bin/env node
/**
 * Data Seed Script for Nightingale CMS
 * Generates interconnected organizations, people, and cases.
 */

const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// ---------------- Configuration ----------------
const NUM_ORGANIZATIONS = 20;
const NUM_PEOPLE = 100;
const NUM_CASES = 50;

// Helpers
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateId(prefix) {
  return `${prefix}_${faker.string.uuid()}`;
}

// ---------------- Generate Organizations ----------------
function buildOrganizations() {
  return Array.from({ length: NUM_ORGANIZATIONS }, () => {
    const name = faker.company.name();
    return {
      id: generateId('org'),
      name,
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
      },
      phone: faker.phone.number(),
      createdAt: faker.date.past().toISOString(),
      status: 'active',
    };
  });
}

// ---------------- Generate People ----------------
function buildPeople(organizations) {
  const livingArrOptions = [
    'Apartment/House',
    'Assisted Living',
    'Nursing Home',
    'Other',
  ];
  return Array.from({ length: NUM_PEOPLE }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const livingArrangement = randomItem(livingArrOptions);
    const associatedOrg =
      livingArrangement === 'Assisted Living' ||
      livingArrangement === 'Nursing Home'
        ? randomItem(organizations)
        : null;
    return {
      id: generateId('person'),
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.phone.number(),
      dateOfBirth: faker.date
        .birthdate({ min: 1940, max: 2005, mode: 'year' })
        .toISOString(),
      ssn: faker.number
        .int({ min: 100000000, max: 999999999 })
        .toString()
        .replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3'),
      organizationId: associatedOrg?.id || null,
      livingArrangement,
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
      },
      mailingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode(),
        sameAsPhysical: false,
      },
      authorizedRepIds: [],
      familyMembers: [],
      status: faker.helpers.arrayElement(['active', 'inactive']),
      createdAt: new Date().toISOString(),
      dateAdded: new Date().toISOString(),
    };
  });
}

// ---------------- Generate Cases ----------------
function buildCases(people, organizations) {
  const statusOptions = [
    'Pending',
    'In Progress',
    'Active',
    'Closed',
    'Denied',
  ];
  const caseTypeOptions = ['LTC', 'Waiver', 'SIMP'];
  const livingArrOptions = [
    'Apartment/House',
    'Assisted Living',
    'Nursing Home',
    'Other',
  ];
  return Array.from({ length: NUM_CASES }, () => {
    const person = randomItem(people);
    const caseType = randomItem(caseTypeOptions);
    const livingArrangement = randomItem(livingArrOptions);
    const facilityOrg =
      livingArrangement === 'Assisted Living' ||
      livingArrangement === 'Nursing Home'
        ? randomItem(organizations)
        : null;
    const spouseCandidate =
      caseType === 'SIMP'
        ? randomItem(people.filter((p) => p.id !== person.id))
        : null;
    const mcnNumeric = faker.number
      .int({ min: 10000000, max: 99999999 })
      .toString();
    const authorizedRep =
      Math.random() < 0.2
        ? randomItem(people.filter((p) => p.id !== person.id)).id
        : undefined;
    return {
      id: generateId('case'),
      mcn: mcnNumeric,
      applicationDate: faker.date.past({ years: 1 }).toISOString(),
      caseType,
      personId: person.id,
      spouseId: spouseCandidate ? spouseCandidate.id : '',
      status: randomItem(statusOptions),
      description: faker.lorem.sentence(),
      priority: Math.random() < 0.15,
      livingArrangement,
      withWaiver: Math.random() < 0.3,
      admissionDate:
        livingArrangement === 'Assisted Living' ||
        livingArrangement === 'Nursing Home'
          ? faker.date.past({ years: 1 }).toISOString().split('T')[0]
          : '',
      organizationId: facilityOrg?.id || '',
      authorizedReps: authorizedRep ? [authorizedRep] : [],
      retroRequested: Math.random() < 0.25 ? 'Yes' : 'No',
      financials: { resources: [], income: [], expenses: [] },
      notes: [
        {
          id: generateId('note'),
          author: 'system',
          createdAt: new Date().toISOString(),
          text: faker.lorem.sentence(),
        },
      ],
      createdDate: faker.date.past({ years: 1 }).toISOString(),
      updatedDate: new Date().toISOString(),
    };
  });
}

function main() {
  const organizations = buildOrganizations();
  const people = buildPeople(organizations);
  const cases = buildCases(people, organizations);

  const data = {
    organizations,
    people,
    cases,
    // maintain counters similar to existing file for compatibility
    nextOrganizationId: organizations.length + 1,
    nextPersonId: people.length + 1,
    nextCaseId: cases.length + 1,
    nextFinancialItemId: 1,
    nextNoteId: 1,
    showAllCases: false,
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
  };

  const outPath = path.join(__dirname, '..', 'Data', 'nightingale-data.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(
    `Seed data generated: ${organizations.length} organizations, ${people.length} people, ${cases.length} cases -> ${outPath}`,
  );
}

main();
