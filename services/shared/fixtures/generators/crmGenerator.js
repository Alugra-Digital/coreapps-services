import { faker } from '@faker-js/faker';

export function generateLeads(count = 500) {
  const sources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Email Campaign', 'Social Media', 'Partner'];
  const industries = ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Hospitality'];
  
  return Array.from({ length: count }, (_, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const company = faker.company.name();
    const createdAt = faker.date.past({ years: 1 });
    
    return {
      leadId: `LEAD-${String(i + 1).padStart(5, '0')}`,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      company,
      email: faker.internet.email({ firstName, lastName, provider: company.toLowerCase().replace(/\s+/g, '') + '.com' }),
      phone: `+62 8${faker.string.numeric(9)}`,
      mobile: `+62 8${faker.string.numeric(10)}`,
      jobTitle: faker.person.jobTitle(),
      status: faker.helpers.arrayElement(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']),
      source: faker.helpers.arrayElement(sources),
      industry: faker.helpers.arrayElement(industries),
      website: faker.internet.url(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.helpers.arrayElement(['Indonesia', 'Singapore', 'Malaysia', 'Thailand']),
      notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.4 }),
      estimatedValue: faker.number.int({ min: 10000000, max: 500000000 }), // IDR 10M - 500M
      expectedCloseDate: faker.date.future({ years: 0.5 }),
      leadScore: faker.number.int({ min: 0, max: 100 }),
      tags: faker.helpers.arrayElements(['Hot', 'Warm', 'Cold', 'Enterprise', 'SME', 'Startup'], { min: 1, max: 3 }),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() })
    };
  });
}

export function generateOpportunities(leads, clients, count = 300) {
  const stages = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const stageWeights = [0.15, 0.20, 0.25, 0.20, 0.15, 0.05];
  
  return Array.from({ length: count }, (_, i) => {
    const hasLead = faker.datatype.boolean(0.6);
    const lead = hasLead && leads?.length ? faker.helpers.arrayElement(leads) : null;
    const client = !hasLead && clients?.length ? faker.helpers.arrayElement(clients) : null;
    
    const stage = faker.helpers.weightedArrayElement(
      stages.map((s, idx) => ({ weight: stageWeights[idx], value: s }))
    );
    
    const createdAt = faker.date.past({ years: 1 });
    const expectedCloseDate = faker.date.future({ years: 0.5 });
    
    // Probability based on stage
    const probabilityByStage = {
      'PROSPECTING': faker.number.int({ min: 10, max: 25 }),
      'QUALIFICATION': faker.number.int({ min: 20, max: 40 }),
      'PROPOSAL': faker.number.int({ min: 40, max: 60 }),
      'NEGOTIATION': faker.number.int({ min: 60, max: 85 }),
      'CLOSED_WON': 100,
      'CLOSED_LOST': 0
    };
    
    return {
      opportunityId: `OPP-${String(i + 1).padStart(5, '0')}`,
      name: faker.helpers.arrayElement([
        `${lead?.company || client?.name || faker.company.name()} - ${faker.commerce.productName()}`,
        `${faker.commerce.productAdjective()} ${faker.commerce.department()} Project`,
        `Q${faker.number.int({ min: 1, max: 4 })} ${new Date().getFullYear()} Deal`
      ]),
      leadId: lead?.id || null,
      clientId: client?.id || null,
      amount: faker.number.int({ min: 25000000, max: 1000000000 }), // IDR 25M - 1B
      probability: probabilityByStage[stage],
      stage,
      expectedCloseDate,
      closeDate: ['CLOSED_WON', 'CLOSED_LOST'].includes(stage) 
        ? faker.date.between({ from: createdAt, to: new Date() })
        : null,
      description: faker.lorem.paragraph(),
      notes: faker.helpers.maybe(() => faker.lorem.paragraphs(2), { probability: 0.3 }),
      nextStep: faker.helpers.maybe(() => faker.helpers.arrayElement([
        'Schedule follow-up call',
        'Send proposal',
        'Negotiate terms',
        'Request for approval',
        'Final review with stakeholders'
      ]), { probability: 0.6 }),
      competitors: faker.helpers.maybe(() => 
        faker.helpers.arrayElements(['Competitor A', 'Competitor B', 'Competitor C', 'In-house solution'], { min: 0, max: 2 })
      , { probability: 0.3 }),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() })
    };
  });
}

export function generateClients(count = 200) {
  const industries = ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Hospitality'];
  const types = ['CUSTOMER', 'VENDOR', 'BOTH'];
  
  return Array.from({ length: count }, (_, i) => {
    const company = faker.company.name();
    const createdAt = faker.date.past({ years: 3 });
    
    return {
      clientId: `CLI-${String(i + 1).padStart(5, '0')}`,
      name: company,
      type: faker.helpers.arrayElement(types),
      industry: faker.helpers.arrayElement(industries),
      email: faker.internet.email({ provider: company.toLowerCase().replace(/\s+/g, '') + '.com' }),
      phone: `+62 21 ${faker.string.numeric(8)}`,
      mobile: `+62 8${faker.string.numeric(10)}`,
      website: faker.internet.url(),
      taxId: `NPWP-${faker.string.numeric(15)}`,
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      province: faker.helpers.arrayElement([
        'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 
        'Banten', 'Bali', 'Sumatera Utara'
      ]),
      postalCode: faker.location.zipCode('#####'),
      country: faker.helpers.arrayElement(['Indonesia', 'Singapore', 'Malaysia']),
      contactPerson: faker.person.fullName(),
      contactEmail: faker.internet.email(),
      contactPhone: `+62 8${faker.string.numeric(10)}`,
      paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 60', 'Net 15', 'Due on Receipt']),
      creditLimit: faker.number.int({ min: 50000000, max: 5000000000 }),
      notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.2 }),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() })
    };
  });
}
