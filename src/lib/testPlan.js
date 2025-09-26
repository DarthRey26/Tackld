/**
 * Test Plan for Enhanced Contractor Job System
 * Comprehensive testing scenarios to verify functionality
 */

export const sampleBookings = {
  // Complete aircon booking with all data
  completeAircon: {
    id: 'test-aircon-001',
    service_type: 'aircon',
    booking_type: 'tacklers_choice',
    urgency: 'normal',
    status: 'pending_bids',
    price_range_min: 150,
    price_range_max: 300,
    service_answers: {
      serviceType: 'Servicing',
      unitCount: 3,
      unitType: 'Wall-mounted',
      unitAge: 5,
      knownIssues: 'One unit not cooling properly, strange noise from outdoor unit',
      propertyType: 'HDB'
    },
    uploaded_images: [
      'https://example.com/aircon1.jpg',
      'https://example.com/aircon2.jpg',
      'https://example.com/aircon3.jpg'
    ],
    description: 'Regular servicing for 3 aircon units, one has cooling issues',
    address: {
      city: 'Singapore',
      postal_code: '560123',
      street: 'Ang Mo Kio Ave 6', // Hidden pre-bid
      unit_number: '#05-234' // Hidden pre-bid
    },
    customer_name: 'John Tan', // Hidden pre-bid
    customer_phone: '+65 9123 4567', // Hidden pre-bid
    scheduled_date: '2024-01-15',
    scheduled_time: '14:00',
    asap: false,
    created_at: '2024-01-10T10:00:00Z'
  },

  // Emergency plumbing with minimal data
  emergencyPlumbing: {
    id: 'test-plumbing-001',
    service_type: 'plumbing',
    booking_type: 'saver',
    urgency: 'asap',
    status: 'finding_contractor',
    price_range_min: 80,
    price_range_max: 200,
    service_answers: {
      issueType: 'Leak repair',
      urgency: 'Emergency (immediate)',
      affectedItems: ['Kitchen sink', 'Floor trap'],
      waterAccess: 'Yes'
      // Missing problemDescription - should trigger fallback
    },
    uploaded_images: ['https://example.com/leak1.jpg'],
    description: 'Water leaking from kitchen sink, urgent repair needed',
    address: {
      city: 'Singapore',
      postal_code: '238900'
      // Missing street address
    },
    asap: true,
    created_at: '2024-01-10T15:30:00Z'
  },

  // Malformed service answers
  malformedData: {
    id: 'test-malformed-001',
    service_type: 'electrical',
    booking_type: 'tacklers_choice',
    urgency: 'urgent',
    status: 'pending_bids',
    price_range_min: 100,
    price_range_max: 250,
    service_answers: null, // Malformed - should show fallback
    uploaded_images: [],
    description: 'Power socket not working',
    address: {
      city: 'Singapore',
      postal_code: '018956'
    },
    scheduled_date: '2024-01-12',
    asap: false,
    created_at: '2024-01-10T09:15:00Z'
  },

  // Large cleaning job with many images
  largeCleaning: {
    id: 'test-cleaning-001',
    service_type: 'cleaning',
    booking_type: 'saver',
    urgency: 'normal',
    status: 'pending_bids',
    price_range_min: 200,
    price_range_max: 400,
    service_answers: {
      cleaningType: 'Post-Renovation',
      propertyType: 'Condo',
      roomCount: 4,
      cleaningHours: '4-6 hours',
      focusAreas: ['Kitchen', 'Bathrooms', 'Windows', 'Appliances'],
      hasTools: 'No, please bring supplies'
    },
    uploaded_images: [
      'https://example.com/clean1.jpg',
      'https://example.com/clean2.jpg',
      'https://example.com/clean3.jpg',
      'https://example.com/clean4.jpg',
      'https://example.com/clean5.jpg',
      'https://example.com/clean6.jpg'
    ], // Should show "3 more" indicator
    description: 'Post-renovation deep cleaning for 4-room condo',
    address: {
      city: 'Singapore',
      postal_code: '238863'
    },
    scheduled_date: '2024-01-20',
    scheduled_time: '09:00',
    asap: false,
    created_at: '2024-01-10T11:45:00Z'
  },

  // Painting with safety alerts
  paintingWithAlerts: {
    id: 'test-painting-001',
    service_type: 'painting',
    booking_type: 'tacklers_choice',
    urgency: 'normal',
    status: 'pending_bids',
    price_range_min: 500,
    price_range_max: 1200,
    service_answers: {
      propertyType: 'Landed',
      roomCount: 3,
      paintingType: 'Both interior and exterior',
      areaSize: 150,
      wallCondition: 'Major repairs needed', // Should trigger alert
      colorPreference: 'Custom colors'
    },
    uploaded_images: [
      'https://example.com/paint1.jpg',
      'https://example.com/paint2.jpg'
    ],
    description: 'Complete house painting with wall repairs',
    address: {
      city: 'Singapore',
      postal_code: '669709'
    },
    scheduled_date: '2024-02-01',
    asap: false,
    created_at: '2024-01-10T16:20:00Z'
  }
};

export const sampleBids = {
  pending: {
    status: 'pending',
    amount: 180,
    expiresAt: '2024-01-10T18:00:00Z'
  },
  accepted: {
    status: 'accepted',
    amount: 200
  },
  rejected: {
    status: 'rejected'
  },
  expired: {
    status: 'expired',
    amount: 150
  }
};

export const testScenarios = [
  {
    name: 'Complete Job Card Rendering',
    description: 'Verify all job card elements render correctly with complete data',
    booking: sampleBookings.completeAircon,
    bidStatus: 'none',
    expectedElements: [
      'Service type and icon',
      'Booking type badge',
      'Urgency badge',
      'Price range',
      'Service-specific details',
      'Location and schedule',
      'Image thumbnails',
      'Privacy notice',
      'Action buttons'
    ]
  },
  
  {
    name: 'Malformed Data Handling',
    description: 'Verify graceful fallback for missing/malformed service_answers',
    booking: sampleBookings.malformedData,
    bidStatus: 'none',
    expectedBehavior: 'Shows fallback message instead of service details'
  },

  {
    name: 'Emergency Job Handling',
    description: 'Verify ASAP jobs display correctly with urgency indicators',
    booking: sampleBookings.emergencyPlumbing,
    bidStatus: 'none',
    expectedElements: [
      'ASAP urgency badge (red)',
      'Emergency service details',
      'Immediate schedule indicator'
    ]
  },

  {
    name: 'Large Image Set Handling',
    description: 'Verify thumbnail display with "more" indicator for >3 images',
    booking: sampleBookings.largeCleaning,
    bidStatus: 'none',
    expectedBehavior: 'Shows 3 thumbnails + "3 more" indicator'
  },

  {
    name: 'Bid Status Display',
    description: 'Verify different bid statuses render correctly',
    booking: sampleBookings.completeAircon,
    variations: [
      { bidStatus: 'pending', bid: sampleBids.pending },
      { bidStatus: 'accepted', bid: sampleBids.accepted },
      { bidStatus: 'rejected', bid: sampleBids.rejected },
      { bidStatus: 'expired', bid: sampleBids.expired }
    ]
  },

  {
    name: 'Privacy Protection',
    description: 'Verify sensitive customer data is hidden',
    booking: sampleBookings.completeAircon,
    hiddenFields: [
      'customer_name',
      'customer_phone',
      'address.street',
      'address.unit_number'
    ],
    visibleFields: [
      'address.city',
      'address.postal_code',
      'service_answers',
      'uploaded_images'
    ]
  },

  {
    name: 'Service-Specific Templates',
    description: 'Verify each service type renders with correct styling',
    variations: [
      { serviceType: 'aircon', expectedColor: 'blue' },
      { serviceType: 'plumbing', expectedColor: 'indigo' },
      { serviceType: 'electrical', expectedColor: 'yellow' },
      { serviceType: 'cleaning', expectedColor: 'green' },
      { serviceType: 'painting', expectedColor: 'purple' }
    ]
  },

  {
    name: 'Image Carousel Functionality',
    description: 'Verify image carousel opens and navigates correctly',
    booking: sampleBookings.largeCleaning,
    interactions: [
      'Click thumbnail opens carousel',
      'Navigation arrows work',
      'Thumbnail navigation works',
      'Zoom functionality works',
      'Close button works'
    ]
  },

  {
    name: 'Full Details Modal',
    description: 'Verify modal shows complete job information',
    booking: sampleBookings.completeAircon,
    expectedContent: [
      'All service answers',
      'Complete description',
      'All customer images',
      'Schedule details',
      'Service area info'
    ]
  },

  {
    name: 'Error Handling',
    description: 'Verify graceful error handling for various failure modes',
    errorCases: [
      'Invalid booking data (null/undefined)',
      'Missing service configuration',
      'Failed image loading',
      'Network connectivity issues',
      'Malformed JSON in service_answers'
    ]
  }
];

// Test utility functions
export const testUtils = {
  // Simulate contractor data filtering
  filterForContractor: (booking) => {
    const filtered = { ...booking };
    delete filtered.customer_name;
    delete filtered.customer_phone;
    delete filtered.customer_email;
    if (filtered.address) {
      delete filtered.address.street;
      delete filtered.address.unit_number;
      delete filtered.address.building_name;
      delete filtered.address.floor_number;
    }
    return filtered;
  },

  // Generate bid status with timer
  generateBidWithTimer: (status, minutesUntilExpiry = 30) => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutesUntilExpiry);
    return {
      status,
      amount: Math.floor(Math.random() * 200) + 100,
      expiresAt: status === 'pending' ? expiresAt.toISOString() : null
    };
  },

  // Validate job card accessibility
  validateAccessibility: (element) => {
    return {
      hasAltText: element.querySelectorAll('img[alt]').length > 0,
      hasAriaLabels: element.querySelectorAll('[aria-label]').length > 0,
      hasKeyboardNav: element.querySelectorAll('[tabindex]').length > 0,
      hasSemanticHTML: element.querySelectorAll('button, a').length > 0
    };
  },

  // Performance testing helpers
  measureRenderTime: (component, props) => {
    const startTime = performance.now();
    // Render component
    const endTime = performance.now();
    return endTime - startTime;
  },

  // Image loading simulation
  simulateImageLoad: (imageCount, successRate = 0.9) => {
    return Array.from({ length: imageCount }, (_, i) => ({
      index: i,
      url: `https://example.com/image${i}.jpg`,
      loaded: Math.random() < successRate,
      loadTime: Math.random() * 1000 + 200 // 200-1200ms
    }));
  }
};

export default {
  sampleBookings,
  sampleBids,
  testScenarios,
  testUtils
};