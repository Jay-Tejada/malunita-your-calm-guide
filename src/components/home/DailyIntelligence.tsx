interface DailyIntelligenceProps {
  summary?: string | null;
  quickWins?: Array<{ id: string; title: string }>;
}

export function DailyIntelligence({ summary, quickWins }: DailyIntelligenceProps) {
  // Render nothing if no data
  if (!summary && (!quickWins || quickWins.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Today's Overview Section */}
      {summary && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Overview
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      )}

      {/* Quick Wins Section */}
      {quickWins && quickWins.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Quick Wins
          </h3>
          <ul className="space-y-1.5">
            {quickWins.map((win) => (
              <li key={win.id} className="text-sm text-muted-foreground pl-4 relative">
                <span className="absolute left-0 top-0">•</span>
                {win.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
