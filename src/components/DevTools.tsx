import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getPerformanceMetrics, clearPerformanceMetrics } from '@/lib/performance';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  
  if (import.meta.env.PROD) return null;
  
  const showMetrics = () => {
    const metrics = getPerformanceMetrics();
    console.table(metrics);
    console.log('Full metrics:', metrics);
  };
  
  const clearAllData = () => {
    if (confirm('Clear all localStorage data? This will log you out.')) {
      localStorage.clear();
      window.location.reload();
    }
  };
  
  const showQueryCache = () => {
    const cache = (window as any).__REACT_QUERY_DEVTOOLS__;
    console.log('React Query Cache:', cache);
  };
  
  const triggerError = () => {
    throw new Error('Test error from DevTools');
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isOpen && (
        <Card className="mb-2 p-4 w-64 space-y-2">
          <h3 className="font-semibold text-sm mb-2">Dev Tools</h3>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={showMetrics}
          >
            Show Performance Metrics
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={showQueryCache}
          >
            Show Query Cache
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={() => clearPerformanceMetrics()}
          >
            Clear Metrics
          </Button>
          
          <Button 
            size="sm" 
            variant="destructive" 
            className="w-full"
            onClick={clearAllData}
          >
            Clear All Data
          </Button>
          
          <Button 
            size="sm" 
            variant="destructive" 
            className="w-full"
            onClick={triggerError}
          >
            Trigger Test Error
          </Button>
        </Card>
      )}
      
      <Button
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="shadow-lg"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        <span className="ml-2">Dev</span>
      </Button>
    </div>
  );
}
