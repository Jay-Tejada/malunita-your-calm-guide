import React, { useState } from "react";
import { 
  Inbox, 
  Calendar,
  CalendarClock,
  FolderKanban,
  Home,
  Briefcase, 
  Dumbbell,
  Settings, 
  Target,
  Bell,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Heart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomCategories } from "@/hooks/useCustomCategories";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
  onSettingsClick: () => void;
  onCategoryClick: (category: string) => void;
  onCompanionHubClick?: () => void;
  activeCategory: string | null;
}

export function AppSidebar({ 
  onSettingsClick, 
  onCategoryClick, 
  onCompanionHubClick,
  activeCategory 
}: AppSidebarProps) {
  const navigate = useNavigate();
  const { categories: customCategories } = useCustomCategories();

  const [spacesOpen, setSpacesOpen] = useState(false);
  const [hubsOpen, setHubsOpen] = useState(false);

  const isActive = (category: string) => activeCategory === category;

  return (
    <Sidebar className="w-64" collapsible="offcanvas">
      <SidebarContent className="bg-gradient-to-b from-background to-background/95">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-xl font-medium tracking-tight text-foreground font-mono">
            malunita
          </h1>
        </div>

        <Separator className="opacity-30" />

        {/* Top Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('inbox')}
                  className={isActive('inbox') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('today')}
                  className={isActive('today') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('upcoming')}
                  className={isActive('upcoming') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Upcoming</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('projects')}
                  className={isActive('projects') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="opacity-30 my-2" />

        {/* Spaces (Collapsible) */}
        <Collapsible open={spacesOpen} onOpenChange={setSpacesOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/30 rounded-md transition-colors">
              <span className="font-medium">Spaces</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${spacesOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => onCategoryClick('work')}
                      className={isActive('work') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Work</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => onCategoryClick('home')}
                      className={isActive('home') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}
                    >
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => onCategoryClick('gym')}
                      className={isActive('gym') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}
                    >
                      <Dumbbell className="w-4 h-4" />
                      <span>Gym</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Separator className="opacity-30 my-2" />

        {/* Hubs (Collapsible) */}
        <Collapsible open={hubsOpen} onOpenChange={setHubsOpen}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/30 rounded-md transition-colors">
              <span className="font-medium">Hubs</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${hubsOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onCompanionHubClick} className="hover:bg-muted/50">
                      <Sparkles className="w-4 h-4" />
                      <span>Companion Hub</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/weekly-insights')} className="hover:bg-muted/50">
                      <TrendingUp className="w-4 h-4" />
                      <span>Insights Hub</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate('/journal')} className="hover:bg-muted/50">
                      <Heart className="w-4 h-4" />
                      <span>Feelings Hub</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Separator className="opacity-30 my-2 mt-auto" />

        {/* Bottom Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/goals')} className="hover:bg-muted/50">
                  <Target className="w-4 h-4" />
                  <span>Goals</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/reminders')} className="hover:bg-muted/50">
                  <Bell className="w-4 h-4" />
                  <span>Reminders</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={onSettingsClick} className="hover:bg-muted/50">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
