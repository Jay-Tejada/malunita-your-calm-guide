import { useEffect, useRef, useState, useCallback } from 'react';

interface Task {
  id: string;
  title: string;
  category?: string;
  created_at: string;
  completed: boolean;
  is_tiny_task?: boolean;
  reminder_time?: string;
  [key: string]: any;
}

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  mood?: string;
}

interface WorkerMessage {
  type: string;
  [key: string]: any;
}

/**
 * Hook to use AI Worker for heavy computations
 * Keeps UI responsive by running processing in background thread
 */
export function useAIWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Create worker on mount
    try {
      workerRef.current = new Worker(
        new URL('../workers/ai-processor.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      console.log('AI Worker initialized');
    } catch (err) {
      console.error('Failed to create AI Worker:', err);
      setError('Failed to initialize background processing');
    }
    
    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        console.log('AI Worker terminated');
      }
    };
  }, []);
  
  /**
   * Send message to worker and wait for response
   */
  const sendMessage = useCallback(<T>(type: string, data: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        return reject(new Error('Worker not initialized'));
      }
      
      setIsProcessing(true);
      setError(null);
      
      const handleMessage = (e: MessageEvent<WorkerMessage>) => {
        const { type: responseType, error: workerError, ...responseData } = e.data;
        
        // Check if this is the response we're waiting for
        const expectedType = type.replace('_', '_').toUpperCase() + '_READY';
        const isExpectedResponse = 
          responseType === `${type}_READY` ||
          responseType === expectedType ||
          responseType.includes(type.split('_')[0]);
        
        if (responseType === 'ERROR') {
          setIsProcessing(false);
          setError(workerError);
          workerRef.current?.removeEventListener('message', handleMessage);
          reject(new Error(workerError));
        } else if (isExpectedResponse) {
          setIsProcessing(false);
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(responseData as T);
        }
      };
      
      // Add timeout
      const timeout = setTimeout(() => {
        setIsProcessing(false);
        workerRef.current?.removeEventListener('message', handleMessage);
        reject(new Error('Worker timeout'));
      }, 30000); // 30 second timeout
      
      workerRef.current.addEventListener('message', (e) => {
        clearTimeout(timeout);
        handleMessage(e);
      });
      
      workerRef.current.postMessage({ type, data });
    });
  }, []);
  
  /**
   * Analyze patterns in tasks
   */
  const analyzePatterns = useCallback(async (tasks: Task[]) => {
    try {
      const result = await sendMessage<{
        patterns: {
          categoryDistribution: Record<string, number>;
          peakHours: number[];
          recurringTasks: string[];
        }
      }>('ANALYZE_PATTERNS', { tasks });
      return result.patterns;
    } catch (err) {
      console.error('Pattern analysis failed:', err);
      throw err;
    }
  }, [sendMessage]);
  
  /**
   * Generate insights from journal entries
   */
  const generateInsights = useCallback(async (entries: JournalEntry[]) => {
    try {
      const result = await sendMessage<{
        insights: {
          sentiment: { positive: number; negative: number; neutral: number };
          themes: string[];
          totalEntries: number;
        }
      }>('GENERATE_INSIGHTS', { entries });
      return result.insights;
    } catch (err) {
      console.error('Insight generation failed:', err);
      throw err;
    }
  }, [sendMessage]);
  
  /**
   * Categorize multiple tasks in batch
   */
  const categorizeBatch = useCallback(async (tasks: Task[]) => {
    try {
      const result = await sendMessage<{
        categorized: Task[]
      }>('CATEGORIZE_BATCH', { tasks });
      return result.categorized;
    } catch (err) {
      console.error('Batch categorization failed:', err);
      throw err;
    }
  }, [sendMessage]);
  
  /**
   * Compute priority scores for tasks
   */
  const computePriorities = useCallback(async (tasks: Task[]) => {
    try {
      const result = await sendMessage<{
        priorities: Task[]
      }>('COMPUTE_PRIORITIES', { tasks });
      return result.priorities;
    } catch (err) {
      console.error('Priority computation failed:', err);
      throw err;
    }
  }, [sendMessage]);
  
  /**
   * Detect burnout risk
   */
  const detectBurnout = useCallback(async (tasks: Task[], journal: JournalEntry[]) => {
    try {
      const result = await sendMessage<{
        burnout: {
          risk: 'low' | 'medium' | 'high';
          factors: string[];
          score: number;
        }
      }>('DETECT_BURNOUT', { tasks, journal });
      return result.burnout;
    } catch (err) {
      console.error('Burnout detection failed:', err);
      throw err;
    }
  }, [sendMessage]);
  
  return {
    analyzePatterns,
    generateInsights,
    categorizeBatch,
    computePriorities,
    detectBurnout,
    isProcessing,
    error,
    isReady: !!workerRef.current,
  };
}
