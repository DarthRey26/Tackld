// Route constants for the application
const routes = {
  home: '/',
  login: '/login',
  account: '/account',
  customerMain: '/customer-dashboard',
  contractorMain: '/contractor-main',
  jobDetail: '/job-detail',
  bookingSuccess: '/booking-success',
  payment: '/payment',
  // Service routes
  requestService: (serviceType) => `/request/${serviceType}`,
  bookService: (serviceType) => `/book/${serviceType}`,
};

export default routes;