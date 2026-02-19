import { db } from '../db/index.js';
import { 
  users, employees, clients, leads, opportunities, 
  products, warehouses, invoices, accounts, journalEntries,
  workOrders, boms, leaveTypes
} from '../db/schema.js';
import { generateEmployees } from './generators/employeeGenerator.js';
import { generateInvoices, generateQuotations, generatePayments } from './generators/invoiceGenerator.js';
import { generateLeads, generateOpportunities, generateClients } from './generators/crmGenerator.js';
import { generateProducts, generateWarehouses, generateStockMovements, generateBOMs } from './generators/inventoryGenerator.js';
import { generateChartOfAccounts, generateJournalEntries } from './generators/accountingGenerator.js';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const sizeArg = args.find(arg => arg.startsWith('--size='));

const environment = envArg ? envArg.split('=')[1] : 'dev';
const size = sizeArg ? sizeArg.split('=')[1] : 'medium';

// Size configurations
const sizeConfig = {
  small: {
    users: 5,
    employees: 50,
    clients: 30,
    leads: 100,
    opportunities: 50,
    products: 100,
    warehouses: 2,
    invoices: 100,
    stockMovements: 500,
    journalEntries: 500,
    boms: 20
  },
  medium: {
    users: 20,
    employees: 200,
    clients: 100,
    leads: 500,
    opportunities: 300,
    products: 500,
    warehouses: 5,
    invoices: 1000,
    stockMovements: 2000,
    journalEntries: 5000,
    boms: 100
  },
  large: {
    users: 50,
    employees: 500,
    clients: 300,
    leads: 2000,
    opportunities: 1000,
    products: 2000,
    warehouses: 10,
    invoices: 5000,
    stockMovements: 10000,
    journalEntries: 20000,
    boms: 500
  }
};

const config = sizeConfig[size] || sizeConfig.medium;

async function seedDatabase() {
  console.log(`\n🌱 Starting database seeding...`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Size: ${size}\n`);
  
  try {
    // 1. Seed Users
    console.log('👤 Creating users...');
    const userRecords = [
      { username: 'admin', password: await bcrypt.hash('admin123', 10), role: 'SUPER_ADMIN' },
      { username: 'hr_admin', password: await bcrypt.hash('hr123', 10), role: 'HR_ADMIN' },
      { username: 'finance_admin', password: await bcrypt.hash('finance123', 10), role: 'FINANCE_ADMIN' }
    ];
    
    // Add more users based on config
    for (let i = 3; i < config.users; i++) {
      userRecords.push({
        username: `user${i}`,
        password: await bcrypt.hash('user123', 10),
        role: ['HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN'][i % 3]
      });
    }
    
    const createdUsers = await db.insert(users).values(userRecords).returning();
    console.log(`   ✅ Created ${createdUsers.length} users`);
    
    // 2. Seed Clients
    console.log('🏢 Creating clients...');
    const clientRecords = generateClients(config.clients);
    const createdClients = await db.insert(clients).values(clientRecords).returning();
    console.log(`   ✅ Created ${createdClients.length} clients`);
    
    // 3. Seed Employees
    console.log('👥 Creating employees...');
    const employeeRecords = generateEmployees(config.employees);
    const createdEmployees = await db.insert(employees).values(employeeRecords).returning();
    console.log(`   ✅ Created ${createdEmployees.length} employees`);
    
    // 4. Seed Leave Types (if not exists)
    console.log('🏖️  Creating leave types...');
    const leaveTypeRecords = [
      { name: 'Annual Leave', maxDaysPerYear: 12, carryForward: true, isPaid: true },
      { name: 'Sick Leave', maxDaysPerYear: 12, carryForward: false, isPaid: true },
      { name: 'Maternity Leave', maxDaysPerYear: 90, carryForward: false, isPaid: true },
      { name: 'Paternity Leave', maxDaysPerYear: 3, carryForward: false, isPaid: true },
      { name: 'Unpaid Leave', maxDaysPerYear: 30, carryForward: false, isPaid: false }
    ];
    try {
      const createdLeaveTypes = await db.insert(leaveTypes).values(leaveTypeRecords).returning();
      console.log(`   ✅ Created ${createdLeaveTypes.length} leave types`);
    } catch (error) {
      console.log(`   ⚠️  Leave types may already exist: ${error.message}`);
    }
    
    // 5. Seed Products
    console.log('📦 Creating products...');
    const productRecords = generateProducts(config.products);
    const createdProducts = await db.insert(products).values(productRecords).returning();
    console.log(`   ✅ Created ${createdProducts.length} products`);
    
    // 6. Seed Warehouses
    console.log('🏭 Creating warehouses...');
    const warehouseRecords = generateWarehouses(config.warehouses);
    const createdWarehouses = await db.insert(warehouses).values(warehouseRecords).returning();
    console.log(`   ✅ Created ${createdWarehouses.length} warehouses`);
    
    // 7. Seed BOMs
    console.log('🔧 Creating BOMs...');
    const bomRecords = generateBOMs(createdProducts, config.boms);
    try {
      const createdBOMs = await db.insert(boms).values(bomRecords.map(bom => ({
        bomNumber: bom.bomNumber,
        itemId: bom.productId,
        quantity: bom.quantity,
        isActive: bom.isActive,
        createdAt: bom.createdAt,
        updatedAt: bom.updatedAt
      }))).returning();
      console.log(`   ✅ Created ${createdBOMs.length} BOMs`);
    } catch (error) {
      console.log(`   ⚠️  BOM creation error: ${error.message}`);
    }
    
    // 8. Seed Invoices
    console.log('💰 Creating invoices...');
    const invoiceRecords = generateInvoices(createdClients, config.invoices);
    try {
      const createdInvoices = await db.insert(invoices).values(invoiceRecords.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        clientId: inv.clientId,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        subtotal: inv.subtotal.toString(),
        tax: inv.tax.toString(),
        total: inv.total.toString(),
        notes: inv.notes,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt
      }))).returning();
      console.log(`   ✅ Created ${createdInvoices.length} invoices`);
    } catch (error) {
      console.log(`   ⚠️  Invoice creation error: ${error.message}`);
    }
    
    // 9. Seed CRM Data
    console.log('📊 Creating CRM data...');
    const leadRecords = generateLeads(config.leads);
    const createdLeads = await db.insert(leads).values(leadRecords.map(lead => ({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      notes: lead.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    }))).returning();
    console.log(`   ✅ Created ${createdLeads.length} leads`);
    
    const opportunityRecords = generateOpportunities(createdLeads, createdClients, config.opportunities);
    const createdOpportunities = await db.insert(opportunities).values(opportunityRecords.map(opp => ({
      name: opp.name,
      leadId: opp.leadId,
      clientId: opp.clientId,
      amount: opp.amount.toString(),
      probability: opp.probability,
      stage: opp.stage,
      expectedCloseDate: opp.expectedCloseDate,
      notes: opp.notes,
      createdAt: opp.createdAt,
      updatedAt: opp.updatedAt
    }))).returning();
    console.log(`   ✅ Created ${createdOpportunities.length} opportunities`);
    
    // 10. Seed Chart of Accounts
    console.log('📚 Creating chart of accounts...');
    const accountRecords = generateChartOfAccounts();
    try {
      const createdAccounts = await db.insert(accounts).values(accountRecords.map(acc => ({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        description: acc.description,
        balance: acc.balance.toString(),
        isGroup: acc.isGroup,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt
      }))).returning();
      console.log(`   ✅ Created ${createdAccounts.length} accounts`);
      
      // 11. Seed Journal Entries
      console.log('📝 Creating journal entries...');
      const journalEntryRecords = generateJournalEntries(accountRecords, config.journalEntries);
      const createdEntries = await db.insert(journalEntries).values(journalEntryRecords.map(je => ({
        date: je.date,
        description: je.description,
        reference: je.reference,
        status: je.status,
        totalDebit: je.totalDebit.toString(),
        totalCredit: je.totalCredit.toString(),
        postedAt: je.postedAt,
        createdAt: je.createdAt,
        updatedAt: je.updatedAt
      }))).returning();
      console.log(`   ✅ Created ${createdEntries.length} journal entries`);
    } catch (error) {
      console.log(`   ⚠️  Accounting data creation error: ${error.message}`);
    }
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Clients: ${createdClients.length}`);
    console.log(`   Employees: ${createdEmployees.length}`);
    console.log(`   Products: ${createdProducts.length}`);
    console.log(`   Warehouses: ${createdWarehouses.length}`);
    console.log(`   Leads: ${createdLeads.length}`);
    console.log(`   Opportunities: ${createdOpportunities.length}`);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    console.error(error.stack);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run seeding
seedDatabase();
