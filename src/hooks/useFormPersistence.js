import { useState, useEffect, useCallback } from 'react';
import { debounce } from '@/utils/errorHandling';

export const useFormPersistence = (
  formKey, 
  initialData = {}, 
  autoSave = true,
  saveDelay = 500
) => {
  const [formData, setFormData] = useState(() => {
    // Try to load from localStorage on initial mount
    try {
      const saved = localStorage.getItem(formKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
    return initialData;
  });

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data) => {
      try {
        localStorage.setItem(formKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    }, saveDelay),
    [formKey, saveDelay]
  );

  // Auto-save when formData changes
  useEffect(() => {
    if (autoSave && Object.keys(formData).length > 0) {
      debouncedSave(formData);
    }
  }, [formData, autoSave, debouncedSave]);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(initialData);
    localStorage.removeItem(formKey);
  }, [formKey, initialData]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(formKey);
  }, [formKey]);

  const manualSave = useCallback(() => {
    try {
      localStorage.setItem(formKey, JSON.stringify(formData));
      return true;
    } catch (error) {
      console.warn('Failed to manually save form data:', error);
      return false;
    }
  }, [formKey, formData]);

  return {
    formData,
    setFormData: updateFormData,
    resetFormData,
    clearSavedData,
    manualSave
  };
};

export const useStepFormPersistence = (
  formKey,
  initialData = {},
  totalSteps = 1
) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { formData, setFormData, resetFormData, clearSavedData } = useFormPersistence(
    formKey,
    { ...initialData, _currentStep: 1 }
  );

  // Restore step from saved data
  useEffect(() => {
    if (formData._currentStep && formData._currentStep <= totalSteps) {
      setCurrentStep(formData._currentStep);
    }
  }, [formData._currentStep, totalSteps]);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      setFormData({ _currentStep: step });
    }
  }, [totalSteps, setFormData]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      setFormData({ _currentStep: newStep });
    }
  }, [currentStep, totalSteps, setFormData]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      setFormData({ _currentStep: newStep });
    }
  }, [currentStep, setFormData]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    resetFormData();
  }, [resetFormData]);

  return {
    formData,
    setFormData,
    currentStep,
    setCurrentStep: goToStep,
    nextStep,
    prevStep,
    resetForm,
    clearSavedData,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps
  };
};