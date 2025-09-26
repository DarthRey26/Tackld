import { serviceFormConfig } from '@/config/serviceFormConfig';

export const validateServiceAnswers = (serviceType, answers) => {
  const config = serviceFormConfig[serviceType];
  if (!config) return { isValid: false, errors: {} };

  const errors = {};
  
  config.questions.forEach(question => {
    const value = answers[question.id];
    
    // Required field validation
    if (question.required) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        errors[question.id] = `${question.label} is required`;
        return;
      }
    }

    // Type-specific validation
    if (value) {
      switch (question.type) {
        case 'number':
          const numValue = parseInt(value);
          if (isNaN(numValue)) {
            errors[question.id] = 'Please enter a valid number';
          } else {
            if (question.min && numValue < question.min) {
              errors[question.id] = `Minimum value is ${question.min}`;
            }
            if (question.max && numValue > question.max) {
              errors[question.id] = `Maximum value is ${question.max}`;
            }
          }
          break;
          
        case 'textarea':
          if (question.maxLength && value.length > question.maxLength) {
            errors[question.id] = `Maximum ${question.maxLength} characters allowed`;
          }
          if (question.minLength && value.length < question.minLength) {
            errors[question.id] = `Minimum ${question.minLength} characters required`;
          }
          break;
          
        case 'select':
          if (!question.options.includes(value)) {
            errors[question.id] = 'Please select a valid option';
          }
          break;
          
        case 'checkbox':
          if (!Array.isArray(value)) {
            errors[question.id] = 'Invalid selection';
          } else {
            const invalidOptions = value.filter(v => !question.options.includes(v));
            if (invalidOptions.length > 0) {
              errors[question.id] = 'Some selections are invalid';
            }
          }
          break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateBookingData = (bookingData) => {
  const errors = {};

  // Customer info validation
  if (!bookingData.customerInfo?.name?.trim()) {
    errors.customerName = 'Customer name is required';
  }
  
  if (!bookingData.customerInfo?.phone?.trim()) {
    errors.customerPhone = 'Phone number is required';
  } else if (!/^[+]?[\d\s-()]+$/.test(bookingData.customerInfo.phone)) {
    errors.customerPhone = 'Please enter a valid phone number';
  }
  
  if (!bookingData.customerInfo?.email?.trim()) {
    errors.customerEmail = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customerInfo.email)) {
    errors.customerEmail = 'Please enter a valid email address';
  }

  // Address validation
  if (!bookingData.address?.street?.trim()) {
    errors.addressStreet = 'Street address is required';
  }
  
  if (!bookingData.address?.postalCode?.trim()) {
    errors.addressPostalCode = 'Postal code is required';
  } else if (!/^\d{6}$/.test(bookingData.address.postalCode)) {
    errors.addressPostalCode = 'Please enter a valid 6-digit postal code';
  }

  // Service questions validation
  const serviceValidation = validateServiceAnswers(
    bookingData.serviceType, 
    bookingData.serviceQuestions || {}
  );
  
  if (!serviceValidation.isValid) {
    Object.assign(errors, serviceValidation.errors);
  }

  // Scheduling validation
  if (!bookingData.isASAP) {
    if (!bookingData.preferredDate) {
      errors.schedule = 'Please select a preferred date or choose ASAP';
    }
    if (!bookingData.preferredTime) {
      errors.schedule = 'Please select a preferred time or choose ASAP';
    }
  }

  // Images validation
  if (!bookingData.images || bookingData.images.length === 0) {
    errors.images = 'At least one image is required';
  }

  // Booking type validation
  if (!bookingData.bookingType) {
    errors.bookingType = 'Please select a booking type';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateBidData = (bidData) => {
  const errors = {};

  if (!bidData.amount || parseFloat(bidData.amount) <= 0) {
    errors.amount = 'Bid amount must be greater than 0';
  }

  if (!bidData.eta || parseInt(bidData.eta) < 15) {
    errors.eta = 'ETA must be at least 15 minutes';
  }

  if (bidData.materials) {
    bidData.materials.forEach((material, index) => {
      if (material.name && !material.cost) {
        errors[`material_${index}_cost`] = 'Material cost is required';
      }
      if (material.cost && !material.name) {
        errors[`material_${index}_name`] = 'Material name is required';
      }
      if (material.cost && parseFloat(material.cost) <= 0) {
        errors[`material_${index}_cost`] = 'Material cost must be greater than 0';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateContractorProfile = (profileData) => {
  const errors = {};

  if (!profileData.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!profileData.phoneNumber?.trim()) {
    errors.phoneNumber = 'Phone number is required';
  }

  if (!profileData.serviceType) {
    errors.serviceType = 'Service type is required';
  }

  if (!profileData.contractorType) {
    errors.contractorType = 'Contractor type is required';
  }

  if (!profileData.bio?.trim()) {
    errors.bio = 'Bio is required';
  } else if (profileData.bio.length < 50) {
    errors.bio = 'Bio must be at least 50 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};