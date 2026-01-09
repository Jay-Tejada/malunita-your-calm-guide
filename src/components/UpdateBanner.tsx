import { useEffect, useRef } from 'react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { useToast } from '@/hooks/use-toast';

export function UpdateBanner() {
  // Temporarily disabled - false positive update detection loop
  // TODO: Re-enable once service worker caching is stabilized
  return null;
}
