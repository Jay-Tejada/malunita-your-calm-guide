import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Inbox, 
  Calendar, 
  Sun,
  Briefcase, 
  Home,
  Cloud,
  Plus,
  Search,
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
  SidebarGroupLabel,
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

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { projects: workProjects } = useProjects('work');

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

  // Project counts
  const projectCounts = useMemo(() => {
    const allTasks = tasks || [];
    const countMap: Record<string, number> = {};
    workProjects.forEach(p => {
      countMap[p.id] = allTasks.filter(t => t.project_id === p.id && !t.completed).length;
    });
    return countMap;
  }, [tasks, workProjects]);

  const coreItems: NavItem[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/inbox', count: counts.inbox },
    { id: 'today', label: 'Today', icon: Sun, path: '/today', count: counts.today },
    { id: 'calendar', label: 'Upcoming', icon: Calendar, path: '/calendar' },
  ];

  const spaceItems: NavItem[] = [
    { id: 'work', label: 'Work', icon: Briefcase, path: '/work', count: counts.work },
    { id: 'home', label: 'Personal', icon: Home, path: '/home-tasks', count: counts.home },
    { id: 'someday', label: 'Someday', icon: Cloud, path: '/someday', count: counts.someday },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-3">
        {/* Add task button */}
        <button
          onClick={() => {
            // Focus the QuickAdd input on the current page
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

        {/* Spaces */}
        <SidebarGroup>
          <SidebarGroupLabel>Spaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {spaceItems.map((item) => (
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

        {/* Work Projects */}
        {workProjects.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {workProjects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        onClick={() => handleNavigate(`/work?project=${project.id}`)}
                        tooltip={project.name}
                      >
                        <span className="text-sm">{project.icon || '#'}</span>
                        <span className="flex-1 truncate">{project.name}</span>
                        {projectCounts[project.id] > 0 && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {projectCounts[project.id]}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
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
