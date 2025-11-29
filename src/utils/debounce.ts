/**
 * Debounce utility function
 * Delays execution of a function until after a specified wait time has elapsed
 * since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   searchAPI(query);
 * }, 500);
 * 
 * // Call it multiple times rapidly
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this one will execute after 500ms
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    // Clear the previous timeout if it exists
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Debounce utility with cancel method
 * Like debounce() but returns an object with a cancel method
 * 
 * @example
 * const search = debounceWithCancel((query: string) => {
 *   searchAPI(query);
 * }, 500);
 * 
 * search.debounced('abc');
 * search.cancel(); // Cancel the pending call
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const debounced = (...args: Parameters<T>) => {
    cancel();
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };

  return { debounced, cancel };
}
