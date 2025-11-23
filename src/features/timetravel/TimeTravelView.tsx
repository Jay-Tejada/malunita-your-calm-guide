import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks } from "@/hooks/useTasks";
import { PastView } from "./PastView";
import { FutureView } from "./FutureView";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export const TimeTravelView = () => {
  const { tasks } = useTasks();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const now = new Date();
  const past90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const future60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  // Filter tasks by time range
  const pastTasks = tasks?.filter(task => {
    const createdDate = new Date(task.created_at);
    return createdDate >= past90Days && createdDate < now;
  }) || [];

  const futureTasks = tasks?.filter(task => {
    if (!task.focus_date && !task.reminder_time) return false;
    const targetDate = new Date(task.focus_date || task.reminder_time || '');
    return targetDate >= now && targetDate <= future60Days;
  }) || [];

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    } else {
      setPan(prev => prev - e.deltaX);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX - pan);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan(e.clientX - startX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX - pan);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan(0);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-background via-background/80 to-primary/5">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetView}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline Canvas */}
      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          className="relative h-full w-full"
          style={{
            transform: `scale(${zoom}) translateX(${pan}px)`,
            transformOrigin: "center center",
          }}
          animate={{
            transform: `scale(${zoom}) translateX(${pan}px)`,
          }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
          {/* Timeline indicator */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30 z-10" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              className="px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full border border-primary/40"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-sm font-medium text-primary">NOW</span>
            </motion.div>
          </div>

          {/* Past and Future Views */}
          <div className="flex h-full w-[200%]">
            <div className="w-1/2 h-full">
              <PastView tasks={pastTasks} />
            </div>
            <div className="w-1/2 h-full">
              <FutureView tasks={futureTasks} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-background/80 backdrop-blur-sm rounded-lg border border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">Past Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Future Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-muted-foreground">Overdue</span>
        </div>
      </div>
    </div>
  );
};
