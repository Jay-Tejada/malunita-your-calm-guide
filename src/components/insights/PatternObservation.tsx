interface Props {
  observation: string | null;
  trend: 'improving' | 'steady' | 'declining' | 'unclear';
}

const trendIndicator = {
  improving: '↗',
  steady: '→',
  declining: '↘',
  unclear: '·'
};

export function PatternObservation({ observation, trend }: Props) {
  if (!observation) return null;

  return (
    <div className="px-4 py-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground text-sm">{trendIndicator[trend]}</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {observation}
        </p>
      </div>
    </div>
  );
}
