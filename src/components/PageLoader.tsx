/**
 * Minimal page loading indicator for lazy-loaded routes.
 * Uses a simple animated orb that matches the app's aesthetic.
 */
const PageLoader = () => (
  <div className="min-h-screen bg-[hsl(240_6%_6%)] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 animate-pulse" />
  </div>
);

export default PageLoader;
