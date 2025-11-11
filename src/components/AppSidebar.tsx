import React from "react";
import { 
  Home, 
  Briefcase, 
  Dumbbell, 
  FolderKanban, 
  Inbox, 
  Tag, 
  Settings, 
  Shield, 
  ListTodo, 
  LogOut,
  CheckSquare 
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
  onSettingsClick: () => void;
  onCategoryClick: (category: string) => void;
  activeCategory: string | null;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Tag, Home, Briefcase, Dumbbell, FolderKanban, Inbox
};

const defaultCategories = [
  { label: "Inbox", icon: Inbox, path: "/inbox" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Work", icon: Briefcase, path: "/work" },
  { label: "Home", icon: Home, path: "/home" },
  { label: "Gym", icon: Dumbbell, path: "/gym" },
];

export function AppSidebar({ onSettingsClick, onCategoryClick, activeCategory }: AppSidebarProps) {
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
              {defaultCategories.map((category) => (
                <SidebarMenuItem key={category.path}>
                  <SidebarMenuButton 
                    onClick={() => onCategoryClick(category.path.replace('/', '') || 'inbox')}
                    className={activeCategory === (category.path.replace('/', '') || 'inbox') ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'}
                  >
                    <category.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{category.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                  {customCategories?.map((category) => (
                    <SidebarMenuItem key={category.id}>
                      <SidebarMenuButton
                        onClick={() => onCategoryClick(`custom-${category.id}`)}
                        className={activeCategory === `custom-${category.id}` ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'}
                      >
                        <div 
                          className="w-2 h-2 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.icon && ICON_MAP[category.icon] && (
                          React.createElement(ICON_MAP[category.icon], { 
                            className: "mr-2 h-4 w-4",
                            style: { color: category.color }
                          })
                        )}
                        {!collapsed && <span>{category.name}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('all')}
                  className={activeCategory === 'all' ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {!collapsed && <span>All Tasks</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Admin</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
