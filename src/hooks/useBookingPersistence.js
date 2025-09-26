import { useState, useEffect } from 'react';
import { bookingService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to manage booking data persistence across page refreshes
 */
export const useBookingPersistence = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load bookings from localStorage immediately (before API call)
  useEffect(() => {
    try {
      const savedBookings = localStorage.getItem('customer_bookings');
      if (savedBookings) {
        const parsedBookings = JSON.parse(savedBookings);
        setBookings(parsedBookings);
        
        const activeList = parsedBookings.filter(booking => {
          // Keep bookings that are not truly finished
          const isFinished = ['paid', 'cancelled'].includes(booking.status) || 
                           ['paid', 'cancelled'].includes(booking.current_stage);
          return !isFinished;
        });
        setActiveBookings(activeList);
      }
    } catch (error) {
      console.error('Failed to load saved bookings:', error);
    }
  }, []);

  // Load fresh data from API when user is available
  useEffect(() => {
    if (user?.id) {
      loadBookingsFromAPI();
    }
  }, [user]);

  const loadBookingsFromAPI = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data: fetchedBookings, error } = await bookingService.getCustomerBookings(user.id);
      
      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }
      
      const bookingsList = fetchedBookings || [];
      
      // Update state
      setBookings(bookingsList);
      
      // Filter active bookings - include awaiting_payment stage
      const activeList = bookingsList.filter(booking => {
        const isFinished = ['paid', 'cancelled'].includes(booking.status) || 
                         ['paid', 'cancelled'].includes(booking.current_stage);
        return !isFinished;
      });
      setActiveBookings(activeList);
      
      // Persist to localStorage
      localStorage.setItem('customer_bookings', JSON.stringify(bookingsList));
      
    } catch (error) {
      console.error('Failed to load bookings from API:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBooking = (newBooking) => {
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    
    // Update active bookings if this one is active
    const isFinished = ['paid', 'cancelled'].includes(newBooking.status) || 
                     ['paid', 'cancelled'].includes(newBooking.current_stage);
    if (!isFinished) {
      const updatedActive = [newBooking, ...activeBookings];
      setActiveBookings(updatedActive);
    }
    
    // Persist to localStorage
    localStorage.setItem('customer_bookings', JSON.stringify(updatedBookings));
  };

  const updateBooking = (bookingId, updates) => {
    const updatedBookings = bookings.map(booking => 
      booking.id === bookingId ? { ...booking, ...updates } : booking
    );
    
    setBookings(updatedBookings);
    
    // Update active bookings
    const updatedActive = updatedBookings.filter(booking => {
      const isFinished = ['paid', 'cancelled'].includes(booking.status) || 
                       ['paid', 'cancelled'].includes(booking.current_stage);
      return !isFinished;
    });
    setActiveBookings(updatedActive);
    
    // Persist to localStorage
    localStorage.setItem('customer_bookings', JSON.stringify(updatedBookings));
  };

  const refreshBookings = () => {
    loadBookingsFromAPI();
  };

  return {
    bookings,
    activeBookings,
    loading,
    addBooking,
    updateBooking,
    refreshBookings
  };
};