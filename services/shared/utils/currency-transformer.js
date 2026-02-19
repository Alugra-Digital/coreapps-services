/**
 * Currency transformation utilities for API responses and requests
 * Ensures consistent handling of monetary values across all services
 */

/**
 * Transform monetary fields from database decimals to JavaScript numbers
 * @param {Object} data - The data object containing monetary fields
 * @param {string[]} fields - Array of field names that contain monetary values
 * @returns {Object} Transformed data with numeric values
 */
export function transformMonetaryFields(data, fields) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // If data is an array, transform each item
  if (Array.isArray(data)) {
    return data.map(item => transformMonetaryFields(item, fields));
  }

  // Create a shallow copy to avoid mutation
  const transformed = { ...data };

  // Transform each monetary field
  fields.forEach(field => {
    if (field in transformed) {
      const value = transformed[field];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        transformed[field] = null;
        return;
      }

      // Convert string decimals to numbers
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        transformed[field] = isNaN(parsed) ? 0 : parsed;
        return;
      }

      // Already a number
      if (typeof value === 'number') {
        transformed[field] = value;
        return;
      }

      // Default to 0 for unexpected types
      transformed[field] = 0;
    }
  });

  return transformed;
}

/**
 * Parse and validate monetary input from API requests
 * @param {Object} data - The request data
 * @param {string[]} fields - Array of field names that should contain monetary values
 * @returns {Object} Validated data with proper numeric values
 * @throws {Error} If validation fails
 */
export function parseMonetaryInput(data, fields) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const validated = { ...data };

  fields.forEach(field => {
    if (field in validated) {
      const value = validated[field];

      // Allow null for optional fields
      if (value === null || value === undefined) {
        validated[field] = null;
        return;
      }

      // Parse string to number
      const parsed = typeof value === 'string' ? parseFloat(value) : value;

      // Validate
      if (typeof parsed !== 'number' || isNaN(parsed)) {
        throw new Error(`Invalid monetary value for field '${field}': ${value}`);
      }

      if (!isFinite(parsed)) {
        throw new Error(`Monetary value for field '${field}' must be finite`);
      }

      if (parsed < 0) {
        throw new Error(`Monetary value for field '${field}' cannot be negative`);
      }

      validated[field] = parsed;
    }
  });

  return validated;
}

/**
 * Middleware to automatically transform monetary fields in responses
 * @param {string[]} fields - Array of monetary field names
 * @returns {Function} Express middleware function
 */
export function currencyTransformMiddleware(fields) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      const transformed = transformMonetaryFields(data, fields);
      return originalJson(transformed);
    };

    next();
  };
}

// Common monetary fields across different modules
export const COMMON_MONETARY_FIELDS = {
  finance: ['subtotal', 'ppn', 'pph', 'grandTotal', 'paidAmount', 'amount', 'balance'],
  accounting: ['debit', 'credit', 'totalDebit', 'totalCredit', 'balance'],
  hr: ['baseSalary', 'allowances', 'deductions', 'gross', 'totalDeductions', 'pph21', 'loanRepayment', 'netPay'],
  inventory: ['price', 'cost', 'valuationRate', 'totalValue'],
  assets: ['purchaseAmount', 'totalDepreciation', 'valueAfterDepreciation', 'amount', 'cost'],
  sales: ['amount', 'commission', 'total'],
};
