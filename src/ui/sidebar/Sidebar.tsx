// src/ui/sidebar/Sidebar.tsx

import { colors, typography } from "@/ui/tokens";
import { SidebarSection } from "./SidebarSection";
import { SidebarItem } from "./SidebarItem";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  activePath?: string;
}

export function Sidebar({ isOpen, onClose, onNavigate, activePath }: SidebarProps) {
  const { data: projects = [] } = useQuery({
    queryKey: ["canvas-projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("canvas_projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col overflow-y-auto"
        style={{
          backgroundColor: colors.bg.elevated,
          borderRight: `1px solid ${colors.border.subtle}`,
        }}
      >
        {/* Search */}
        <div className="p-4">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.subtle}`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M7 12A5 5 0 107 2a5 5 0 000 10zM14 14l-3-3"
                stroke={colors.text.muted}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontFamily: typography.fontFamily,
                fontSize: typography.bodyS.size,
                color: colors.text.muted,
              }}
            >
              Search
            </span>
            <span
              className="ml-auto px-1.5 py-0.5 rounded text-xs"
              style={{
                backgroundColor: colors.bg.base,
                color: colors.text.muted,
                fontFamily: typography.fontFamily,
              }}
            >
              /
            </span>
          </div>
        </div>

        {/* Add task button */}
        <div className="px-4 mb-4">
          <button
            onClick={() => onNavigate("/capture")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-colors"
            style={{
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.subtle}`,
              fontFamily: typography.fontFamily,
              fontSize: typography.bodyS.size,
              color: colors.text.secondary,
            }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            Add new task
          </button>
        </div>

        {/* Sections */}
        <nav className="flex-1 px-2">
          <SidebarSection title="Core">
            <SidebarItem icon="📅" label="Today" path="/today" active={activePath === "/today"} onNavigate={onNavigate} />
            <SidebarItem icon="📥" label="Inbox" path="/inbox" active={activePath === "/inbox"} onNavigate={onNavigate} badge={34} />
            <SidebarItem icon="🔁" label="Habits" path="/habits" active={activePath === "/habits"} onNavigate={onNavigate} />
            <SidebarItem icon="💭" label="Thoughts" path="/thoughts" active={activePath === "/thoughts"} onNavigate={onNavigate} />
            <SidebarItem icon="🌙" label="Someday" path="/someday" active={activePath === "/someday"} onNavigate={onNavigate} />
            <SidebarItem icon="📆" label="Calendar" path="/calendar" active={activePath === "/calendar"} onNavigate={onNavigate} />
          </SidebarSection>

          <SidebarSection title="Spaces">
            <SidebarItem label="Work" path="/spaces/work" active={activePath === "/spaces/work"} onNavigate={onNavigate} />
            <SidebarItem label="Home" path="/spaces/home" active={activePath === "/spaces/home"} onNavigate={onNavigate} />
            <SidebarItem label="Gym" path="/spaces/gym" active={activePath === "/spaces/gym"} onNavigate={onNavigate} />
            <SidebarItem label="Journal" path="/spaces/journal" active={activePath === "/spaces/journal"} onNavigate={onNavigate} />
          </SidebarSection>

          <SidebarSection title="Insights">
            <SidebarItem label="Weekly Review" path="/insights/weekly" active={activePath === "/insights/weekly"} onNavigate={onNavigate} />
            <SidebarItem label="Weekly Insights" path="/insights/summary" active={activePath === "/insights/summary"} onNavigate={onNavigate} />
          </SidebarSection>

          <SidebarSection title="Projects" action={{ label: "+", onClick: () => onNavigate("/projects") }}>
            {projects.length === 0 ? (
              <p
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: typography.bodyS.size,
                  color: colors.text.muted,
                  padding: "8px 12px",
                }}
              >
                Nothing here yet
              </p>
            ) : (
              projects.map((project) => (
                <SidebarItem
                  key={project.id}
                  icon={project.icon || "📁"}
                  label={project.name}
                  path={`/canvas/${project.id}`}
                  active={activePath?.startsWith(`/canvas/${project.id}`)}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </SidebarSection>
        </nav>

        {/* Footer */}
        <div
          className="p-4 mt-auto"
          style={{ borderTop: `1px solid ${colors.border.subtle}` }}
        >
          <SidebarItem icon="⌨️" label="Shortcuts" path="/shortcuts" onNavigate={onNavigate} />
          <SidebarItem icon="⚙️" label="Settings" path="/settings" onNavigate={onNavigate} />
        </div>
      </aside>
    </>
  );
}
