import { useState } from 'react';
import { ChevronDown, Search, Sparkles, Check, ArrowLeft, Settings } from 'lucide-react';
import { CanvasProject } from '../types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface CanvasTopbarProps {
  projects: CanvasProject[];
  activeProject?: CanvasProject;
  onProjectSelect: (projectId: string) => void;
  onBack: () => void;
  onAIAssist?: () => void;
}

export const CanvasTopbar = ({
  projects,
  activeProject,
  onProjectSelect,
  onBack,
  onAIAssist,
}: CanvasTopbarProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-12 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center px-4 gap-3">
      {/* Back button */}
      <button
        onClick={onBack}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Project switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
            <span className="text-lg">{activeProject?.icon || '📁'}</span>
            <span className="font-medium text-sm">{activeProject?.name || 'Select Project'}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              className="flex items-center gap-2"
            >
              <span>{project.icon}</span>
              <span className="flex-1">{project.name}</span>
              {project.id === activeProject?.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      {showSearch ? (
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="pl-9 h-8 text-sm"
            autoFocus
            onBlur={() => {
              if (!searchQuery) setShowSearch(false);
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowSearch(true)}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {/* AI Assist orb */}
      <button
        onClick={onAIAssist}
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-full transition-all',
          'bg-gradient-to-br from-violet-500 to-purple-600',
          'hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105'
        )}
      >
        <Sparkles className="w-4 h-4 text-white" />
      </button>

      {/* Save indicator */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Saved</span>
      </div>
    </div>
  );
};
