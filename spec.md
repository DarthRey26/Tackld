# Tackld Project — spec.md

## Core Concept
Tackld is a web platform that connects customers in Singapore to verified, high-quality service contractors (aircon, plumbing, electrical, cleaning, painting). It streamlines job discovery, booking, job tracking, communication, payment, and reviews. Tackld aims to be the Grab of home services, optimized for trust, speed, and ease.

## Essential Features

### Customer Side
- Email/password authentication
- Home page with **only 5 core services**: Aircon, Plumbing, Electrical, Cleaning, Painting
- Direct service selection goes straight to **that service's booking page**
- Service-specific booking form:
  - Custom questions per service
  - Mandatory image uploads (e.g. aircon model, site photo)
  - Booking preview before submission
- Scheduling:
  - Preferred date/time or ASAP
- Price selection flow:
  - **Tackler's Choice** (auto-assigned trusted contractor)
  - **Saver Option** (lowest bids shown)
  - **Open Tender** (customer manually selects)
- Booking confirmation triggers green progress bar:
  - Finding Contractor
  - Contractor Found
  - Contractor Arriving
  - Job Started
  - Job Completed
  - Payment Settled
- Each progress stage:
  - Manually updated by contractor
  - Supports image upload & preview
- Dummy payment page:
  - Simulates job total
  - Pay Now button (marks as "paid")
- Mandatory 5-star rating system after job
- Booking history shows full record:
  - Job details, images, receipt, review

### Contractor Side
- Email/password login with **contractor role**
- Dashboard limited to contractor's service category
- Sees relevant jobs, submits single locked bid per job
- Can filter jobs by pricing model (Tackler's Choice, Saver, Open Tender)
- Badge indicators:
  - **Tackler's Choice** for early onboarded partners
  - **Saver Bidder** for low-cost contractors
- After job assigned:
  - Can manually progress through job stages
  - Upload & preview images
  - Can request additional charges (parts, materials)
  - Can **reschedule job**, but must input reason

## Important Requirements
- Only 5 core services must exist
- Booking flows are isolated (no cross-navigation between services)
- Simulated payments only — no Stripe yet
- Green progress bar only appears for active bookings
- Responsive design across all devices
- Access control enforced by role (Customer, Contractor, Admin)

## Additional Goals
- Booking/bidding data recovery via localStorage
- Responsive UI using Tailwind CSS
- Error boundaries to catch upload/modals issues
- Visual confirmation for uploaded images
- Incentives (e.g. 0% commission first 3 months for contractors)
- Email verification and strong password rules

## Optional (Post-Launch Features)
- Stripe wallet/payments integration
- Contractor referral program (e.g. via property agents)
- Promo/voucher engine
- Analytics dashboard (Admin only)
- FAQ/help center page