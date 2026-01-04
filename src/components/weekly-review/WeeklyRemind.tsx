import { Card } from '@/components/ui/card';
import { Calendar, FolderOpen, RotateCcw, Target } from 'lucide-react';

interface WeeklyRemindProps {
  priorities: string[];
  projectsTouched: string[];
  rolledOverTasks: string[];
  calendarHighlights: string[];
  isLoading?: boolean;
}

const WeeklyRemind = ({
  priorities,
  projectsTouched,
  rolledOverTasks,
  calendarHighlights,
  isLoading = false,
}: WeeklyRemindProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-foreground/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const sections = [
    {
      icon: Target,
      title: "Last week's priorities",
      items: priorities,
      emptyText: 'No priorities set',
    },
    {
      icon: FolderOpen,
      title: 'Projects touched',
      items: projectsTouched,
      emptyText: 'No project activity',
    },
    {
      icon: RotateCcw,
      title: 'Tasks rolled over',
      items: rolledOverTasks,
      emptyText: 'Nothing rolled over',
    },
    {
      icon: Calendar,
      title: 'Calendar highlights',
      items: calendarHighlights,
      emptyText: 'No events',
    },
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const Icon = section.icon;
        const hasItems = section.items.length > 0;

        return (
          <Card
            key={section.title}
            className="p-3 bg-foreground/[0.02] border-foreground/5"
          >
            <div className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-foreground/30 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1.5">
                  {section.title}
                </p>
                {hasItems ? (
                  <ul className="space-y-1">
                    {section.items.slice(0, 5).map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground/70 truncate"
                      >
                        {item}
                      </li>
                    ))}
                    {section.items.length > 5 && (
                      <li className="text-xs text-foreground/40">
                        +{section.items.length - 5} more
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-foreground/30 italic">
                    {section.emptyText}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default WeeklyRemind;
