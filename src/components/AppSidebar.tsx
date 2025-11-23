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
  CheckSquare,
  Target,
  Sun,
  TrendingUp,
  Sparkles,
  Bell,
  Camera,
  Focus,
  Globe
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
  onFocusModeClick?: () => void;
  onWorldMapClick?: () => void;
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

export function AppSidebar({ onSettingsClick, onCategoryClick, onFocusModeClick, onWorldMapClick, activeCategory }: AppSidebarProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { categories: customCategories } = useCustomCategories();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  return (
    <Sidebar
      className="w-64 animate-slide-in-left"
      collapsible="offcanvas"
    >
      <SidebarContent className="bg-card">
        {/* Logo */}
        <div className="p-4">
          <h1 className="text-xl font-light tracking-tight text-foreground">
            malunita
          </h1>
        </div>

        <Separator />

        {/* Default Categories */}
        <SidebarGroup>
          <SidebarGroupLabel>
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
                    <span>{category.label}</span>
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
              <SidebarGroupLabel>
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
                        <span>{category.name}</span>
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
                  onClick={() => onCategoryClick('daily-session')}
                  className="hover:bg-muted/50"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Daily Session</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {onFocusModeClick && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={onFocusModeClick}
                    className="hover:bg-muted/50"
                  >
                    <Focus className="mr-2 h-4 w-4" />
                    <span>Focus Mode</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {onWorldMapClick && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={onWorldMapClick}
                    className="hover:bg-muted/50"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>Task Universe</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/weekly-insights')}
                  className="hover:bg-muted/50"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Weekly Insights</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/hatching-gallery')}
                  className="hover:bg-muted/50"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  <span>Hatching Memories</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/tiny-task-fiesta')}
                  className="hover:bg-muted/50"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>Tiny Task Fiesta</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/goals')}
                  className="hover:bg-muted/50"
                >
                  <Target className="mr-2 h-4 w-4" />
                  <span>Goals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/reminders')}
                  className="hover:bg-muted/50"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Reminders</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('all')}
                  className={activeCategory === 'all' ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50'}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  <span>All Tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
