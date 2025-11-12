import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WakeWordIndicatorProps {
  isListening: boolean;
  wakeWord?: string;
}

export const WakeWordIndicator = ({ isListening, wakeWord = 'hey malunita' }: WakeWordIndicatorProps) => {
  if (!isListening) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full shadow-lg">
        <div className="relative">
          <Mic className="w-4 h-4 text-primary" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-primary">Listening</span>
          <span className="text-[10px] text-muted-foreground">Say "{wakeWord}"</span>
        </div>
      </div>
    </div>
  );
};