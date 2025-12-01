import { useMemo } from 'react';
import * as chrono from 'chrono-node';

interface ParsedTaskInput {
  cleanTitle: string;           // Task text without the date portion
  detectedDate: Date | null;    // Parsed date/time
  detectedText: string | null;  // The text that was detected as a date (e.g., "tomorrow at 10am")
  hasTime: boolean;             // Whether a specific time was detected
  startIndex: number | null;    // Where the date text starts
  endIndex: number | null;      // Where the date text ends
}

export const useSmartDateParsing = (input: string): ParsedTaskInput => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        cleanTitle: '',
        detectedDate: null,
        detectedText: null,
        hasTime: false,
        startIndex: null,
        endIndex: null,
      };
    }

    // Parse the input for dates
    const results = chrono.parse(input, new Date(), { forwardDate: true });
    
    if (results.length === 0) {
      return {
        cleanTitle: input,
        detectedDate: null,
        detectedText: null,
        hasTime: false,
        startIndex: null,
        endIndex: null,
      };
    }

    // Take the first (most relevant) result
    const result = results[0];
    const detectedDate = result.start.date();
    const detectedText = result.text;
    const startIndex = result.index;
    const endIndex = result.index + result.text.length;
    
    // Check if a specific time was detected (not just a date)
    const hasTime = result.start.isCertain('hour');
    
    // Remove the date portion from the title
    // Also clean up common prepositions like "by", "at", "on"
    let cleanTitle = input.slice(0, startIndex) + input.slice(endIndex);
    
    // Clean up leftover prepositions
    cleanTitle = cleanTitle
      .replace(/\s+(by|at|on|for|until|before)\s*$/i, '')
      .replace(/^\s*(by|at|on|for|until|before)\s+/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return {
      cleanTitle,
      detectedDate,
      detectedText,
      hasTime,
      startIndex,
      endIndex,
    };
  }, [input]);
};
