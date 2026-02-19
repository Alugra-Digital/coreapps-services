export class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  BAD_REQUEST: 'BAD_REQUEST'
};

export function errorResponse(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || errorCodes.INTERNAL_ERROR;
  
  const response = {
    message: err.message || 'An error occurred',
    code,
    timestamp: new Date().toISOString(),
    path: req.path
  };
  
  // Add validation errors if present (API_STRUCTURE: errors array with field, message)
  if (err.errors) {
    response.errors = Array.isArray(err.errors)
      ? err.errors.map((e) => (typeof e === 'object' && e?.field != null ? e : { field: '', message: String(e) }))
      : [{ field: '', message: String(err.errors) }];
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  // Log error
  if (statusCode >= 500) {
    console.error('Server Error:', {
      code,
      message: err.message,
      path: req.path,
      stack: err.stack
    });
  } else {
    console.warn('Client Error:', {
      code,
      message: err.message,
      path: req.path
    });
  }
  
  res.status(statusCode).json(response);
}

// Helper functions for common errors
export function notFound(message = 'Resource not found') {
  return new ApiError(404, message, errorCodes.NOT_FOUND);
}

export function unauthorized(message = 'Unauthorized access') {
  return new ApiError(401, message, errorCodes.UNAUTHORIZED);
}

export function forbidden(message = 'Forbidden') {
  return new ApiError(403, message, errorCodes.FORBIDDEN);
}

export function badRequest(message = 'Bad request', errors = null) {
  return new ApiError(400, message, errors);
}

export function conflict(message = 'Resource conflict') {
  return new ApiError(409, message, errorCodes.CONFLICT);
}
