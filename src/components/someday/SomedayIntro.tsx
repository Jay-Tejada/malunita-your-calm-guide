interface SomedayIntroProps {
  hasAnyTasks: boolean;
}

export const SomedayIntro = ({ hasAnyTasks }: SomedayIntroProps) => {
  if (!hasAnyTasks) return null;
  
  return (
    <div className="my-6 text-center">
      <p className="text-sm text-muted-foreground/40">
        Ideas worth keeping, for when the time is right.
      </p>
    </div>
  );
};
