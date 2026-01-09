import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Inbox, 
  Calendar, 
  Sun,
  Briefcase, 
  Home,
  Cloud,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  Settings
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  count?: number;
}

interface SpaceConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  category: string;
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { projects: allProjects } = useProjects();
  
  // Track which spaces are expanded
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({
    work: true,
    home: false,
    someday: false,
  });

  // Calculate counts
  const counts = useMemo(() => {
    const allTasks = tasks || [];
    return {
      inbox: allTasks.filter(t => t.category === 'inbox' && !t.completed).length,
      today: allTasks.filter(t => t.scheduled_bucket === 'today' && !t.completed).length,
      work: allTasks.filter(t => t.category === 'work' && !t.completed).length,
      home: allTasks.filter(t => t.category === 'home' && !t.completed).length,
      someday: allTasks.filter(t => t.scheduled_bucket === 'someday' && !t.completed).length,
    };
  }, [tasks]);

  // Group projects by space
  const projectsBySpace = useMemo(() => {
    const grouped: Record<string, typeof allProjects> = {
      work: [],
      home: [],
      someday: [],
    };
    allProjects.forEach(p => {
      if (grouped[p.space]) {
        grouped[p.space].push(p);
      }
    });
    return grouped;
  }, [allProjects]);

  // Project counts
  const projectCounts = useMemo(() => {
    const allTasks = tasks || [];
    const countMap: Record<string, number> = {};
    allProjects.forEach(p => {
      countMap[p.id] = allTasks.filter(t => t.project_id === p.id && !t.completed).length;
    });
    return countMap;
  }, [tasks, allProjects]);

  const coreItems: NavItem[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/inbox', count: counts.inbox },
    { id: 'today', label: 'Today', icon: Sun, path: '/today', count: counts.today },
    { id: 'calendar', label: 'Upcoming', icon: Calendar, path: '/calendar' },
  ];

  const spaces: SpaceConfig[] = [
    { id: 'work', label: 'Work', icon: Briefcase, path: '/work', category: 'work' },
    { id: 'home', label: 'Personal', icon: Home, path: '/home-tasks', category: 'home' },
    { id: 'someday', label: 'Someday', icon: Cloud, path: '/someday', category: 'someday' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isProjectActive = (projectId: string) => {
    const params = new URLSearchParams(location.search);
    return params.get('project') === projectId;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaces(prev => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-3">
        {/* Add task button */}
        <button
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>('[data-quick-add]');
            if (input) input.focus();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="group-data-[collapsible=icon]:hidden">Add task</span>
        </button>
      </SidebarHeader>

      <SidebarContent>
        {/* Core navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    onClick={() => handleNavigate(item.path)}
                    tooltip={item.label}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.count}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Spaces with nested projects */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {spaces.map((space) => {
                const spaceProjects = projectsBySpace[space.category] || [];
                const hasProjects = spaceProjects.length > 0;
                const isExpanded = expandedSpaces[space.id];
                const spaceCount = counts[space.id as keyof typeof counts] || 0;

                return (
                  <div key={space.id}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isActive(space.path) && !location.search}
                        onClick={() => handleNavigate(space.path)}
                        tooltip={space.label}
                        className="group"
                      >
                        {/* Expand/collapse toggle */}
                        {hasProjects && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSpace(space.id);
                            }}
                            className="p-0.5 hover:bg-muted rounded -ml-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        )}
                        {!hasProjects && <div className="w-4" />}
                        <space.icon className="w-4 h-4" />
                        <span className="flex-1">{space.label}</span>
                        {spaceCount > 0 && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {spaceCount}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Nested projects */}
                    {hasProjects && isExpanded && (
                      <div className="ml-4 border-l border-border/50 pl-2">
                        {spaceProjects.map((project) => (
                          <SidebarMenuItem key={project.id}>
                            <SidebarMenuButton
                              isActive={isProjectActive(project.id)}
                              onClick={() => handleNavigate(`${space.path}?project=${project.id}`)}
                              tooltip={project.name}
                              className="py-1.5"
                            >
                              <Folder className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="flex-1 truncate text-sm">{project.name}</span>
                              {projectCounts[project.id] > 0 && (
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {projectCounts[project.id]}
                                </span>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleNavigate('/settings')}
              tooltip="Settings"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
