# Contractor Job Details System

## Overview
This system provides contractors with comprehensive job information while maintaining customer privacy until bids are accepted.

## Service Answer Mapping

### Service Types & Questions

#### Aircon Service
- `serviceType` → "What type of service?" (Servicing/Repair/Installation)
- `unitCount` → "How many units?" (1-10)
- `unitType` → "Unit Type?" (Wall-mounted/Cassette/Window/Portable)
- `unitAge` → "Unit age?" (0-50 years)
- `knownIssues` → "Any known issues?" (textarea)
- `propertyType` → "Property Type" (HDB/Condo/Landed)

#### Plumbing Service
- `issueType` → "What type of issue?" (Leak repair/Installation/Toilet/Sink/Water heater/Maintenance)
- `urgency` → "How urgent?" (Emergency/Urgent/Normal)
- `affectedItems` → "What items affected?" (Kitchen sink/Bathroom sink/Toilet/Shower/Water heater/Pipes/Floor trap)
- `waterAccess` → "Can access main water valve?" (Yes/No/Not sure)
- `problemDescription` → "Describe problem" (textarea)

#### Electrical Service
- `issueType` → "What electrical issue?" (Power outlet/Light fixture/Fan/Circuit breaker/Wiring/Installation)
- `powerStatus` → "Power failure?" (Complete/Partial/None)
- `affectedAreas` → "Which areas affected?" (Living room/Bedroom/Kitchen/Bathroom/Entire house)
- `hasSpare` → "Have replacement parts?" (Yes/No/Need help sourcing)
- `safetyNote` → "Safety concerns" (textarea)

#### Cleaning Service
- `cleaningType` → "Type of cleaning?" (General/Post-Renovation/Move-in/Move-out)
- `propertyType` → "Property type?" (HDB/Condo/Landed/Office)
- `roomCount` → "How many rooms?" (1-20)
- `cleaningHours` → "Estimated hours?" (1-2/2-4/4-6/Full day)
- `focusAreas` → "Areas of focus?" (Kitchen/Bathrooms/Windows/Ceiling fans/Appliances)
- `hasTools` → "Have cleaning supplies?" (Yes/No/Partial)

#### Painting Service
- `propertyType` → "Property type?" (HDB/Condo/Landed/Office)
- `roomCount` → "How many rooms?" (1-20)
- `paintingType` → "Type of painting?" (Interior/Exterior/Both)
- `areaSize` → "Estimated area (sqm)?" (10-1000)
- `wallCondition` → "Current wall condition?" (Good/Minor cracks/Major repairs)
- `colorPreference` → "Color preference?" (White/Warm/Cool/Custom)

## Database Schema Requirements

### Required Columns in `bookings` table:
- `service_answers` (JSONB) - Service-specific question responses
- `uploaded_images` (TEXT[]) - Customer uploaded photos
- `service_type` (TEXT) - Type of service (aircon/plumbing/electrical/cleaning/painting)
- `booking_type` (TEXT) - Booking tier (saver/tacklers_choice)
- `urgency` (TEXT) - Urgency level (normal/urgent/asap)
- `description` (TEXT) - Additional customer notes
- `price_range_min`, `price_range_max` (NUMERIC) - Budget range
- `address` (JSONB) - Location information
- `scheduled_date`, `scheduled_time` - Scheduling preferences
- `customer_name`, `customer_phone`, `customer_email` - Contact info (hidden pre-bid)

### Privacy Fields (Hidden Until Bid Acceptance):
- `customer_name`
- `customer_phone` 
- `customer_email`
- `address.street`
- `address.unit_number`
- `address.building_name`
- `address.floor_number`
- `address.access_instructions`

### Visible Fields (Available for Bidding):
- Service type, booking type, urgency
- Service answers and uploaded images
- General location (city, postal code)
- Schedule preferences
- Price range
- Description/notes

## Components

### 1. `EnhancedJobCard`
**Purpose:** Main job display component with service-specific templates
**Features:**
- Privacy-filtered job data
- Service-specific color coding and layouts
- Lazy-loaded image thumbnails
- Graceful fallbacks for missing data
- Real-time bid status indicators

**Props:**
```typescript
{
  job: BookingObject,
  onBidSubmit: (job) => void,
  onDecline: (job) => void,
  canBid?: boolean,
  bidStatus?: 'none' | 'pending' | 'accepted' | 'rejected',
  bidAmount?: number,
  bidExpiresAt?: string
}
```

### 2. `BidSubmittedIndicator`
**Purpose:** Shows bid submission status with expiry timer
**States:**
- `pending` - Blue badge with countdown timer
- `accepted` - Green badge with checkmark
- `rejected` - Red badge with X mark
- `expired` - Gray badge with clock

### 3. `PhotoCarousel`
**Purpose:** Full-screen image viewing with navigation and zoom
**Features:**
- Navigation arrows and thumbnails
- Zoom in/out functionality
- Keyboard navigation support
- Error handling for broken images

## Data Flow

1. **Job Fetching:** Raw booking data retrieved from Supabase
2. **Privacy Filtering:** `filterBookingForContractor()` removes sensitive fields
3. **Validation:** `validateContractorBookingData()` checks data integrity
4. **Service Mapping:** `formatServiceAnswersForDisplay()` formats Q&A pairs
5. **Template Rendering:** Service-specific components render formatted data
6. **Progressive Disclosure:** Full details available in modal dialog

## Privacy & Security

- **Row Level Security (RLS):** Database policies prevent unauthorized access
- **Data Filtering:** Client-side filtering removes sensitive customer information
- **Progressive Disclosure:** Customer details revealed only after bid acceptance
- **Audit Trail:** All data access logged for compliance

## Edge Case Handling

### Missing/Malformed `service_answers`:
```jsx
// Graceful fallback message
"More details available upon opening booking. Please refresh or contact support."
```

### Large Image Handling:
- Lazy loading with `loading="lazy"` attribute
- Thumbnail generation (16x16 previews)
- Skeleton loading states
- Error boundaries for failed image loads

### Network Issues:
- Retry mechanisms with exponential backoff
- Offline state indicators
- Cached data fallbacks

## Real-time Features

### Bid Confirmations:
- Instant feedback on bid submission
- Real-time status updates via Supabase subscriptions
- Automatic bid expiry countdown timers

### Status Updates:
- Job assignment notifications
- Customer response alerts
- Schedule change notifications

## Performance Optimizations

### Image Loading:
- Progressive JPEG support
- WebP format when available
- Responsive image sizing
- CDN integration ready

### Component Rendering:
- React.memo for expensive components
- useMemo for complex calculations
- Suspense boundaries for code splitting
- Virtual scrolling for large job lists

## Test Plan

### Unit Tests:
- Service answer formatting
- Privacy data filtering
- Image loading states
- Bid status calculations

### Integration Tests:
- Real-time subscription handling
- Modal dialog interactions
- Image carousel navigation
- Bid submission flow

### Sample Bookings:
```javascript
// Aircon service with complete data
{
  service_type: 'aircon',
  service_answers: {
    serviceType: 'Servicing',
    unitCount: 3,
    unitType: 'Wall-mounted',
    propertyType: 'HDB'
  },
  uploaded_images: ['url1.jpg', 'url2.jpg']
}

// Plumbing emergency with incomplete data
{
  service_type: 'plumbing',
  urgency: 'asap',
  service_answers: {
    issueType: 'Leak repair'
    // Missing other fields - should show fallback
  }
}
```

## RLS Policy Requirements

### Contractor Job Visibility:
```sql
-- Allow contractors to see available jobs in their service area
CREATE POLICY "contractors_view_available_jobs" ON bookings
FOR SELECT USING (
  status IN ('pending_bids', 'finding_contractor') 
  AND contractor_id IS NULL 
  AND service_type = (SELECT service_type FROM profiles WHERE id = auth.uid())
);
```

### Bid Access Control:
```sql
-- Contractors can only see their own bids
CREATE POLICY "contractors_own_bids" ON bids
FOR ALL USING (contractor_id = auth.uid());
```

### Customer Privacy Protection:
```sql
-- Hide customer details until bid acceptance
CREATE OR REPLACE FUNCTION filter_customer_data(booking_row bookings)
RETURNS bookings AS $$
BEGIN
  IF booking_row.contractor_id != auth.uid() THEN
    booking_row.customer_name := NULL;
    booking_row.customer_phone := NULL;
    booking_row.customer_email := NULL;
    -- Keep only general location info
  END IF;
  RETURN booking_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Deployment Checklist

- [ ] Supabase RLS policies configured
- [ ] Image storage bucket permissions set
- [ ] Real-time subscriptions enabled
- [ ] Error tracking configured
- [ ] Performance monitoring setup
- [ ] Privacy audit completed
- [ ] Security penetration testing
- [ ] Load testing with sample data