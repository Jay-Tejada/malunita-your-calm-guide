import { useEffect } from 'react';

// Track core web vitals
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  // First Contentful Paint (FCP)
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        console.log('FCP:', entry.startTime);
        logMetric('fcp', entry.startTime);
      }
    }
  });
  
  try {
    paintObserver.observe({ entryTypes: ['paint'] });
  } catch (e) {
    // Browser doesn't support paint timing
  }
  
  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
    logMetric('lcp', lastEntry.startTime);
  });
  
  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Browser doesn't support LCP
  }
  
  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as any;
      const fid = fidEntry.processingStart - fidEntry.startTime;
      console.log('FID:', fid);
      logMetric('fid', fid);
    }
  });
  
  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // Browser doesn't support FID
  }
  
  // Cumulative Layout Shift (CLS)
  let clsScore = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const clsEntry = entry as any;
      if (!clsEntry.hadRecentInput) {
        clsScore += clsEntry.value;
        console.log('CLS:', clsScore);
        logMetric('cls', clsScore);
      }
    }
  });
  
  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // Browser doesn't support CLS
  }
}

// Track specific user actions
export function trackAction(action: string, metadata?: Record<string, any>) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`${action} took ${duration.toFixed(2)}ms`);
      logMetric(action, duration, metadata);
    }
  };
}

function logMetric(name: string, value: number, metadata?: Record<string, any>) {
  try {
    // Store in localStorage for debugging
    const metrics = JSON.parse(localStorage.getItem('perf_metrics') || '[]');
    metrics.push({
      name,
      value: Math.round(value * 100) / 100,
      metadata,
      timestamp: Date.now()
    });
    
    // Keep last 100 metrics
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    localStorage.setItem('perf_metrics', JSON.stringify(metrics));
    
    // In production, send to analytics service
    if (import.meta.env.PROD) {
      // Send to your analytics endpoint
      // Example: fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ name, value, metadata }) })
    }
  } catch (e) {
    console.warn('Failed to log metric:', e);
  }
}

// Usage hook
export function usePerformanceTracking(actionName: string) {
  useEffect(() => {
    const tracker = trackAction(actionName);
    return () => tracker.end();
  }, [actionName]);
}

// Get all metrics
export function getPerformanceMetrics() {
  try {
    return JSON.parse(localStorage.getItem('perf_metrics') || '[]');
  } catch {
    return [];
  }
}

// Clear metrics
export function clearPerformanceMetrics() {
  localStorage.removeItem('perf_metrics');
}
