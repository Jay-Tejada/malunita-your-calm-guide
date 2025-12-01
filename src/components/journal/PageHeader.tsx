interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps) => {
  return (
    <header className="px-4 py-6 border-b border-border/10">
      <h1 className="text-sm font-mono text-foreground/80">{title}</h1>
    </header>
  );
};
