import { toast } from 'sonner';

export class AppError extends Error {
  constructor(message, code = 'GENERIC_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

export class AuthError extends AppError {
  constructor(message) {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class NetworkError extends AppError {
  constructor(message) {
    super(message, 'NETWORK_ERROR', 0);
  }
}

export const handleApiError = (error, context = '') => {
  console.error(`API Error ${context}:`, error);
  
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'UNKNOWN_ERROR';
  
  if (error instanceof AppError) {
    errorMessage = error.message;
    errorCode = error.code;
  } else if (error.response) {
    // API responded with error status
    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    errorCode = error.response.data?.code || 'API_ERROR';
  } else if (error.request) {
    // Network error
    errorMessage = 'Network error. Please check your connection.';
    errorCode = 'NETWORK_ERROR';
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return {
    message: errorMessage,
    code: errorCode,
    originalError: error
  };
};

export const showErrorToast = (error, context = '') => {
  const { message } = handleApiError(error, context);
  
  toast.error('Error', {
    description: message,
    duration: 5000,
  });
};

export const showSuccessToast = (message, description = '') => {
  toast.success(message, {
    description,
    duration: 3000,
  });
};

export const withErrorHandling = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const handled = handleApiError(error);
      throw new AppError(handled.message, handled.code);
    }
  };
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Please enter a valid email address', 'email');
  }
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[\d\s-()]+$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Please enter a valid phone number', 'phone');
  }
};

export const validatePostalCode = (postalCode) => {
  const postalRegex = /^\d{6}$/;
  if (!postalRegex.test(postalCode)) {
    throw new ValidationError('Please enter a valid 6-digit postal code', 'postalCode');
  }
};

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry on validation errors or auth errors
      if (error instanceof ValidationError || error instanceof AuthError) {
        break;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Global error boundary helper
export const logError = (error, errorInfo = {}) => {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    ...errorInfo,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service (e.g., Sentry, LogRocket)
  }
};