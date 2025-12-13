import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Page {
  id: string;
  title: string;
  parent_page_id: string | null;
  icon: string | null;
  is_collapsed: boolean | null;
  sort_order: number | null;
}

interface CanvasOutlineSidebarProps {
  projectId: string;
  pages: Page[];
  currentPageId?: string;
  onPageSelect: (pageId: string) => void;
}

interface SortablePageItemProps {
  page: Page;
  level: number;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  hasChildren: boolean;
  isExpanded: boolean;
  children: Page[];
  onToggleExpand: (id: string) => void;
  onPageSelect: (id: string) => void;
  onStartEdit: (id: string, title: string) => void;
  onSaveTitle: (id: string) => void;
  onCancelEdit: () => void;
  onEditingTitleChange: (title: string) => void;
  onCreateChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  renderPage: (page: Page, level: number) => React.ReactNode;
}

function SortablePageItem({
  page,
  level,
  isActive,
  isEditing,
  editingTitle,
  hasChildren,
  isExpanded,
  children,
  onToggleExpand,
  onPageSelect,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
  onEditingTitleChange,
  onCreateChild,
  onDelete,
  renderPage,
}: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group flex items-center gap-2 py-1.5 rounded-md cursor-pointer transition-all duration-150",
          isActive
            ? "bg-white/5 text-canvas-text"
            : "text-canvas-text-muted hover:bg-white/[0.03] hover:text-canvas-text",
          isDragging && "shadow-lg bg-canvas-sidebar"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px`, paddingRight: '8px' }}
        onClick={() => !isEditing && onPageSelect(page.id)}
      >
        {/* Disclosure Arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(page.id);
          }}
          className={cn(
            "w-4 h-4 flex items-center justify-center shrink-0 transition-transform duration-200",
            hasChildren ? "opacity-60 hover:opacity-100" : "opacity-0"
          )}
        >
          <ChevronRight 
            className={cn(
              "w-3 h-3 transition-transform duration-200",
              isExpanded && "rotate-90"
            )} 
          />
        </button>

        {/* Icon */}
        <span className="text-sm shrink-0">{page.icon || "📄"}</span>

        {/* Title */}
        {isEditing ? (
          <Input
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onBlur={() => onSaveTitle(page.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveTitle(page.id);
              if (e.key === "Escape") onCancelEdit();
            }}
            className="h-6 text-sm px-1.5 py-0 bg-background/50 border-border/50 flex-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{page.title}</span>
        )}

        {/* Hover Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="w-5 h-5 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3" />
          </button>

          {/* Add Child */}
          {level < 2 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground/50 hover:text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onCreateChild(page.id);
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground/50 hover:text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(page.id, page.title);
                }}
              >
                <Edit2 className="w-3 h-3 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(page.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children with smooth collapse animation */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isExpanded ? "opacity-100" : "opacity-0 max-h-0"
        )}
        style={{ 
          maxHeight: isExpanded ? `${children.length * 40}px` : 0 
        }}
      >
        {children.map((child) => renderPage(child, level + 1))}
      </div>
    </div>
  );
}

export function CanvasOutlineSidebar({
  projectId,
  pages,
  currentPageId,
  onPageSelect,
}: CanvasOutlineSidebarProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build tree structure
  const buildTree = (parentId: string | null = null, level = 0): Page[] => {
    if (level > 2) return []; // Max 3 levels
    return pages
      .filter((p) => p.parent_page_id === parentId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  };

  // Create page mutation
  const createPage = useMutation({
    mutationFn: async (parentId: string | null = null) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const siblingPages = pages.filter((p) => p.parent_page_id === parentId);
      const maxOrder = Math.max(...siblingPages.map((p) => p.sort_order || 0), -1);

      const { data, error } = await supabase
        .from("project_pages")
        .insert({
          project_id: projectId,
          user_id: user.id,
          parent_page_id: parentId,
          title: "Untitled",
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ["canvas-pages", projectId] });
      onPageSelect(page.id);
      setEditingId(page.id);
      setEditingTitle("Untitled");
    },
  });

  // Update page mutation
  const updatePage = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from("project_pages")
        .update({ title })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-pages", projectId] });
      setEditingId(null);
    },
  });

  // Reorder pages mutation
  const reorderPages = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("project_pages")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-pages", projectId] });
    },
  });

  // Delete page mutation
  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      // Delete all child pages first
      const childPages = pages.filter((p) => p.parent_page_id === id);
      for (const child of childPages) {
        await supabase.from("project_pages").delete().eq("id", child.id);
      }
      // Delete the page
      const { error } = await supabase.from("project_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["canvas-pages", projectId] });
      toast.success("Page deleted");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the parent of the active item
    const activePage = pages.find((p) => p.id === activeId);
    const overPage = pages.find((p) => p.id === overId);

    if (!activePage || !overPage) return;

    // Only reorder within the same parent level
    if (activePage.parent_page_id !== overPage.parent_page_id) return;

    const parentId = activePage.parent_page_id;
    const siblingPages = pages
      .filter((p) => p.parent_page_id === parentId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const oldIndex = siblingPages.findIndex((p) => p.id === activeId);
    const newIndex = siblingPages.findIndex((p) => p.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedPages = arrayMove(siblingPages, oldIndex, newIndex);
    const updates = reorderedPages.map((page, index) => ({
      id: page.id,
      sort_order: index,
    }));

    reorderPages.mutate(updates);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSaveTitle = (id: string) => {
    if (editingTitle.trim()) {
      updatePage.mutate({ id, title: editingTitle.trim() });
    } else {
      setEditingId(null);
    }
  };

  const renderPage = (page: Page, level: number): React.ReactNode => {
    const children = buildTree(page.id, level + 1);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(page.id);
    const isActive = page.id === currentPageId;
    const isEditing = editingId === page.id;

    return (
      <SortablePageItem
        key={page.id}
        page={page}
        level={level}
        isActive={isActive}
        isEditing={isEditing}
        editingTitle={editingTitle}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        children={children}
        onToggleExpand={toggleExpand}
        onPageSelect={onPageSelect}
        onStartEdit={(id, title) => {
          setEditingId(id);
          setEditingTitle(title);
        }}
        onSaveTitle={handleSaveTitle}
        onCancelEdit={() => setEditingId(null)}
        onEditingTitleChange={setEditingTitle}
        onCreateChild={(parentId) => {
          toggleExpand(parentId);
          createPage.mutate(parentId);
        }}
        onDelete={(id) => deletePage.mutate(id)}
        renderPage={renderPage}
      />
    );
  };

  const rootPages = buildTree(null, 0);

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Pages
        </h2>
      </div>

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rootPages.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {rootPages.map((page) => renderPage(page, 0))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Page Button */}
      <div className="p-3 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5 text-sm"
          onClick={() => createPage.mutate(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>
    </div>
  );
}
