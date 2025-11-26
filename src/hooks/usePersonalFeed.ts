import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PersonalFeed {
  insight: string;
  pattern: string | null;
  flashback: string | null;
}

const FEED_INTERVAL_MIN = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const FEED_INTERVAL_MAX = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STORAGE_KEY = 'malunita_last_feed_shown';

export function usePersonalFeed() {
  const [currentFeed, setCurrentFeed] = useState<PersonalFeed | null>(null);
  const [showFeed, setShowFeed] = useState(false);

  const getRandomInterval = () => {
    return Math.random() * (FEED_INTERVAL_MAX - FEED_INTERVAL_MIN) + FEED_INTERVAL_MIN;
  };

  const fetchAndShowFeed = async () => {
    try {
      // Check if user is authenticated first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('User not authenticated, skipping personal feed');
        return;
      }

      const { data, error } = await supabase.functions.invoke('malunita-personal-feed');
      
      if (error) {
        console.error('Error fetching personal feed:', error);
        return;
      }

      if (data) {
        setCurrentFeed(data);
        setShowFeed(true);
        
        // Store the timestamp
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
          setShowFeed(false);
          setCurrentFeed(null);
        }, 8000);
      }
    } catch (error) {
      console.error('Failed to fetch personal feed:', error);
    }
  };

  const shouldShowFeed = () => {
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (!lastShown) return true;
    
    const timeSinceLastShown = Date.now() - parseInt(lastShown);
    return timeSinceLastShown >= FEED_INTERVAL_MIN;
  };

  useEffect(() => {
    // Check if we should show feed on mount
    if (shouldShowFeed()) {
      // Random delay between 5-15 seconds after mount to feel more natural
      const initialDelay = Math.random() * 10000 + 5000;
      
      const initialTimer = setTimeout(() => {
        fetchAndShowFeed();
      }, initialDelay);

      return () => clearTimeout(initialTimer);
    }
  }, []);

  useEffect(() => {
    // Set up recurring check
    const checkInterval = setInterval(() => {
      if (shouldShowFeed()) {
        fetchAndShowFeed();
      }
    }, 30 * 60 * 1000); // Check every 30 minutes

    return () => clearInterval(checkInterval);
  }, []);

  return {
    currentFeed,
    showFeed,
  };
}