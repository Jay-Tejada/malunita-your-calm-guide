import { Sparkles, Settings } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { NavLink } from "./NavLink";
import { Button } from "./ui/button";

export const Header = () => {
  const { isAdmin } = useAdmin();
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-light tracking-wide text-foreground">Malunita</h1>
          <p className="text-xs text-muted-foreground">Your thinking partner</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isAdmin && (
          <NavLink to="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </NavLink>
        )}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-sm font-normal text-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  );
};
