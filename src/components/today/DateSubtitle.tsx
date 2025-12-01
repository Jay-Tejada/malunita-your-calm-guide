import { format } from "date-fns";

export const DateSubtitle = () => {
  const todayFormatted = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="mb-8 text-center">
      <p className="text-xs text-muted-foreground/50 font-mono tracking-wide">
        {todayFormatted}
      </p>
    </div>
  );
};
