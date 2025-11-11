import { useState } from "react";
import { Home, Briefcase, Dumbbell, FolderKanban, Inbox, Tag, Settings, Shield, ListTodo, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  onSettingsClick: () => void;
  onAllTasksClick: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Tag, Home, Briefcase, Dumbbell, FolderKanban, Inbox
};

const defaultCategories = [
  { name: "Inbox", icon: Inbox, path: "/inbox" },
  { name: "Projects", icon: FolderKanban, path: "/projects" },
  { name: "Work", icon: Briefcase, path: "/work" },
  { name: "Home", icon: Home, path: "/home" },
  { name: "Gym", icon: Dumbbell, path: "/gym" },
];

export function AppSidebar({ onSettingsClick, onAllTasksClick }: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { categories: customCategories } = useCustomCategories();
  const { toast } = useToast();
  
  const collapsed = state === "collapsed";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "signed out",
      description: "you've been signed out successfully.",
    });
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} bg-foreground border-r border-foreground/10`}
      collapsible="icon"
    >
      <SidebarContent className="bg-foreground">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-lg font-mono font-bold tracking-tight text-background lowercase">
            {!collapsed && "malunita"}
          </h1>
        </div>

        {/* Default Categories */}
        <SidebarGroup>
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} text-background/60 font-mono lowercase text-xs`}>
            folders
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {defaultCategories.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <button
                        onClick={onAllTasksClick}
                        className="w-full flex items-center gap-3 hover:bg-background/10 transition-colors text-background font-mono lowercase font-medium"
                      >
                        <IconComponent className="w-4 h-4" />
                        {!collapsed && <span>{item.name.toLowerCase()}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Custom Categories */}
        {customCategories && customCategories.length > 0 && (
          <>
            <div className="my-4 h-px bg-background/10" />
            <SidebarGroup>
              <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} text-background/60 font-mono lowercase text-xs`}>
                custom
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {customCategories.map((cat) => {
                    const IconComponent = ICON_MAP[cat.icon || 'Tag'] || Tag;
                    return (
                      <SidebarMenuItem key={cat.id}>
                        <SidebarMenuButton asChild>
                          <button
                            onClick={onAllTasksClick}
                            className="w-full flex items-center gap-3 hover:bg-background/10 transition-colors text-background font-mono lowercase font-medium"
                          >
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: cat.color }}
                            >
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            {!collapsed && <span>{cat.name.toLowerCase()}</span>}
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <div className="my-4 h-px bg-background/10" />

        {/* Actions */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={onAllTasksClick}
                    className="w-full flex items-center gap-3 hover:bg-background/10 transition-colors text-background font-mono lowercase font-medium"
                  >
                    <ListTodo className="w-4 h-4" />
                    {!collapsed && <span>all tasks</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-full flex items-center gap-3 hover:bg-background/10 transition-colors text-background font-mono lowercase font-medium"
                    >
                      <Shield className="w-4 h-4" />
                      {!collapsed && <span>admin</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={onSettingsClick}
                    className="w-full flex items-center gap-3 hover:bg-background/10 transition-colors text-background font-mono lowercase font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    {!collapsed && <span>settings</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 hover:bg-background/10 transition-colors text-background font-mono lowercase font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    {!collapsed && <span>sign out</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
