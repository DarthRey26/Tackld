import { z } from 'zod';

// Base booking validation schema
export const bookingSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  service_type: z.enum(['aircon', 'plumbing', 'electrical', 'cleaning', 'painting'], {
    errorMap: () => ({ message: 'Please select a valid service type' })
  }),
  booking_type: z.enum(['saver', 'tacklers_choice'], {
    errorMap: () => ({ message: 'Please select a booking type' })
  }),
  description: z.string().optional(),
  uploaded_images: z.array(z.string().url()).min(1, 'At least one image is required'),
  
  address: z.object({
    fullAddress: z.string().min(1, 'Address is required'),
    postalCode: z.string().regex(/^\d{6}$/, 'Singapore postal code must be 6 digits'),
    type: z.string().optional()
  }),
  
  scheduled_date: z.string().refine(
    (date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    },
    { message: 'Booking date cannot be in the past' }
  ),
  
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid time format required (HH:mm)'),
  
  urgency: z.enum(['normal', 'urgent', 'emergency']).optional(),
  asap: z.boolean().optional()
});

// Bid validation schema
export const bidSchema = z.object({
  booking_id: z.string().uuid('Valid booking ID required'),
  contractor_id: z.string().uuid('Valid contractor ID required'),
  amount: z.number().min(1, 'Bid amount must be greater than 0'),
  eta_minutes: z.number().min(15, 'ETA must be at least 15 minutes').max(480, 'ETA cannot exceed 8 hours'),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
  proposed_start_time: z.string().optional(),
  proposed_end_time: z.string().optional(),
  included_materials: z.array(z.object({
    name: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0)
  })).optional()
});

// Extra parts validation schema
export const extraPartsSchema = z.object({
  booking_id: z.string().uuid('Valid booking ID required'),
  part_name: z.string().min(1, 'Part name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  total_price: z.number().min(0, 'Total price cannot be negative'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
  photo_url: z.string().url('Valid photo URL required').optional()
});

// Reschedule request validation schema
export const rescheduleSchema = z.object({
  booking_id: z.string().uuid('Valid booking ID required'),
  new_date: z.string().refine(
    (date) => {
      const newDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return newDate >= today;
    },
    { message: 'New booking date cannot be in the past' }
  ),
  new_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid time format required (HH:mm)'),
  reason: z.string().min(1, 'Reason for reschedule is required').max(500, 'Reason cannot exceed 500 characters')
});

// Review validation schema
export const reviewSchema = z.object({
  booking_id: z.string().uuid('Valid booking ID required'),
  contractor_id: z.string().uuid('Valid contractor ID required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  review_text: z.string().max(1000, 'Review cannot exceed 1000 characters').optional(),
  punctuality_rating: z.number().min(1).max(5).optional(),
  quality_rating: z.number().min(1).max(5).optional(),
  professionalism_rating: z.number().min(1).max(5).optional()
});

// Service-specific question validation
export const serviceQuestionSchema = z.object({
  aircon: z.object({
    unit_type: z.string().optional(),
    issue_description: z.string().min(1, 'Issue description is required'),
    unit_age: z.number().optional(),
    maintenance_history: z.string().optional()
  }).optional(),
  
  plumbing: z.object({
    issue_type: z.string().optional(),
    location: z.string().min(1, 'Location is required'),
    urgency_level: z.string().optional(),
    water_shutoff: z.boolean().optional()
  }).optional(),
  
  electrical: z.object({
    issue_type: z.string().optional(),
    safety_concern: z.boolean().optional(),
    affected_area: z.string().min(1, 'Affected area is required'),
    power_status: z.string().optional()
  }).optional(),
  
  cleaning: z.object({
    cleaning_type: z.string().optional(),
    property_size: z.string().min(1, 'Property size is required'),
    special_requirements: z.string().optional(),
    frequency: z.string().optional()
  }).optional(),
  
  painting: z.object({
    surface_type: z.string().optional(),
    area_size: z.string().min(1, 'Area size is required'),
    paint_type_preference: z.string().optional(),
    preparation_needed: z.boolean().optional()
  }).optional()
});

// Form validation helper functions
export const validateBookingForm = (data) => {
  try {
    return { data: bookingSchema.parse(data), error: null };
  } catch (error) {
    return { data: null, error: error.errors };
  }
};

export const validateBidForm = (data) => {
  try {
    return { data: bidSchema.parse(data), error: null };
  } catch (error) {
    return { data: null, error: error.errors };
  }
};

export const validateExtraPartsForm = (data) => {
  try {
    return { data: extraPartsSchema.parse(data), error: null };
  } catch (error) {
    return { data: null, error: error.errors };
  }
};

export const validateRescheduleForm = (data) => {
  try {
    return { data: rescheduleSchema.parse(data), error: null };
  } catch (error) {
    return { data: null, error: error.errors };
  }
};

export const validateReviewForm = (data) => {
  try {
    return { data: reviewSchema.parse(data), error: null };
  } catch (error) {
    return { data: null, error: error.errors };
  }
};