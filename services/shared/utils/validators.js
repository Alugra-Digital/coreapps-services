import { z } from 'zod';

// Currency validation schema
export const currencySchema = z.number()
  .positive('Amount must be positive')
  .finite('Amount must be finite');

// Position enum for employees
export const positionEnum = [
  'DIREKTUR',
  'Manajemen Operation',
  'Project Manager',
  'SA',
  'Secretary Office',
  'HR GA',
  'Finance Accounting',
  'Technical Writer',
  'Tenaga Ahli',
  'EOS Oracle',
  'EOS Ticketing',
  'EOS Unsoed'
];

// Tax status enum
export const taxStatusEnum = [
  'TK/0', 'TK/1', 'TK/2', 'TK/3',
  'K/0', 'K/1', 'K/2', 'K/3'
];

// Updated employee schema with all required fields
export const employeeSchema = z.object({
  // Core identifiers
  nik: z.string().min(1, 'NIK is required'),
  name: z.string().min(1, 'Name is required'),
  ktp: z.string().length(16, 'KTP must be 16 digits').regex(/^\d+$/, 'KTP must be numeric'),
  npwp: z.string().optional(),
  ptkp: z.enum(taxStatusEnum).optional(),
  
  // Position and employment
  position: z.enum(positionEnum),
  department: z.string().optional(),
  tmk: z.string().datetime('Invalid date format for TMK'), // Tanggal Mulai Kerja
  joinDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(), // Backward compatibility
  terminationDate: z.string().datetime().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).default('ACTIVE'),
  
  // Contact information
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number'),
  
  // Personal information
  placeOfBirth: z.string().optional(),
  dateOfBirth: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  gender: z.enum(['L', 'P']),
  religion: z.enum(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu']).optional(),
  
  // Family and tax
  maritalStatus: z.enum(['Kawin', 'Belum Kawin']),
  numberOfChildren: z.number().int().min(0).default(0),
  taxStatus: z.enum(taxStatusEnum).default('TK/0'),
  educationLevel: z.string().optional(), // S1, S2, SMA, etc.
  
  // Address
  ktpAddress: z.string().optional(),
  ktpCity: z.string().optional(),
  ktpProvince: z.string().optional(),
  
  // Banking
  bankName: z.string().default('Mandiri'),
  bankAccountNumber: z.string().min(1, 'Bank account number is required'),
  bankAccount: z.string().optional(), // Backward compatibility
  
  // Insurance
  bpjsKesehatan: z.string().optional(),
  bpjsKetenagakerjaan: z.string().optional(),
  jknNumber: z.string().optional(), // JKN/KIS
  jmsNumber: z.string().optional(), // JMS Social Security
});

export const documentUploadSchema = z.object({
  type: z.enum(['KTP', 'NPWP', 'CONTRACT', 'CV', 'OTHER']),
});

// Invoice schema with currency validation
export const invoiceSchema = z.object({
  clientId: z.number().int(),
  items: z.array(z.object({
    productId: z.number().int(),
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: currencySchema,
    total: currencySchema,
  })),
  subtotal: currencySchema,
  ppn: currencySchema.optional(),
  pph: currencySchema.optional(),
  grandTotal: currencySchema,
});
