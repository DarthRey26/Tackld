export const serviceFormConfig = {
  aircon: {
    title: "Air Conditioning Service",
    questions: [
      {
        id: "serviceType",
        label: "What type of service do you need?",
        type: "select",
        options: ["Servicing", "Repair", "Installation"],
        required: true
      },
      {
        id: "unitCount",
        label: "How many units?",
        type: "number",
        min: 1,
        max: 10,
        required: true
      },
      {
        id: "unitType",
        label: "Unit Type?",
        type: "select",
        options: ["Wall-mounted", "Cassette", "Window", "Portable"],
        required: true
      },
      {
        id: "unitAge",
        label: "Unit age (if known)?",
        type: "number",
        min: 0,
        max: 50,
        required: false
      },
      {
        id: "knownIssues",
        label: "Any known issues?",
        type: "textarea",
        required: false,
        maxLength: 500
      },
      {
        id: "propertyType",
        label: "Property Type",
        type: "select",
        options: ["HDB", "Condo", "Landed"],
        required: true
      }
    ]
  },
  cleaning: {
    title: "House Cleaning Service",
    questions: [
      {
        id: "cleaningType",
        label: "Type of cleaning?",
        type: "select",
        options: ["General", "Post-Renovation", "Move-in/Move-out"],
        required: true
      },
      {
        id: "propertyType",
        label: "Property type?",
        type: "select",
        options: ["HDB", "Condo", "Landed", "Office"],
        required: true
      },
      {
        id: "roomCount",
        label: "How many rooms?",
        type: "number",
        min: 1,
        max: 20,
        required: true
      },
      {
        id: "cleaningHours",
        label: "Estimated hours needed?",
        type: "select",
        options: ["1-2 hours", "2-4 hours", "4-6 hours", "Full day"],
        required: true
      },
      {
        id: "focusAreas",
        label: "Areas of focus?",
        type: "checkbox",
        options: ["Kitchen", "Bathrooms", "Windows", "Ceiling fans", "Appliances"],
        required: true
      },
      {
        id: "hasTools",
        label: "Do you have cleaning supplies?",
        type: "select",
        options: ["Yes, I have everything", "No, please bring supplies", "Partial - need some items"],
        required: true
      }
    ]
  },
  painting: {
    title: "Painting Service",
    questions: [
      {
        id: "propertyType",
        label: "Property type?",
        type: "select",
        options: ["HDB", "Condo", "Landed", "Office"],
        required: true
      },
      {
        id: "roomCount",
        label: "How many rooms to paint?",
        type: "number",
        min: 1,
        max: 20,
        required: true
      },
      {
        id: "paintingType",
        label: "Type of painting?",
        type: "select",
        options: ["Interior only", "Exterior only", "Both interior and exterior"],
        required: true
      },
      {
        id: "areaSize",
        label: "Estimated area size (sqm)?",
        type: "number",
        min: 10,
        max: 1000,
        required: true
      },
      {
        id: "wallCondition",
        label: "Current wall condition?",
        type: "select",
        options: ["Good condition", "Minor cracks/holes", "Major repairs needed"],
        required: true
      },
      {
        id: "colorPreference",
        label: "Color preference?",
        type: "select",
        options: ["White/Neutral", "Warm colors", "Cool colors", "Custom colors"],
        required: true
      }
    ]
  },
  plumbing: {
    title: "Plumbing Service",
    questions: [
      {
        id: "issueType",
        label: "What type of plumbing issue?",
        type: "select",
        options: ["Leak repair", "Pipe installation", "Toilet issues", "Sink/tap problems", "Water heater", "General maintenance"],
        required: true
      },
      {
        id: "urgency",
        label: "How urgent is this?",
        type: "select",
        options: ["Emergency (immediate)", "Urgent (within 24hrs)", "Normal (within a week)"],
        required: true
      },
      {
        id: "affectedItems",
        label: "What items are affected?",
        type: "checkbox",
        options: ["Kitchen sink", "Bathroom sink", "Toilet", "Shower", "Water heater", "Pipes", "Floor trap"],
        required: true
      },
      {
        id: "waterAccess",
        label: "Can you access the main water valve?",
        type: "select",
        options: ["Yes", "No", "Not sure"],
        required: true
      },
      {
        id: "problemDescription",
        label: "Describe the problem in detail",
        type: "textarea",
        required: true,
        maxLength: 500
      }
    ]
  },
  electrical: {
    title: "Electrical Service",
    questions: [
      {
        id: "issueType",
        label: "What electrical issue do you have?",
        type: "select",
        options: ["Power outlet not working", "Light fixture issues", "Fan problems", "Circuit breaker tripping", "Wiring problems", "Installation needed"],
        required: true
      },
      {
        id: "powerStatus",
        label: "Is there any power failure?",
        type: "select",
        options: ["Complete power loss", "Partial power loss", "No power loss"],
        required: true
      },
      {
        id: "affectedAreas",
        label: "Which areas are affected?",
        type: "checkbox",
        options: ["Living room", "Bedroom", "Kitchen", "Bathroom", "Entire house"],
        required: true
      },
      {
        id: "hasSpare",
        label: "Do you have replacement parts?",
        type: "select",
        options: ["Yes", "No", "Need help sourcing"],
        required: true
      },
      {
        id: "safetyNote",
        label: "Safety concerns or additional notes",
        type: "textarea",
        required: false,
        maxLength: 300
      }
    ]
  }
};
