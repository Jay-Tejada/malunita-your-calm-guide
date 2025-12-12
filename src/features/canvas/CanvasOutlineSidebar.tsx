import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  MoreHorizontal,
  Trash2,
  Edit2,
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

  const renderPage = (page: Page, level: number) => {
    const children = buildTree(page.id, level + 1);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(page.id);
    const isActive = page.id === currentPageId;
    const isEditing = editingId === page.id;

    return (
      <div key={page.id}>
        <div
          className={cn(
            "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            isActive
              ? "bg-canvas-active text-canvas-text"
              : "text-canvas-text-muted hover:bg-canvas-bg hover:text-canvas-text"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => !isEditing && onPageSelect(page.id)}
        >
          {/* Expand/Collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(page.id);
            }}
            className={cn(
              "w-4 h-4 flex items-center justify-center",
              !hasChildren && "invisible"
            )}
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              ))}
          </button>

          {/* Icon */}
          <span className="text-sm">{page.icon || "📄"}</span>

          {/* Title */}
          {isEditing ? (
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => handleSaveTitle(page.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle(page.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              className="h-6 text-sm px-1 py-0 bg-canvas-bg border-canvas-border"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm font-mono truncate">{page.title}</span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {level < 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(page.id);
                  createPage.mutate(page.id);
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(page.id);
                    setEditingTitle(page.title);
                  }}
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePage.mutate(page.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderPage(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const rootPages = buildTree(null, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-3 border-b border-canvas-border">
        <h2 className="font-mono text-xs text-canvas-text-muted uppercase tracking-wider">
          Pages
        </h2>
      </div>

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {rootPages.map((page) => renderPage(page, 0))}
      </div>

      {/* Add Page Button */}
      <div className="p-2 border-t border-canvas-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-canvas-text-muted hover:text-canvas-text font-mono text-sm"
          onClick={() => createPage.mutate(null)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Page
        </Button>
      </div>
    </div>
  );
}
