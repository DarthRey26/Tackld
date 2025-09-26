# Contractor Job Details System

## Overview
This system ensures contractors see comprehensive booking details before placing bids while protecting customer privacy until bid acceptance.

## Service-Specific Question Mapping

### Aircon Service (`service_type: "aircon"`)
| Database Key | UI Label | Type | Required |
|--------------|----------|------|----------|
| `serviceType` | "What type of service do you need?" | select | Yes |
| `unitCount` | "How many units?" | number | Yes |
| `unitType` | "Unit Type?" | select | Yes |
| `unitAge` | "Unit age (if known)?" | number | No |
| `knownIssues` | "Any known issues?" | textarea | No |
| `propertyType` | "Property Type" | select | Yes |

### Plumbing Service (`service_type: "plumbing"`)
| Database Key | UI Label | Type | Required |
|--------------|----------|------|----------|
| `issueType` | "What type of plumbing issue?" | select | Yes |
| `urgency` | "How urgent is this?" | select | Yes |
| `affectedItems` | "What items are affected?" | checkbox | Yes |
| `waterAccess` | "Can you access the main water valve?" | select | Yes |
| `problemDescription` | "Describe the problem in detail" | textarea | Yes |

### Electrical Service (`service_type: "electrical"`)
| Database Key | UI Label | Type | Required |
|--------------|----------|------|----------|
| `issueType` | "What electrical issue do you have?" | select | Yes |
| `powerStatus` | "Is there any power failure?" | select | Yes |
| `affectedAreas` | "Which areas are affected?" | checkbox | Yes |
| `hasSpare` | "Do you have replacement parts?" | select | Yes |
| `safetyNote` | "Safety concerns or additional notes" | textarea | No |

### Cleaning Service (`service_type: "cleaning"`)
| Database Key | UI Label | Type | Required |
|--------------|----------|------|----------|
| `cleaningType` | "Type of cleaning?" | select | Yes |
| `propertyType` | "Property type?" | select | Yes |
| `roomCount` | "How many rooms?" | number | Yes |
| `cleaningHours` | "Estimated hours needed?" | select | Yes |
| `focusAreas` | "Areas of focus?" | checkbox | Yes |
| `hasTools` | "Do you have cleaning supplies?" | select | Yes |

### Painting Service (`service_type: "painting"`)
| Database Key | UI Label | Type | Required |
|--------------|----------|------|----------|
| `propertyType` | "Property type?" | select | Yes |
| `roomCount` | "How many rooms to paint?" | number | Yes |
| `paintingType` | "Type of painting?" | select | Yes |
| `areaSize` | "Estimated area size (sqm)?" | number | Yes |
| `wallCondition` | "Current wall condition?" | select | Yes |
| `colorPreference` | "Color preference?" | select | Yes |

## Database Schema Requirements

### Required Columns in `bookings` table:
- ✅ `service_answers` (jsonb) - Stores all service-specific Q&A
- ✅ `uploaded_images` (text[]) - Customer uploaded photos
- ✅ `service_type` (text) - Service category
- ✅ `booking_type` (text) - Saver/Tackler's Choice
- ✅ `scheduled_date` (date) - Preferred date
- ✅ `scheduled_time` (time) - Preferred time
- ✅ `urgency` (text) - Job urgency level
- ✅ `description` (text) - Additional notes

### Hidden Fields (Until Bid Acceptance):
- `customer_name` - Customer's full name
- `customer_phone` - Contact number
- `customer_email` - Email address
- `address.street` - Exact street address
- `address.unit_number` - Unit details
- `address.building_name` - Building name
- `address.access_instructions` - Access details

### Visible Fields (For Bidding):
- `address.city` - General area (usually "Singapore")
- `address.postal_code` - Postal code for area reference
- All service-specific questions and answers
- Customer uploaded images
- Schedule preferences and urgency
- Budget range

## Components

### ServiceSpecificJobCard
Main component displaying job details with service-specific templates:
- **File**: `src/components/contractor/ServiceSpecificJobCard.jsx`
- **Features**: Service-specific layouts, image carousel, bid status indicators
- **Privacy**: Hides sensitive customer info until bid acceptance

### BidStatusBadge
Shows bid submission status with timer:
- **Statuses**: pending, accepted, rejected, expired
- **Features**: Real-time countdown, visual status indicators

### CustomerImageCarousel
Full-screen image viewing:
- **File**: `src/components/contractor/CustomerImageCarousel.jsx`
- **Features**: Navigation arrows, thumbnails, zoom functionality

## Data Flow

1. **Job Fetching**: Enhanced contractor dashboard RPC fetches all visible booking fields
2. **Privacy Filter**: Sensitive customer data excluded by RLS policies and data filtering
3. **Service Template**: Job card renders using appropriate service-specific template
4. **Bid Submission**: Comprehensive job context allows informed bidding
5. **Status Updates**: Real-time bid status updates with visual feedback

## Privacy & Security

- **Row Level Security**: RLS policies restrict contractor access to appropriate bookings
- **Data Filtering**: `contractorDataFilter.js` utility ensures sensitive data exclusion
- **Progressive Disclosure**: Customer details revealed only after bid acceptance
- **Validation**: Built-in validation ensures proper data filtering

## Testing

To verify the system:
1. Create bookings with all service types
2. Ensure service_answers contains all required fields
3. Upload customer images to test carousel functionality
4. Submit bids and verify status indicators work
5. Confirm sensitive data remains hidden until acceptance

## Real-time Features

- **Bid Confirmations**: Immediate feedback on bid submission
- **Status Updates**: Live bid status changes (pending → accepted/rejected)
- **Job Availability**: New jobs appear automatically
- **Expiry Timers**: Live countdown for bid expiration