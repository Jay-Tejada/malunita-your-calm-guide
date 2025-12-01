import { format } from "date-fns";

export const DateSubtitle = () => {
  const todayFormatted = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="text-center mt-2 mb-6">
      <p className="text-xs text-muted-foreground/40 tracking-wide">
        {todayFormatted}
      </p>
    </div>
  );
};
