import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Zap, MessageCircle, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  category?: string;
}

interface DailyIntelligenceProps {
  topPriorities?: Task[];
  followUps?: Task[];
  quickWins?: Task[];
}

export function DailyIntelligence({
  topPriorities = [],
  followUps = [],
  quickWins = [],
}: DailyIntelligenceProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6 mb-6 border border-border rounded-[10px] shadow-sm bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-medium font-mono flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Malunita Suggestions
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/weekly-insights')}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          See More Insights
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      
      <div className="space-y-5">
        {/* Top Priorities */}
        <div>
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">Top Priorities</h3>
          {topPriorities.length > 0 ? (
            <div className="space-y-2">
              {topPriorities.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No priorities set for today</p>
          )}
        </div>

        {/* Follow-Ups */}
        {followUps.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Follow-Ups
            </h3>
            <div className="space-y-2">
              {followUps.map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 flex-shrink-0" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Wins
            </h3>
            <div className="space-y-2">
              {quickWins.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
