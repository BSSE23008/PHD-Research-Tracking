/**
 * ResponseView - Standardized API response formatting
 * This module provides consistent response structure across the application
 */

class ResponseView {
  /**
   * Send a successful response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {Object} data - Response data (optional)
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static sendResponse(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {Object} error - Additional error details (optional)
   */
  static sendError(res, message, statusCode = 500, error = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (error !== null) {
      response.error = error;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {Array} items - Array of items
   * @param {Object} pagination - Pagination metadata
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static sendPaginatedResponse(res, message, items, pagination, statusCode = 200) {
    const response = {
      success: true,
      message,
      data: {
        items,
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          itemsPerPage: pagination.itemsPerPage,
          hasNextPage: pagination.hasNextPage,
          hasPrevPage: pagination.hasPrevPage
        }
      },
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send a validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Array of validation errors
   */
  static sendValidationError(res, errors) {
    const response = {
      success: false,
      message: 'Validation failed',
      errors: errors.map(error => ({
        field: error.path || error.field,
        message: error.message || error.msg,
        value: error.value
      })),
      timestamp: new Date().toISOString()
    };

    return res.status(400).json(response);
  }

  /**
   * Send an authentication error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message (optional)
   */
  static sendAuthError(res, message = 'Authentication required') {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    return res.status(401).json(response);
  }

  /**
   * Send an authorization error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message (optional)
   */
  static sendForbiddenError(res, message = 'Access denied') {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    return res.status(403).json(response);
  }

  /**
   * Send a not found error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message (optional)
   */
  static sendNotFoundError(res, message = 'Resource not found') {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    return res.status(404).json(response);
  }

  /**
   * Send a server error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message (optional)
   * @param {Object} error - Error details (optional)
   */
  static sendServerError(res, message = 'Internal server error', error = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (error && process.env.NODE_ENV === 'development') {
      response.error = error;
    }

    return res.status(500).json(response);
  }

  /**
   * Send a custom response with custom status code
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Response message
   * @param {Object} data - Response data (optional)
   * @param {boolean} success - Success status (optional)
   */
  static sendCustomResponse(res, statusCode, message, data = null, success = null) {
    const response = {
      success: success !== null ? success : statusCode < 400,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }
}

// Export individual methods for convenience
module.exports = {
  ResponseView,
  sendResponse: ResponseView.sendResponse,
  sendError: ResponseView.sendError,
  sendPaginatedResponse: ResponseView.sendPaginatedResponse,
  sendValidationError: ResponseView.sendValidationError,
  sendAuthError: ResponseView.sendAuthError,
  sendForbiddenError: ResponseView.sendForbiddenError,
  sendNotFoundError: ResponseView.sendNotFoundError,
  sendServerError: ResponseView.sendServerError,
  sendCustomResponse: ResponseView.sendCustomResponse
}; 