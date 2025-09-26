import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  User,
  Settings
} from 'lucide-react';

// Enhanced progress tracker with ARIA accessibility and CSS animations
const EnhancedProgressTracker = React.memo(({ booking, className = '' }) => {
  const getProgressSteps = () => {
    const steps = [
      { 
        id: 'finding_contractor', 
        label: 'Finding Contractor', 
        icon: AlertCircle,
        description: 'Searching for available contractors'
      },
      { 
        id: 'contractor_assigned', 
        label: 'Contractor Assigned', 
        icon: User,
        description: 'Contractor has been selected'
      },
      { 
        id: 'contractor_arriving', 
        label: 'Contractor Arriving', 
        icon: Clock,
        description: 'Contractor is on the way'
      },
      { 
        id: 'job_started', 
        label: 'Work In Progress', 
        icon: Settings,
        description: 'Work has begun'
      },
      { 
        id: 'job_completed', 
        label: 'Work Completed', 
        icon: CheckCircle,
        description: 'Job has been finished'
      },
      { 
        id: 'payment_completed', 
        label: 'Payment Processed', 
        icon: DollarSign,
        description: 'Payment has been completed'
      }
    ];

    return steps;
  };

  const getCurrentStepIndex = () => {
    const steps = getProgressSteps();
    const currentStage = booking?.current_stage || booking?.status || 'finding_contractor';
    
    // Map various status values to step indices
    const statusMap = {
      'finding_contractor': 0,
      'pending_bids': 0,
      'contractor_found': 1,
      'assigned': 1,
      'contractor_assigned': 1,
      'arriving': 2,
      'contractor_arriving': 2,
      'job_started': 3,
      'in_progress': 3,
      'completed': 4,
      'job_completed': 4,
      'paid': 5,
      'payment_completed': 5
    };

    return statusMap[currentStage] || 0;
  };

  const steps = getProgressSteps();
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div 
      className={`w-full ${className}`}
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax={steps.length - 1}
      aria-valuenow={currentStepIndex}
      aria-label="Booking progress tracker"
    >
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted-foreground/20 z-0">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ 
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%` 
            }}
          />
        </div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center group"
              role="listitem"
            >
              {/* Step circle */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : isCurrent 
                      ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse' 
                      : 'bg-muted text-muted-foreground'
                  }
                `}
                aria-label={`${step.label} - ${
                  isCompleted ? 'completed' : isCurrent ? 'in progress' : 'pending'
                }`}
              >
                <Icon 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isCurrent ? 'scale-110' : ''
                  }`} 
                />
              </div>

              {/* Step label */}
              <div className="mt-2 text-center min-w-0 max-w-24">
                <p 
                  className={`
                    text-xs font-medium transition-colors duration-200
                    ${isCompleted || isCurrent 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                    }
                  `}
                >
                  {step.label}
                </p>
                
                {/* Description tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  {step.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                </div>
              </div>

              {/* Current step badge */}
              {isCurrent && (
                <Badge 
                  variant="secondary" 
                  className="mt-1 text-xs animate-bounce"
                  aria-label="Current step"
                >
                  Current
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Accessibility: Screen reader description */}
      <div className="sr-only">
        Booking progress: Step {currentStepIndex + 1} of {steps.length}. 
        Current status: {steps[currentStepIndex]?.label}. 
        {steps[currentStepIndex]?.description}.
      </div>
    </div>
  );
});

EnhancedProgressTracker.displayName = 'EnhancedProgressTracker';

export default EnhancedProgressTracker;