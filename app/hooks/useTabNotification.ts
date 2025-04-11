import { useEffect, useRef } from 'react';

export const useTabNotification = (isActive: boolean, currentTab: string, targetTab: string) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && currentTab !== targetTab) {
      const originalTitle = document.title;
      intervalRef.current = setInterval(() => {
        document.title = document.title === originalTitle 
          ? '🔴 New Activity!' 
          : originalTitle;
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        document.title = originalTitle;
      };
    }
  }, [isActive, currentTab, targetTab]);
}; 