/**
 * Utility functions for handling Supabase RPC errors gracefully
 */

export const handleRpcError = (error, context = 'operation') => {
  console.error(`RPC Error in ${context}:`, error);
  
  // Handle specific RPC error cases
  if (error.message) {
    // Bid submission errors
    if (error.message.includes('already submitted a bid')) {
      return {
        title: 'Bid Already Submitted',
        message: 'You have already submitted a bid for this booking. Please check your bids list.',
        severity: 'warning'
      };
    }
    
    if (error.message.includes('no longer accepting bids')) {
      return {
        title: 'Booking Closed',
        message: 'This booking is no longer accepting bids.',
        severity: 'info'
      };
    }
    
    if (error.message.includes('not eligible')) {
      return {
        title: 'Not Eligible',
        message: 'You are not eligible to bid on this booking.',
        severity: 'warning'
      };
    }
    
    // Bid acceptance errors
    if (error.message.includes('bookings_status_check')) {
      return {
        title: 'Booking Unavailable',
        message: 'This booking is no longer available for bidding.',
        severity: 'warning'
      };
    }
    
    if (error.message.includes('already processed')) {
      return {
        title: 'Already Processed',
        message: 'This bid has already been processed.',
        severity: 'info'
      };
    }
    
    // Database constraint errors
    if (error.code === '23505' || error.message.includes('duplicate key')) {
      return {
        title: 'Duplicate Entry',
        message: 'This action has already been completed.',
        severity: 'warning'
      };
    }
    
    // Permission errors
    if (error.code === '42501' || error.message.includes('permission denied')) {
      return {
        title: 'Permission Denied',
        message: 'You do not have permission to perform this action.',
        severity: 'error'
      };
    }
    
    // Network/connection errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        severity: 'error'
      };
    }
  }
  
  // Generic fallback
  return {
    title: 'Operation Failed',
    message: error.message || `Failed to complete ${context}. Please try again.`,
    severity: 'error'
  };
};

export const showToastForRpcError = (toast, error, context = 'operation') => {
  const errorInfo = handleRpcError(error, context);
  
  toast({
    title: errorInfo.title,
    description: errorInfo.message,
    variant: errorInfo.severity === 'error' ? 'destructive' : 'default',
  });
};

export const isRetryableError = (error) => {
  if (!error.message) return false;
  
  const retryableMessages = [
    'Failed to fetch',
    'NetworkError',
    'timeout',
    'Connection error',
    'temporarily unavailable'
  ];
  
  return retryableMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
};

export const shouldShowNotification = (error) => {
  // Don't show notifications for certain expected errors
  const silentErrors = [
    'already submitted a bid',
    'already processed',
    'no longer accepting bids'
  ];
  
  return !silentErrors.some(msg => 
    error.message?.toLowerCase().includes(msg.toLowerCase())
  );
};