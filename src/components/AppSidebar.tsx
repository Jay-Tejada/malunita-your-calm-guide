import React from "react";
import { 
  Home, 
  Inbox, 
  Calendar, 
  FolderKanban,
  Briefcase, 
  Dumbbell,
  Settings, 
  Shield, 
  Sparkles,
  Palette,
  Globe,
  Wand2,
  TrendingUp,
  BarChart3,
  Network,
  Heart,
  Moon,
  Focus,
  ChevronRight,
  Lightbulb,
  Brain,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { TeachMalunitaModal } from "@/components/TeachMalunitaModal";

interface AppSidebarProps {
  onSettingsClick: () => void;
  onCategoryClick: (category: string) => void;
  onFocusModeClick?: () => void;
  onWorldMapClick?: () => void;
  onShareMalunitaClick?: () => void;
  onDreamModeClick?: () => void;
  activeCategory: string | null;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Home, Briefcase, Dumbbell, FolderKanban, Inbox
};

export function AppSidebar({ 
  onSettingsClick, 
  onCategoryClick, 
  onFocusModeClick, 
  onWorldMapClick, 
  onDreamModeClick,
  activeCategory 
}: AppSidebarProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { categories: customCategories } = useCustomCategories();
  const { toast } = useToast();
  const [companionHubOpen, setCompanionHubOpen] = React.useState(false);
  const [insightsHubOpen, setInsightsHubOpen] = React.useState(false);
  const [feelingsHubOpen, setFeelingsHubOpen] = React.useState(false);
  const [teachMalunitaOpen, setTeachMalunitaOpen] = React.useState(false);


  const isActive = (category: string) => activeCategory === category;

  return (
    <Sidebar
      className="w-64"
      collapsible="offcanvas"
    >
      <SidebarContent className="bg-sidebar-bg">
        {/* Logo */}
        <div className="p-5">
          <h1 className="text-xl font-medium tracking-tight text-foreground font-mono">
            malunita
          </h1>
        </div>

        <Separator className="opacity-50" />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('inbox')}
                  className={isActive('inbox') ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                >
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('today')}
                  className={isActive('today') ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                >
                  <Home className="w-4 h-4" />
                  <span>Today</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('upcoming')}
                  className={isActive('upcoming') ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => onCategoryClick('projects')}
                  className={isActive('projects') ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Projects</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spaces (Dynamic Categories) */}
        <Separator className="opacity-50" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground px-3">
            Spaces
          </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => onCategoryClick('work')}
                      className={isActive('work') ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Work</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => onCategoryClick('home')}
                      className={isActive('home') ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                    >
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => onCategoryClick('gym')}
                      className={isActive('gym') ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                    >
                      <Dumbbell className="w-4 h-4" />
                      <span>Gym</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {customCategories?.map((category) => (
                    <SidebarMenuItem key={category.id}>
                      <SidebarMenuButton
                        onClick={() => onCategoryClick(`custom-${category.id}`)}
                        className={isActive(`custom-${category.id}`) ? 'bg-sidebar-active text-primary font-medium' : 'hover:bg-sidebar-active/50'}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="opacity-50" />

        {/* Collapsible Groups */}
            {/* Companion Hub */}
            <Collapsible open={companionHubOpen} onOpenChange={setCompanionHubOpen}>
              <SidebarGroup>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground hover:bg-sidebar-active/30 rounded-md transition-colors">
                  <span>Companion Hub</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${companionHubOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/customization')} className="hover:bg-sidebar-active/50">
                          <Palette className="w-4 h-4" />
                          <span>Customize Companion</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/hatching-gallery')} className="hover:bg-sidebar-active/50">
                          <Sparkles className="w-4 h-4" />
                          <span>Animations</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/ambient-worlds')} className="hover:bg-sidebar-active/50">
                          <Globe className="w-4 h-4" />
                          <span>Ambient Worlds</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/timetravel')} className="hover:bg-sidebar-active/50">
                          <Wand2 className="w-4 h-4" />
                          <span>Future Evolutions</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Insights Hub */}
            <Collapsible open={insightsHubOpen} onOpenChange={setInsightsHubOpen}>
              <SidebarGroup>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground hover:bg-sidebar-active/30 rounded-md transition-colors">
                  <span>Insights Hub</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${insightsHubOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/weekly-insights')} className="hover:bg-sidebar-active/50">
                          <TrendingUp className="w-4 h-4" />
                          <span>Weekly Insights</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/monthly-insights')} className="hover:bg-sidebar-active/50">
                          <BarChart3 className="w-4 h-4" />
                          <span>Monthly Insights</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/clusters')} className="hover:bg-sidebar-active/50">
                          <Network className="w-4 h-4" />
                          <span>Knowledge Clusters</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/learning')} className="hover:bg-sidebar-active/50">
                          <Brain className="w-4 h-4" />
                          <span>Learning Profile</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setTeachMalunitaOpen(true)} className="hover:bg-sidebar-active/50">
                          <Lightbulb className="w-4 h-4" />
                          <span>Teach Malunita</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* Feelings Hub */}
            <Collapsible open={feelingsHubOpen} onOpenChange={setFeelingsHubOpen}>
              <SidebarGroup>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground hover:bg-sidebar-active/30 rounded-md transition-colors">
                  <span>Feelings Hub</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${feelingsHubOpen ? 'rotate-90' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/journal')} className="hover:bg-sidebar-active/50">
                          <Heart className="w-4 h-4" />
                          <span>Mood Tracker</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/thoughts')} className="hover:bg-sidebar-active/50">
                          <Lightbulb className="w-4 h-4" />
                          <span>Thoughts</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigate('/daily-session')} className="hover:bg-sidebar-active/50">
                          <Focus className="w-4 h-4" />
                          <span>Reflection Mode</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      {onDreamModeClick && (
                        <SidebarMenuItem>
                          <SidebarMenuButton onClick={onDreamModeClick} className="hover:bg-sidebar-active/50">
                            <Moon className="w-4 h-4" />
                            <span>Dream Mode</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

        <Separator className="opacity-50 mt-auto" />

        {/* Settings & Sign Out */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/admin')}>
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onSettingsClick}>
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <TeachMalunitaModal 
        open={teachMalunitaOpen} 
        onOpenChange={setTeachMalunitaOpen} 
      />
    </Sidebar>
  );
}
