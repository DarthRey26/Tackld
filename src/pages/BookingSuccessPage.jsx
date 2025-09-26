import React from 'react';
import { useLocation } from 'react-router-dom';
import BookingSuccess from '../components/BookingSuccess';

const BookingSuccessPage = () => {
  const location = useLocation();
  const booking = location.state?.booking || JSON.parse(sessionStorage.getItem('activeBooking') || '{}');

  return <BookingSuccess booking={booking} />;
};

export default BookingSuccessPage;