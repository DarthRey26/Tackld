/**
 * Utility functions to filter and format booking data for contractors
 * Ensures sensitive customer information is hidden while preserving job details
 */

// Fields that should be hidden from contractors until bid acceptance
const SENSITIVE_FIELDS = [
  'customer_name',
  'customer_phone', 
  'customer_email',
  'address.street',
  'address.unit_number',
  'address.building_name',
  'address.floor_number',
  'address.access_instructions'
];

// Fields that contractors should see for bidding decisions
const VISIBLE_FIELDS = [
  'id',
  'service_type',
  'booking_type', 
  'scheduled_date',
  'scheduled_time',
  'asap',
  'urgency',
  'description',
  'service_answers',
  'uploaded_images',
  'price_range_min',
  'price_range_max',
  'status',
  'current_stage',
  'created_at',
  'address.city',
  'address.postal_code'
];

/**
 * Filter booking data for contractor view (pre-bid acceptance)
 * @param {Object} booking - Raw booking data
 * @returns {Object} - Filtered booking data safe for contractor viewing
 */
export const filterBookingForContractor = (booking) => {
  if (!booking) return null;

  return {
    id: booking.id,
    service_type: booking.service_type,
    booking_type: booking.booking_type,
    scheduled_date: booking.scheduled_date,
    scheduled_time: booking.scheduled_time,
    asap: booking.asap,
    urgency: booking.urgency,
    description: booking.description,
    service_answers: booking.service_answers,
    uploaded_images: booking.uploaded_images,
    price_range_min: booking.price_range_min,
    price_range_max: booking.price_range_max,
    status: booking.status,
    current_stage: booking.current_stage,
    created_at: booking.created_at,
    // Limited address info (general area only)
    address: {
      city: booking.address?.city || 'Singapore',
      postal_code: booking.address?.postal_code
    },
    // Service area for general location reference
    service_area: `${booking.address?.city || 'Singapore'}${booking.address?.postal_code ? `, S${booking.address.postal_code}` : ', Central Area'}`
  };
};

/**
 * Check if contractor can see full customer details
 * @param {Object} booking - Booking data
 * @param {string} contractorId - Contractor's user ID
 * @returns {boolean} - Whether contractor can see sensitive details
 */
export const canSeeCustomerDetails = (booking, contractorId) => {
  return booking.contractor_id === contractorId && 
         ['assigned', 'in_progress', 'completed'].includes(booking.status);
};

/**
 * Format service answers for display
 * @param {Object} serviceAnswers - Raw service answers
 * @param {Array} serviceConfig - Service configuration with question definitions
 * @returns {Array} - Formatted question-answer pairs
 */
export const formatServiceAnswersForDisplay = (serviceAnswers, serviceConfig) => {
  if (!serviceAnswers || !serviceConfig) return [];

  const questions = serviceConfig.questions || [];
  
  return questions.map(q => {
    const answer = serviceAnswers[q.id] || serviceAnswers[q.name] || 'Not specified';
    return {
      id: q.id,
      question: q.label,
      answer: Array.isArray(answer) ? answer.join(', ') : String(answer),
      type: q.type || 'text',
      required: q.required || false
    };
  }).filter(item => item.answer !== 'Not specified');
};

/**
 * Validate that booking data is properly filtered for contractor view
 * @param {Object} booking - Booking data to validate
 * @returns {Object} - Validation result with warnings
 */
export const validateContractorBookingData = (booking) => {
  const warnings = [];
  
  // Check for sensitive fields that shouldn't be exposed
  SENSITIVE_FIELDS.forEach(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (booking[parent] && booking[parent][child]) {
        warnings.push(`Sensitive field detected: ${field}`);
      }
    } else if (booking[field]) {
      warnings.push(`Sensitive field detected: ${field}`);
    }
  });

  // Check for required fields
  const missingRequired = VISIBLE_FIELDS.filter(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return !booking[parent] || !booking[parent][child];
    }
    return !booking[field];
  });

  return {
    isValid: warnings.length === 0,
    warnings,
    missingRequired,
    hasServiceAnswers: Boolean(booking.service_answers && Object.keys(booking.service_answers).length > 0),
    hasImages: Boolean(booking.uploaded_images && booking.uploaded_images.length > 0)
  };
};

export default {
  filterBookingForContractor,
  canSeeCustomerDetails,
  formatServiceAnswersForDisplay,
  validateContractorBookingData
};