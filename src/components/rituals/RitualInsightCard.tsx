import { MorningInsight, NightInsight } from '@/hooks/useRitualInsights';

interface MorningProps {
  type: 'morning';
  insight: MorningInsight;
}

interface NightProps {
  type: 'night';
  insight: NightInsight;
}

type Props = MorningProps | NightProps;

export function RitualInsightCard(props: Props) {
  if (props.type === 'morning') {
    const { insight } = props;
    return (
      <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
        <p className="text-xs uppercase tracking-wide opacity-50">Today's Focus</p>
        
        {insight.focus && (
          <p className="font-medium text-foreground">{insight.focus.title}</p>
        )}
        
        {insight.top_three.length > 1 && (
          <div className="text-sm opacity-70">
            <p>Also: {insight.top_three.slice(1).map(t => t?.title).filter(Boolean).join(', ')}</p>
          </div>
        )}
        
        {insight.tiny_wins.length > 0 && (
          <p className="text-xs opacity-50">
            {insight.tiny_wins.length} quick wins available
          </p>
        )}
        
        {insight.pattern && (
          <p className="text-xs italic opacity-40 pt-2 border-t border-border">
            {insight.pattern}
          </p>
        )}
      </div>
    );
  }

  // Night ritual
  const { insight } = props;
  return (
    <div className="p-4 rounded-lg bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
      <p className="text-xs uppercase tracking-wide opacity-50">Day Complete</p>
      
      <p className="font-medium text-foreground">
        {insight.completed_count} done · {insight.remaining_count} carry over
      </p>
      
      {insight.themes.length > 0 && (
        <p className="text-sm opacity-70">
          Themes: {insight.themes.join(', ')}
        </p>
      )}
      
      {insight.tomorrow_focus && (
        <p className="text-xs opacity-50">
          Tomorrow: {insight.tomorrow_focus.title}
        </p>
      )}
      
      {insight.pattern && (
        <p className="text-xs italic opacity-40 pt-2 border-t border-border">
          {insight.pattern}
        </p>
      )}
    </div>
  );
}
