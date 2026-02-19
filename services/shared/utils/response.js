export function successResponse(data, message = 'Success', meta = {}) {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

export function paginatedResponse(data, pagination) {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return {
    success: true,
    message: 'Success',
    data,
    meta: {
      timestamp: new Date().toISOString(),
      pagination: {
        page: parseInt(pagination.page),
        limit: parseInt(pagination.limit),
        total: parseInt(pagination.total),
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    }
  };
}

export function createdResponse(data, message = 'Resource created successfully') {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}

export function updatedResponse(data, message = 'Resource updated successfully') {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}

export function deletedResponse(message = 'Resource deleted successfully') {
  return {
    success: true,
    message,
    meta: {
      timestamp: new Date().toISOString()
    }
  };
}
