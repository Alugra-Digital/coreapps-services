import { db } from '../../../shared/db/index.js';
import { employees, auditLogs } from '../../../shared/db/schema.js';
import { employeeSchema } from '../../../shared/utils/validators.js';

/**
 * Parse CSV text into an array of objects using the header row as keys.
 * Handles quoted fields and trims whitespace.
 */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, respecting quoted fields.
 */
function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current);
  return result;
}

/**
 * Map CSV column headers (snake_case or display names) to schema field names.
 */
function mapCSVRowToSchema(row) {
  const mapping = {
    nik: 'nik',
    name: 'name',
    ktp: 'ktp',
    npwp: 'npwp',
    ptkp: 'ptkp',
    department: 'department',
    position: 'position',
    date_of_birth: 'dateOfBirth',
    dateofbirth: 'dateOfBirth',
    gender: 'gender',
    religion: 'religion',
    marital_status: 'maritalStatus',
    maritalstatus: 'maritalStatus',
    bpjs_kesehatan: 'bpjsKesehatan',
    bpjskesehatan: 'bpjsKesehatan',
    bpjs_ketenagakerjaan: 'bpjsKetenagakerjaan',
    bpjsketenagakerjaan: 'bpjsKetenagakerjaan',
    join_date: 'joinDate',
    joindate: 'joinDate',
    status: 'status',
    bank_name: 'bankName',
    bankname: 'bankName',
    bank_account: 'bankAccount',
    bankaccount: 'bankAccount',
  };

  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
    const schemaKey = mapping[normalizedKey] || normalizedKey;
    if (value !== '') {
      mapped[schemaKey] = value;
    }
  }
  return mapped;
}

/**
 * POST /employees/import
 *
 * Accepts multipart form upload (CSV file).
 * Query params:
 *   - dryRun=true  → validate only, do not insert
 *
 * Returns:
 *   - summary of valid/invalid rows
 *   - errors array with row number and field-level errors
 *   - imported employees (if not dry run)
 */
export const importEmployeesCSV = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No CSV file uploaded', code: 'VALIDATION_ERROR' });
    }

    const dryRun = req.query.dryRun === 'true';
    const csvText = file.buffer.toString('utf-8');
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or has no data rows', code: 'VALIDATION_ERROR' });
    }

    const validRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is header, data starts at row 2
      const mapped = mapCSVRowToSchema(rows[i]);

      const result = employeeSchema.safeParse(mapped);
      if (result.success) {
        validRows.push({ rowNumber, data: result.data });
      } else {
        const fieldErrors = {};
        for (const issue of result.error.issues) {
          const fieldName = issue.path.join('.');
          fieldErrors[fieldName] = issue.message;
        }
        errors.push({ rowNumber, fields: fieldErrors });
      }
    }

    const response = {
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      errors,
      dryRun,
    };

    if (dryRun || validRows.length === 0) {
      return res.json(response);
    }

    // Insert valid employees in a transaction
    const imported = await db.transaction(async (tx) => {
      const results = [];
      for (const { data } of validRows) {
        const [newEmployee] = await tx.insert(employees).values(data).returning();
        results.push(newEmployee);
      }
      return results;
    });

    // Audit log for the import
    await db.insert(auditLogs).values({
      userId: req.user.id,
      actionType: 'BULK_IMPORT',
      targetTable: 'employees',
      targetId: 0,
      oldValue: null,
      newValue: JSON.stringify({ importedCount: imported.length }),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    response.imported = imported;
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message, code: 'ERROR' });
  }
};
