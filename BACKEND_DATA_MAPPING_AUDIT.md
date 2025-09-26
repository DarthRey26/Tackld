# Backend Data Mapping and Storage Audit

## Executive Summary

This audit documents the current data flow architecture for Tackld's signup, booking, bidding, job progress, and review systems. The analysis reveals the storage responsibilities between Supabase and MongoDB, identifies data gaps, and provides recommendations for fixing redundant or broken flows.

## Current Architecture Overview

### Storage Responsibilities
- **Supabase**: Authentication (user credentials, sessions), Image storage (job photos)
- **MongoDB**: Source of truth for all user profiles, bookings, bids, reviews, job progress
- **Socket.IO**: Real-time updates and notifications

## 1. Data Flow Analysis

### 1.1 User Signup Flow

**Frontend Form Fields (Login.jsx):**
```javascript
// Customer Signup
{
  full_name: "string",
  email: "string", 
  password: "string",
  phone_number: "string",
  address: "string",        // ❌ GAP: Not properly linked to Address model
  postalCode: "string",     // ❌ GAP: Not stored in user profile 
  housingType: "string"     // ❌ GAP: Not stored in user profile
}

// Contractor Signup  
{
  full_name: "string",
  email: "string",
  password: "string", 
  phone_number: "string",
  serviceType: "aircon|plumbing|electrical|cleaning|painting",
  contractorType: "saver|tacklers_choice",
  years_experience: "number",
  hourly_rate: "number", 
  companyName: "string",    // ❌ GAP: Collected but not stored
  bio: "string"
}
```

**Storage Mapping:**
- **Supabase auth.users**: `id`, `email`, `password` (managed by Supabase)
- **MongoDB UserProfile collection**:
  ```javascript
  {
    authId: "supabase_user_id",           // ✅ Links to Supabase
    accountType: "customer|contractor",    // ✅ Stored
    fullName: "string",                   // ✅ Stored  
    email: "string",                      // ✅ Stored
    phoneNumber: "string",                // ✅ Stored
    
    // ❌ GAPS - Customer address fields not stored in profile:
    // address, postalCode, housingType are collected but lost
    
    // Contractor fields
    serviceType: "string",                // ✅ Stored
    contractorType: "string",             // ✅ Stored  
    yearsExperience: "number",            // ✅ Stored
    hourlyRate: "number",                 // ✅ Stored
    bio: "string",                        // ✅ Stored
    // companyName: NOT STORED             // ❌ GAP
  }
  ```

### 1.2 Booking Creation Flow

**Frontend Form Fields (BookingFlow.jsx):**
```javascript
{
  customerInfo: {
    name: "string",      // ✅ Stored as customerName
    email: "string",     // ✅ Stored as customerEmail  
    phone: "string"      // ✅ Stored as customerPhone
  },
  address: {
    street: "string",    // ✅ Stored in booking.address.fullAddress
    unit: "string",      // ✅ Stored in booking.address.fullAddress
    postalCode: "string", // ✅ Stored in booking.address.postalCode
    type: "string"       // ✅ Stored in booking.address.type
  },
  serviceType: "string", // ✅ Stored as serviceType
  bookingType: "saver|tacklers_choice", // ✅ Stored as bookingType
  description: "string", // ✅ Stored as description
  uploadedImages: ["url"], // ✅ Stored as uploadedImages (Supabase URLs)
  scheduledDate: "date", // ✅ Stored as scheduledDate  
  scheduledTime: "time", // ✅ Stored as scheduledTime
  urgency: "normal|urgent" // ✅ Stored as urgency
}
```

**Storage Mapping:**
- **MongoDB Booking collection**: All booking data properly stored
- **Supabase Storage**: Image files in 'job-images' bucket

### 1.3 Bid Submission Flow

**Frontend Form Fields (BidSubmissionForm.jsx):**
```javascript
{
  booking_id: "ObjectId",    // ✅ Stored
  contractor_id: "ObjectId", // ✅ Stored  
  amount: "number",          // ✅ Stored
  eta_minutes: "number",     // ✅ Stored
  note: "string"            // ✅ Stored
}
```

**Storage Mapping:**
- **MongoDB Bid collection**: All bid data properly stored
- **Socket.IO**: Real-time bid notifications working

### 1.4 Job Progress Tracking

**Progress Updates:**
```javascript
{
  current_stage: "finding_contractor|contractor_found|contractor_arriving|job_started|job_completed|payment_settled",
  stage_completion: "0-100",
  last_updated: "date"
}
```

**Storage Mapping:**
- **MongoDB Booking.progress**: ✅ All progress data stored correctly
- **Socket.IO**: ✅ Real-time progress updates working

### 1.5 Review System  

**Review Data:**
```javascript
{
  customer_rating: "1-5",    // ✅ Stored in Booking
  customer_review: "string", // ✅ Stored in Booking  
  review_date: "date"       // ✅ Stored in Booking
}
```

**Storage Mapping:**
- **MongoDB Booking collection**: Reviews stored within booking records
- **MongoDB UserProfile**: Contractor rating aggregated correctly

## 2. Identified Data Gaps and Issues

### 2.1 Critical Gaps

1. **Customer Address Not Linked to Profile**
   - **Issue**: Customer address (street, postalCode, housingType) collected at signup but not stored in UserProfile
   - **Impact**: Address must be re-entered for every booking
   - **Fix Required**: Add address field to UserProfile schema

2. **Company Name Field Missing**  
   - **Issue**: Contractor companyName collected but not stored anywhere
   - **Impact**: Lost data, potential confusion for contractors
   - **Fix Required**: Add companyName to UserProfile schema

3. **Address Model Disconnect**
   - **Issue**: Separate Address model exists but not connected to signup flow
   - **Impact**: Duplicate address collection, inconsistent data
   - **Fix Required**: Link customer signup to Address model

### 2.2 Schema Inconsistencies

1. **UserProfile Dual Structure**
   - **Issue**: Both new (authId, fullName) and legacy (user_id, full_name) fields exist
   - **Impact**: Code complexity, potential bugs
   - **Status**: Acceptable for migration, but needs cleanup

2. **Booking Address Structure**
   - **Issue**: Simplified address in Booking vs detailed Address model
   - **Impact**: Limited address functionality for bookings
   - **Status**: Working but could be improved

## 3. Data Redundancy Issues

### 3.1 Address Collection
- **Signup**: Basic address (street, postal, housing type)
- **Booking**: Detailed address (street, unit, postal, type)
- **Fix**: Auto-fill booking address from profile default

### 3.2 Customer Info
- **Profile**: fullName, email, phoneNumber stored in UserProfile
- **Booking**: customerName, customerEmail, customerPhone stored in each booking
- **Status**: Acceptable redundancy for data integrity

## 4. Recommended Fixes

### 4.1 High Priority

1. **Add Missing Fields to UserProfile Schema**
   ```javascript
   // Add to UserProfile model
   address: {
     street: String,
     postalCode: String, 
     housingType: String
   },
   companyName: String // For contractors
   ```

2. **Link Address Model to Signup**
   - Create Address record during customer signup
   - Set as default address
   - Auto-fill booking forms

3. **Fix Booking Form Auto-fill**
   - Pre-populate customer info from profile
   - Pre-populate address from default address
   - Only ask for changes if needed

### 4.2 Medium Priority

1. **Cleanup Legacy Fields**
   - Remove or deprecate legacy UserProfile fields
   - Standardize on new structure

2. **Enhance Address Integration**
   - Use Address model for booking addresses
   - Support multiple addresses per customer

### 4.3 Low Priority

1. **Review System Enhancement**
   - Separate Review collection for better queries
   - Enhanced review features

## 5. Test Account Verification

### 5.1 Current Test Accounts
**Status**: ✅ Pre-seeded test accounts working correctly
- 2 Customers: customerA@tackld.com, customerB@tackld.com  
- 10 Contractors: 2 per service type (saver/tackler variants)
- All use password: password123

### 5.2 Data Flow Testing
- ✅ Signup creates Supabase + MongoDB records
- ✅ Login fetches correct profile and routes by role
- ✅ Bookings store all required data
- ✅ Contractors see relevant jobs only
- ✅ Real-time updates working via Socket.IO
- ❌ Address auto-fill not working (due to missing profile address)

## 6. Schema Documentation

### 6.1 User Data Flow
```
Customer Signup → Supabase Auth + MongoDB UserProfile
Login → Fetch profile by authId → Route by accountType
```

### 6.2 Booking Data Flow  
```
Booking Form → Validate → Upload Images to Supabase → Save to MongoDB
Real-time → Socket.IO → Contractor dashboards update
```

### 6.3 Bid Data Flow
```
Contractor Bid → Save to MongoDB → Socket.IO → Customer dashboard updates
Bid Acceptance → Update Booking status → Notify all parties
```

## 7. Acceptance Criteria Status

- ✅ All customer-provided inputs stored (except address gaps)
- ❌ Redundant data requested (address re-entry)  
- ❌ Address fields misaligned between signup and booking
- ✅ Booking records contain full details
- ✅ Contractors see relevant booking details (address hidden until accepted)
- ✅ Real-time updates working
- ✅ Test accounts verified and working

## 8. Next Steps

1. **Immediate**: Fix UserProfile schema to include customer address and contractor companyName
2. **Short-term**: Implement address auto-fill in booking forms
3. **Medium-term**: Clean up legacy fields and enhance address integration
4. **Long-term**: Consider separate Review collection for enhanced features