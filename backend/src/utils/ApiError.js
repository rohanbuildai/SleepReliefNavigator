// Custom API Error class
class ApiError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  getDefaultCode(statusCode) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };
    return codes[statusCode] || 'ERROR';
  }
  
  static badRequest(message = 'Bad request') {
    return new ApiError(400, message, 'BAD_REQUEST');
  }
  
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }
  
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }
  
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }
  
  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message, 'CONFLICT');
  }
  
  static serverError(message = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

module.exports = { ApiError };