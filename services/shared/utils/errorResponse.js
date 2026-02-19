/**
 * Standard error response format per API_STRUCTURE.md
 * { message, code, errors? }
 */
export function formatError(message, code = 'ERROR', errors = null) {
  const body = { message, code };
  if (errors && Array.isArray(errors) && errors.length > 0) {
    body.errors = errors;
  }
  return body;
}

export function formatZodError(zodError) {
  return {
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    errors: zodError.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })),
  };
}
