#!/usr/bin/env node

/**
 * Nightingale CMS Data Generator
 *
 * Generates realistic test data based on the templates in DATA-TEMPLATES.md
 * Creates a complete nightingale-data.json file with interconnected entities
 *
 * Usage:
 *   node generate-data.js [cases] [people] [organizations]
 *   node generate-data.js 50 100 25
 *
 * Default: 10 cases, 20 people, 5 organizations
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_COUNTS = {
  cases: 10,
  people: 20,
  organizations: 5,
};

// Sample data pools for realistic generation
const SAMPLE_DATA = {
  firstNames: [
    'Sarah',
    'Michael',
    'Jessica',
    'David',
    'Ashley',
    'Christopher',
    'Amanda',
    'Joshua',
    'Jennifer',
    'Matthew',
    'Elizabeth',
    'Daniel',
    'Emily',
    'Anthony',
    'Kimberly',
    'Mark',
    'Melissa',
    'Steven',
    'Michelle',
    'Andrew',
    'Linda',
    'Kenneth',
    'Carol',
    'Paul',
    'Lisa',
    'Brian',
    'Nancy',
    'Edward',
    'Karen',
    'Ronald',
    'Betty',
    'Timothy',
    'Helen',
    'Jason',
    'Sandra',
    'Jeffrey',
    'Donna',
    'Ryan',
    'Ruth',
    'Jacob',
  ],

  lastNames: [
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Perez',
    'Thompson',
    'White',
    'Harris',
    'Sanchez',
    'Clark',
    'Ramirez',
    'Lewis',
    'Robinson',
    'Walker',
    'Young',
    'Allen',
    'King',
    'Wright',
    'Scott',
    'Torres',
    'Nguyen',
    'Hill',
    'Flores',
    'Green',
  ],

  middleNames: [
    'James',
    'Marie',
    'Ann',
    'Lee',
    'Michael',
    'Lynn',
    'Rose',
    'Grace',
    'Jane',
    'Elizabeth',
    'Nicole',
    'Michelle',
    'Alan',
    'Thomas',
    'William',
    'David',
    'Robert',
  ],

  cities: [
    'Springfield',
    'Franklin',
    'Georgetown',
    'Madison',
    'Riverside',
    'Oak Hill',
    'Fairview',
    'Salem',
    'Kingston',
    'Greenville',
    'Bristol',
    'Clinton',
    'Oxford',
    'Warren',
    'Auburn',
    'Marion',
    'Lancaster',
    'Ashland',
    'Dover',
    'Hudson',
  ],

  states: [
    'AL',
    'AK',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'FL',
    'GA',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'OH',
    'OK',
    'OR',
    'PA',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'UT',
    'VT',
    'VA',
    'WA',
    'WV',
    'WI',
    'WY',
  ],

  streets: [
    'Main Street',
    'First Street',
    'Second Street',
    'Park Avenue',
    'Oak Street',
    'Pine Street',
    'Maple Avenue',
    'Cedar Lane',
    'Elm Street',
    'Washington Street',
    'Church Street',
    'Mill Road',
    'School Street',
    'High Street',
    'Court Street',
    'Spring Street',
    'Center Street',
    'Franklin Street',
    'Hill Street',
    'Union Street',
  ],

  organizationNames: [
    'Community Services Center',
    'Vocational Rehabilitation Services',
    'Support Services Inc',
    'Independence Living Center',
    'Career Development Institute',
    'Disability Services Network',
    'Employment Training Center',
    'Life Skills Institute',
    'Rehabilitation Services LLC',
    'Community Support Network',
    'Adaptive Services Group',
    'Skills Training Center',
    'Workforce Development Agency',
    'Accessibility Solutions',
    'Recovery Services Center',
  ],

  organizationTypes: [
    'Non-Profit',
    'Government Agency',
    'Private Company',
    'Healthcare Provider',
    'Educational Institution',
    'Community Organization',
    'Service Provider',
  ],

  services: [
    'Case Management',
    'Vocational Training',
    'Support Services',
    'Job Placement',
    'Skills Assessment',
    'Career Counseling',
    'Disability Services',
    'Independent Living',
    'Transportation Services',
    'Equipment Provision',
    'Educational Support',
    'Mental Health Services',
    'Physical Therapy',
    'Occupational Therapy',
  ],

  caseStatuses: ['Pending', 'Active', 'Suspended', 'Closed'],
  caseTypes: ['SIMP', 'LTC', 'Waiver'],

  resourceTypes: [
    'Checking Account',
    'Savings Account',
    'Vehicle',
    'Real Estate',
    'Investment Account',
  ],
  incomeTypes: [
    'Employment Income',
    'SSDI',
    'Social Security',
    'Pension',
    'Unemployment Benefits',
  ],
  expenseTypes: [
    'Housing',
    'Medical',
    'Transportation',
    'Utilities',
    'Food',
    'Insurance',
  ],

  noteCategories: [
    'initial',
    'contact',
    'assessment',
    'employment',
    'follow-up',
  ],

  relationships: [
    'spouse',
    'parent',
    'child',
    'attorney',
    'guardian',
    'representative',
    'case-manager',
  ],

  livingArrangements: [
    'Independent',
    'With Family',
    'Assisted Living',
    'Group Home',
    'Nursing Home',
    'Not specified',
  ],
};

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBoolean(probability = 0.5) {
  return Math.random() < probability;
}

function generateId(prefix, index) {
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

function generateDate(daysAgo = 365) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date.toISOString();
}

function generatePhoneNumber() {
  const area = randomInt(200, 999);
  const exchange = randomInt(200, 999);
  const number = randomInt(1000, 9999);
  return `(${area}) ${exchange}-${number}`;
}

function generateSSN() {
  const area = randomInt(100, 999);
  const group = randomInt(10, 99);
  const serial = randomInt(1000, 9999);
  return `${area}-${group}-${serial}`;
}

function generateMCN() {
  return String(randomInt(10000, 99999));
}

function generateAddress() {
  const streetNumber = randomInt(100, 9999);
  const street = randomChoice(SAMPLE_DATA.streets);
  const city = randomChoice(SAMPLE_DATA.cities);
  const state = randomChoice(SAMPLE_DATA.states);
  const zip = String(randomInt(10000, 99999));

  return {
    street: `${streetNumber} ${street}`,
    city,
    state,
    zip,
  };
}

function generateEmail(firstName, lastName) {
  const domains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'example.com',
  ];
  const domain = randomChoice(domains);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `${username}@${domain}`;
}

function generatePerson(index, relationship = 'client') {
  const firstName = randomChoice(SAMPLE_DATA.firstNames);
  const lastName = randomChoice(SAMPLE_DATA.lastNames);
  const middleName = randomBoolean(0.6)
    ? randomChoice(SAMPLE_DATA.middleNames)
    : null;
  const name = middleName
    ? `${firstName} ${middleName} ${lastName}`
    : `${firstName} ${lastName}`;

  const person = {
    id: generateId('person', index),
    name,
    firstName,
    lastName,
    status: randomChoice(['active', 'inactive']),
    dateAdded: generateDate(730),
    lastUpdated: generateDate(30),
    relationship,
    tags: [],
  };

  // Optional fields
  if (randomBoolean(0.7)) {
    person.middleName = middleName;
  }

  if (randomBoolean(0.8)) {
    person.ssn = generateSSN();
  }

  if (randomBoolean(0.9)) {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - randomInt(18, 85));
    person.dateOfBirth = birthDate.toISOString();
  }

  if (randomBoolean(0.9)) {
    person.phone = generatePhoneNumber();
  }

  if (randomBoolean(0.8)) {
    person.email = generateEmail(firstName, lastName);
  }

  if (randomBoolean(0.8)) {
    person.address = generateAddress();
  }

  if (randomBoolean(0.3)) {
    person.mailingAddress = {
      ...generateAddress(),
      sameAsPhysical: false,
    };
  }

  if (randomBoolean(0.4)) {
    person.notes = `Additional information about ${name}`;
  }

  // Tags based on relationship
  person.tags.push(relationship);
  if (person.status === 'active') {
    person.tags.push('active');
  }

  return person;
}

function generateOrganization(index) {
  const nameBase = randomChoice(SAMPLE_DATA.organizationNames);
  const city = randomChoice(SAMPLE_DATA.cities);
  const name = `${city} ${nameBase}`;

  const org = {
    id: generateId('org', index),
    name,
    type: randomChoice(SAMPLE_DATA.organizationTypes),
    status: randomChoice(['active', 'inactive']),
    dateAdded: generateDate(1095),
    lastUpdated: generateDate(60),
    tags: ['service-provider'],
  };

  if (randomBoolean(0.9)) {
    org.phone = generatePhoneNumber();
  }

  if (randomBoolean(0.8)) {
    const domain =
      name
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '') + '.org';
    org.email = `info@${domain}`;
    org.website = `https://www.${domain}`;
  }

  if (randomBoolean(0.9)) {
    org.address = generateAddress();
  }

  if (randomBoolean(0.7)) {
    const contactFirst = randomChoice(SAMPLE_DATA.firstNames);
    const contactLast = randomChoice(SAMPLE_DATA.lastNames);
    org.contactPerson = {
      name: `${contactFirst} ${contactLast}`,
      title: randomChoice(['Director', 'Manager', 'Coordinator', 'Supervisor']),
      phone: generatePhoneNumber(),
      email: `${contactFirst.toLowerCase()}.${contactLast.toLowerCase()}@${org.email?.split('@')[1] || 'example.com'}`,
    };
  }

  if (randomBoolean(0.8)) {
    const numServices = randomInt(2, 5);
    org.services = [];
    const availableServices = [...SAMPLE_DATA.services];
    for (let i = 0; i < numServices && availableServices.length > 0; i++) {
      const serviceIndex = randomInt(0, availableServices.length - 1);
      org.services.push(availableServices.splice(serviceIndex, 1)[0]);
    }
  }

  if (randomBoolean(0.5)) {
    org.notes = `Service provider in ${city} area`;
  }

  if (org.status === 'active') {
    org.tags.push('active');
  }

  return org;
}

function generateFinancialItem(type, itemType, index) {
  const descriptions = {
    resources: SAMPLE_DATA.resourceTypes,
    income: SAMPLE_DATA.incomeTypes,
    expenses: SAMPLE_DATA.expenseTypes,
  };

  const description = randomChoice(descriptions[type]);
  const amount = randomInt(100, 5000);

  return {
    id: `${type.slice(0, -1)}-${String(index).padStart(3, '0')}`,
    description,
    type: description, // Legacy compatibility
    amount,
    value: amount, // Legacy compatibility
    frequency: randomChoice(['monthly', 'weekly', 'annually', 'one-time']),
    dateAdded: generateDate(180),
    source: randomChoice([
      'Bank Statement',
      'Pay Stub',
      'Tax Return',
      'Invoice',
      'Receipt',
    ]),
    verificationSource: randomChoice([
      'Bank Statement',
      'Pay Stub',
      'Tax Return',
      'Invoice',
      'Receipt',
    ]),
    location:
      type === 'resources' ? 'Financial Institution' : 'Employer/Agency',
    notes: `${description} for case management`,
    verified: randomBoolean(0.7),
  };
}

function generateCase(index, people, organizations) {
  const clientPerson =
    people.find((p) => p.relationship === 'client') || people[0];
  const mcn = generateMCN();

  const caseData = {
    id: generateId('case', index),
    mcn,
    masterCaseNumber: mcn,
    clientName: clientPerson.name,
    personId: clientPerson.id,
    status: randomChoice(SAMPLE_DATA.caseStatuses),
    priority: randomBoolean(0.2),
    caseType: randomChoice(SAMPLE_DATA.caseTypes),
    serviceType: randomChoice(SAMPLE_DATA.caseTypes),
    createdDate: generateDate(365),
    lastUpdated: generateDate(7),
    retroRequested: randomChoice(['Yes', 'No']),
  };

  // Optional fields
  if (randomBoolean(0.8)) {
    caseData.applicationDate = generateDate(400);
  }

  if (randomBoolean(0.6)) {
    caseData.description = `Case for ${clientPerson.name} - ${caseData.caseType} services`;
  }

  if (randomBoolean(0.3)) {
    caseData.withWaiver = randomBoolean();
  }

  if (randomBoolean(0.7)) {
    caseData.livingArrangement = randomChoice(SAMPLE_DATA.livingArrangements);
  }

  if (randomBoolean(0.5) && organizations.length > 0) {
    const org = randomChoice(organizations);
    caseData.organizationAddress = `${org.address?.street || 'Unknown'}, ${org.address?.city || 'Unknown'}`;
  }

  if (randomBoolean(0.9) && clientPerson.address) {
    caseData.clientAddress = clientPerson.address;
  }

  // Authorized representatives
  if (randomBoolean(0.4)) {
    const numReps = randomInt(1, 2);
    caseData.authorizedReps = [];
    for (let i = 0; i < numReps; i++) {
      const repPerson = people.find(
        (p) =>
          p.relationship === 'attorney' || p.relationship === 'representative'
      );
      if (repPerson) {
        caseData.authorizedReps.push({
          id: repPerson.id,
          name: repPerson.name,
          relationship: repPerson.relationship,
          phone: repPerson.phone || generatePhoneNumber(),
          email:
            repPerson.email ||
            generateEmail(repPerson.firstName, repPerson.lastName),
        });
      }
    }
  }

  // Application details
  if (randomBoolean(0.7)) {
    caseData.appDetails = {
      appDate: caseData.applicationDate || caseData.createdDate,
      caseType: caseData.caseType,
      serviceType:
        caseData.caseType === 'SIMP'
          ? 'Simplified Services'
          : caseData.caseType === 'LTC'
            ? 'Long-term Care'
            : 'Waiver Services',
    };
  }

  // Financial information
  if (randomBoolean(0.8)) {
    caseData.financials = {
      resources: [],
      income: [],
      expenses: [],
    };

    // Generate random financial items
    const numResources = randomInt(0, 3);
    for (let i = 0; i < numResources; i++) {
      caseData.financials.resources.push(
        generateFinancialItem('resources', 'resource', i + 1)
      );
    }

    const numIncome = randomInt(1, 2);
    for (let i = 0; i < numIncome; i++) {
      caseData.financials.income.push(
        generateFinancialItem('income', 'income', i + 1)
      );
    }

    const numExpenses = randomInt(1, 4);
    for (let i = 0; i < numExpenses; i++) {
      caseData.financials.expenses.push(
        generateFinancialItem('expenses', 'expense', i + 1)
      );
    }
  }

  // Notes
  if (randomBoolean(0.9)) {
    const numNotes = randomInt(1, 3);
    caseData.notes = [];
    for (let i = 0; i < numNotes; i++) {
      caseData.notes.push({
        id: `note-${String(i + 1).padStart(3, '0')}`,
        title: `Case Note ${i + 1}`,
        content: `Case management note for ${clientPerson.name}`,
        author: 'Case Manager',
        date: generateDate(30),
        category: randomChoice(SAMPLE_DATA.noteCategories),
        lastModified: generateDate(7),
      });
    }
  }

  // Todos
  if (randomBoolean(0.7)) {
    const numTodos = randomInt(1, 3);
    caseData.todos = [];
    for (let i = 0; i < numTodos; i++) {
      const isCompleted = randomBoolean(0.3);
      caseData.todos.push({
        id: `todo-${String(i + 1).padStart(3, '0')}`,
        task: `Complete ${randomChoice(['assessment', 'documentation', 'verification', 'review'])}`,
        status: isCompleted ? 'completed' : 'pending',
        dueDate: generateDate(-30), // Future date
        completedDate: isCompleted ? generateDate(7) : '',
        assignedTo: 'Case Manager',
        priority: randomChoice(['high', 'medium', 'low']),
        notes: 'Task notes',
      });
    }
  }

  // VR Requests
  if (randomBoolean(0.6)) {
    const numVR = randomInt(1, 2);
    caseData.vrRequests = [];
    for (let i = 0; i < numVR; i++) {
      const isCompleted = randomBoolean(0.4);
      caseData.vrRequests.push({
        id: `vr-${String(i + 1).padStart(3, '0')}`,
        type: randomChoice(['Assessment', 'Training', 'Equipment', 'Support']),
        status: isCompleted ? 'completed' : 'pending',
        requestDate: generateDate(60),
        completedDate: isCompleted ? generateDate(30) : '',
        notes: 'VR service request',
        assignedTo: 'VR Counselor',
        description: 'Vocational rehabilitation service',
      });
    }
  }

  // Verification request
  if (randomBoolean(0.5)) {
    const isCompleted = randomBoolean(0.6);
    caseData.verificationRequest = {
      requestType: randomChoice([
        'Financial',
        'Medical',
        'Employment',
        'Identity',
      ]),
      status: isCompleted ? 'completed' : 'pending',
      dateRequested: generateDate(45),
      dateCompleted: isCompleted ? generateDate(15) : '',
      notes: 'Verification of information',
      requestedBy: 'Case Manager',
      completedBy: isCompleted ? 'Verification Team' : '',
    };
  }

  // Search text and sources
  caseData.searchableText = `${clientPerson.name} ${caseData.caseType} ${caseData.status}`;
  caseData.source = 'Application Form';
  caseData.verificationSource = 'Application Form';

  return caseData;
}

function generateData(counts) {
  console.log(
    `Generating ${counts.cases} cases, ${counts.people} people, ${counts.organizations} organizations...`
  );

  const data = {
    cases: [],
    people: [],
    organizations: [],
  };

  // Generate people first (needed for case references)
  for (let i = 1; i <= counts.people; i++) {
    const relationships = [
      'client',
      'spouse',
      'parent',
      'attorney',
      'representative',
      'case-manager',
    ];
    const relationship =
      i <= counts.cases ? 'client' : randomChoice(relationships);
    data.people.push(generatePerson(i, relationship));
  }

  // Generate organizations
  for (let i = 1; i <= counts.organizations; i++) {
    data.organizations.push(generateOrganization(i));
  }

  // Generate cases (referencing people and organizations)
  for (let i = 1; i <= counts.cases; i++) {
    data.cases.push(generateCase(i, data.people, data.organizations));
  }

  return data;
}

function main() {
  const args = process.argv.slice(2);
  const counts = {
    cases: parseInt(args[0]) || DEFAULT_COUNTS.cases,
    people: parseInt(args[1]) || DEFAULT_COUNTS.people,
    organizations: parseInt(args[2]) || DEFAULT_COUNTS.organizations,
  };

  console.log('Nightingale CMS Data Generator');
  console.log('===============================');

  const data = generateData(counts);

  const outputPath = path.join(
    __dirname,
    '..',
    'Data',
    'nightingale-data-generated.json'
  );

  // Ensure Data directory exists
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`\nGenerated data written to: ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`- Cases: ${data.cases.length}`);
  console.log(`- People: ${data.people.length}`);
  console.log(`- Organizations: ${data.organizations.length}`);
  console.log(
    `\nFile size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  generateData,
  generatePerson,
  generateOrganization,
  generateCase,
};
