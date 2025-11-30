// Fallback for failed API calls
export async function withFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => T,
  errorMessage?: string
): Promise<T> {
  try {
    return await primaryFn();
  } catch (error) {
    console.warn(errorMessage || 'Primary function failed, using fallback', error);
    return fallbackFn();
  }
}

// Retry with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      console.log(`Retry attempt ${i + 1} of ${maxRetries}`);
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Safe JSON parse with fallback
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Safe localStorage get with fallback
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

// Safe localStorage set
export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Failed to save to localStorage: ${key}`, e);
    return false;
  }
}
