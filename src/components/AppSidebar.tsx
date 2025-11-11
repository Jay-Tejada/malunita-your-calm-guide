import { useState } from "react";
import { Home, Briefcase, Dumbbell, FolderKanban, Inbox, Tag, Settings, Shield, ListTodo, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4">
          <h1 className="text-xl font-light tracking-tight text-foreground">
            {!collapsed && "malunita"}
          </h1>
        </div>

        <Separator />

        {/* Default Categories */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Categories
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
                        className="w-full flex items-center gap-3 hover:bg-muted/50"
                      >
                        <IconComponent className="w-4 h-4" />
                        {!collapsed && <span>{item.name}</span>}
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
            <Separator />
            <SidebarGroup>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                Custom
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
                            className="w-full flex items-center gap-3 hover:bg-muted/50"
                          >
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                              style={{ backgroundColor: cat.color }}
                            >
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            {!collapsed && <span>{cat.name}</span>}
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

        <Separator />

        {/* Actions */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={onAllTasksClick}
                    className="w-full flex items-center gap-3 hover:bg-muted/50"
                  >
                    <ListTodo className="w-4 h-4" />
                    {!collapsed && <span>All Tasks</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-full flex items-center gap-3 hover:bg-muted/50"
                    >
                      <Shield className="w-4 h-4" />
                      {!collapsed && <span>Admin</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={onSettingsClick}
                    className="w-full flex items-center gap-3 hover:bg-muted/50"
                  >
                    <Settings className="w-4 h-4" />
                    {!collapsed && <span>Settings</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 hover:bg-muted/50"
                  >
                    <LogOut className="w-4 h-4" />
                    {!collapsed && <span>Sign Out</span>}
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
