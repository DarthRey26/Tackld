import { supabase } from '@/integrations/supabase/client';

export const realtimeService = {
  // Connection state management
  _activeChannels: new Map(),
  _reconnectAttempts: 0,
  _maxReconnectAttempts: 5,
  _reconnectDelay: 1000,

  // Throttling for bid updates
  _bidUpdateThrottlers: new Map(),
  _throttleDelay: 2000, // 2 seconds

  // Helper function to throttle updates
  _throttle(key, callback, delay = this._throttleDelay) {
    if (this._bidUpdateThrottlers.has(key)) {
      clearTimeout(this._bidUpdateThrottlers.get(key));
    }
    
    const timeoutId = setTimeout(() => {
      callback();
      this._bidUpdateThrottlers.delete(key);
    }, delay);
    
    this._bidUpdateThrottlers.set(key, timeoutId);
  },

  // Enhanced subscription with user filtering
  subscribeToBookingUpdates(bookingId, userId, callback) {
    // Handle null userId to prevent "null" string in channel names
    const safeUserId = userId || 'anonymous';
    const channelName = `booking:${bookingId}:${safeUserId}`;
    
    if (this._activeChannels.has(channelName)) {
      this.unsubscribe(this._activeChannels.get(channelName));
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          // Only send updates to relevant users (customer or contractor)
          if (payload.new && (
            !userId || // If no userId provided, send all updates
            payload.new.customer_id === userId || 
            payload.new.contractor_id === userId
          )) {
            this._throttle(`booking_${bookingId}`, () => callback(payload));
          }
        }
      )
      .subscribe();

    this._activeChannels.set(channelName, channel);
    return channel;
  },

  // Enhanced bid subscription with simplified filtering and proper event types
  subscribeToBids(bookingId, userId, callback) {
    // Handle null userId to prevent "null" string in channel names
    const safeUserId = userId || 'anonymous';
    const safeBookingId = bookingId || 'all';
    const channelName = `booking_bids:${safeBookingId}:${safeUserId}`;
    
    console.log('📡 Setting up bid subscription:', channelName);
    
    if (this._activeChannels.has(channelName)) {
      this.unsubscribe(this._activeChannels.get(channelName));
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          // Only add filter if we have a specific bookingId, otherwise listen to all bids
          ...(bookingId && { filter: `booking_id=eq.${bookingId}` })
        },
        (payload) => {
          console.log('📡 Raw bid payload received:', payload);
          
          // Add proper event type to payload for consistency
          const enhancedPayload = {
            ...payload,
            eventType: payload.eventType
          };
          
          // If we're listening to all bids, filter by contractor_id for contractors
          if (!bookingId && userId && payload.new?.contractor_id !== userId) {
            return; // Skip bids not from this contractor
          }
          
          // Send all bid updates - let the components filter if needed
          // This ensures customers get new bid notifications
          this._throttle(`bids_${safeBookingId}`, () => {
            console.log('📡 Sending bid update to callback:', enhancedPayload);
            callback(enhancedPayload);
          });
        }
      )
      .subscribe();

    this._activeChannels.set(channelName, channel);
    return channel;
  },

  // Subscribe to contractor's bookings with user filtering
  subscribeToContractorBookings(contractorId, callback) {
    const channelName = `contractor_bookings:${contractorId}`;
    
    if (this._activeChannels.has(channelName)) {
      this.unsubscribe(this._activeChannels.get(channelName));
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `contractor_id=eq.${contractorId}`
        },
        (payload) => {
          // Only updates for this specific contractor
          if (payload.new && payload.new.contractor_id === contractorId) {
            this._throttle(`contractor_bookings_${contractorId}`, () => callback(payload));
          }
        }
      )
      .subscribe();

    this._activeChannels.set(channelName, channel);
    return channel;
  },

  // Subscribe to customer's bookings with user filtering
  subscribeToCustomerBookings(customerId, callback) {
    const channelName = `customer_bookings:${customerId}`;
    
    if (this._activeChannels.has(channelName)) {
      this.unsubscribe(this._activeChannels.get(channelName));
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${customerId}`
        },
        (payload) => {
          // Only updates for this specific customer
          if (payload.new && payload.new.customer_id === customerId) {
            this._throttle(`customer_bookings_${customerId}`, () => callback(payload));
          }
        }
      )
      .subscribe();

    this._activeChannels.set(channelName, channel);
    return channel;
  },

  // Subscribe to available bookings for contractors with service filtering
  subscribeToAvailableBookings(serviceType, contractorId, callback) {
    const channelName = `available_bookings:${serviceType}:${contractorId}`;
    
    if (this._activeChannels.has(channelName)) {
      this.unsubscribe(this._activeChannels.get(channelName));
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `service_type=eq.${serviceType}`
        },
        (payload) => {
          // Only send updates for available bookings in contractor's service area
          if (payload.new && 
              payload.new.service_type === serviceType &&
              payload.new.contractor_id === null &&
              ['pending_bids', 'finding_contractor'].includes(payload.new.status)) {
            this._throttle(`available_bookings_${serviceType}_${contractorId}`, () => callback(payload));
          }
        }
      )
      .subscribe();

    this._activeChannels.set(channelName, channel);
    return channel;
  },

  // Subscribe to notifications with user filtering
  subscribeToNotifications(userId, callback) {
    const channelName = `notifications:${userId}`;
    
    if (this._activeChannels.has(channelName)) {
      this.unsubscribe(this._activeChannels.get(channelName));
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Only send notifications for this specific user
          if (payload.new && payload.new.user_id === userId) {
            callback(payload);
          }
        }
      )
      .subscribe();

    this._activeChannels.set(channelName, channel);
    return channel;
  },

  // Subscribe to profile updates
  subscribeToProfileUpdates(userId, callback) {
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return channel;
  },

  // Unsubscribe from a channel
  unsubscribe(channel) {
    if (channel) {
      // Find and remove from active channels
      for (const [key, value] of this._activeChannels.entries()) {
        if (value === channel) {
          this._activeChannels.delete(key);
          break;
        }
      }
      supabase.removeChannel(channel);
    }
  },

  // Enhanced unsubscribe from all channels with cleanup
  unsubscribeAll() {
    console.log('🧹 Cleaning up realtime service...');
    
    // Clear all throttlers
    for (const timeoutId of this._bidUpdateThrottlers.values()) {
      clearTimeout(timeoutId);
    }
    this._bidUpdateThrottlers.clear();
    
    // Remove all active channels individually for better cleanup
    for (const [channelName, channel] of this._activeChannels.entries()) {
      console.log(`📡 Removing channel: ${channelName}`);
      supabase.removeChannel(channel);
    }
    
    // Clear all active channels
    this._activeChannels.clear();
    
    // Reset connection state
    this._reconnectAttempts = 0;
    
    console.log('✅ Realtime service cleanup complete');
  },

  // Get connection status
  getConnectionStatus() {
    return {
      activeChannels: this._activeChannels.size,
      reconnectAttempts: this._reconnectAttempts,
      throttledUpdates: this._bidUpdateThrottlers.size
    };
  },

  // Subscribe to extra parts requests with booking callback support
  subscribeToExtraPartsRequests(userId, callback, bookingCallback = null) {
    const channel = supabase
      .channel(`extra_parts_requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extra_parts'
        },
        (payload) => {
          console.log('📦 Extra parts update:', payload);
          
          // Regular callback for contractors/updates
          if (callback) callback(payload);
          
          // Special booking callback for customer modal triggers
          if (payload.eventType === 'INSERT' && payload.new?.status === 'pending' && bookingCallback) {
            bookingCallback({
              type: 'extra_parts_added', 
              booking_id: payload.new.booking_id,
              extra_part: payload.new
            });
          }
        }
      )
      .subscribe();

    this._activeChannels.set(`extra_parts_requests:${userId}`, channel);
    return channel;
  },

  // Subscribe to reschedule requests
  subscribeToRescheduleRequests(userId, callback) {
    const channel = supabase
      .channel(`reschedule_requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reschedule_requests'
        },
        (payload) => {
          // Filter to only send events related to this user's bookings
          if (payload.new || payload.old) {
            callback(payload);
          }
        }
      )
      .subscribe();

    return channel;
  },

  // Send notification
  async sendNotification(userId, notification) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {}
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Send notification error:', error);
      return { data: null, error };
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return { data: null, error };
    }
  },

  // Get unread notifications count
  async getUnreadNotificationsCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { count, error: null };
    } catch (error) {
      console.error('Get unread notifications count error:', error);
      return { count: 0, error };
    }
  },

  // Get notifications for user
  async getUserNotifications(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user notifications error:', error);
      return { data: null, error };
    }
  }
};