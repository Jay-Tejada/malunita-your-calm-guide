import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, FileText, Lightbulb, Image, FileEdit, MoreHorizontal, Trash2 } from 'lucide-react';
import { ProjectPage } from '../types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OutlineSidebarProps {
  pages: ProjectPage[];
  activePage?: string;
  onPageSelect: (pageId: string) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (pageId: string) => void;
  onToggleCollapse: (pageId: string) => void;
}

const pageTypeIcons = {
  canvas: FileText,
  idea_board: Lightbulb,
  gallery: Image,
  structured_doc: FileEdit,
};

const PageItem = ({
  page,
  depth = 0,
  activePage,
  onPageSelect,
  onCreatePage,
  onDeletePage,
  onToggleCollapse,
}: {
  page: ProjectPage;
  depth?: number;
  activePage?: string;
  onPageSelect: (pageId: string) => void;
  onCreatePage: (parentId?: string) => void;
  onDeletePage: (pageId: string) => void;
  onToggleCollapse: (pageId: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = page.children && page.children.length > 0;
  const Icon = pageTypeIcons[page.page_type] || FileText;
  const isActive = activePage === page.id;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          isActive 
            ? 'bg-primary/10 text-primary' 
            : 'hover:bg-muted text-foreground/70 hover:text-foreground'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onPageSelect(page.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(page.id);
          }}
          className={cn(
            'w-4 h-4 flex items-center justify-center rounded hover:bg-foreground/10',
            !hasChildren && 'invisible'
          )}
        >
          {page.is_collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {/* Icon */}
        <span className="text-sm">{page.icon}</span>

        {/* Title */}
        <span className="flex-1 text-sm truncate">{page.title}</span>

        {/* Actions */}
        {isHovered && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onCreatePage(page.id)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-foreground/10"
            >
              <Plus className="w-3 h-3" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-foreground/10">
                  <MoreHorizontal className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onDeletePage(page.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && !page.is_collapsed && (
        <div>
          {page.children!.map((child) => (
            <PageItem
              key={child.id}
              page={child}
              depth={depth + 1}
              activePage={activePage}
              onPageSelect={onPageSelect}
              onCreatePage={onCreatePage}
              onDeletePage={onDeletePage}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OutlineSidebar = ({
  pages,
  activePage,
  onPageSelect,
  onCreatePage,
  onDeletePage,
  onToggleCollapse,
}: OutlineSidebarProps) => {
  return (
    <div className="w-64 h-full border-r border-border/50 bg-background/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pages
          </span>
          <button
            onClick={() => onCreatePage()}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {pages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No pages yet</p>
            <button
              onClick={() => onCreatePage()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Create your first page
            </button>
          </div>
        ) : (
          pages.map((page) => (
            <PageItem
              key={page.id}
              page={page}
              activePage={activePage}
              onPageSelect={onPageSelect}
              onCreatePage={onCreatePage}
              onDeletePage={onDeletePage}
              onToggleCollapse={onToggleCollapse}
            />
          ))
        )}
      </div>
    </div>
  );
};
