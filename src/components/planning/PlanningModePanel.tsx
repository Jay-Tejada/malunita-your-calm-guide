import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Target, ListChecks, HelpCircle, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface PlanningBreakdownResult {
  extracted_goals: string[];
  subtasks: string[];
  missing_info: string[];
  blockers: string[];
  recommended_first_step: string;
  confidence: number;
}

interface PlanningModePanelProps {
  initialText: string;
  onClose: () => void;
  onRun?: () => void;
  result?: PlanningBreakdownResult | null;
  loading?: boolean;
  error?: string | null;
}

export const PlanningModePanel: React.FC<PlanningModePanelProps> = ({ 
  initialText, 
  onClose, 
  onRun,
  result,
  loading = false,
  error = null
}) => {
  return (
    <Card className="max-w-2xl w-full p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        <div>
          <h3 className="text-xl font-light mb-2">Planning Mode</h3>
          <p className="text-sm text-muted-foreground">
            Malunita is helping you break this down
          </p>
        </div>

        <div className="space-y-4">
          {/* Initial Text */}
          <div className="p-4 rounded-lg border border-secondary">
            <div className="text-sm text-muted-foreground">
              <p className="italic">{initialText}</p>
            </div>
          </div>

          {/* Analyze Button */}
          {!result && !loading && (
            <Button 
              onClick={onRun} 
              className="w-full"
              disabled={loading}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze This
            </Button>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Analyzing...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-lg border border-destructive bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Extracted Goals */}
              <div className="p-4 rounded-lg border border-secondary">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Extracted Goals
                </h4>
                <ul className="space-y-2">
                  {result.extracted_goals.map((goal, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Breakdown (Subtasks) */}
              <div className="p-4 rounded-lg border border-secondary">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  AI Breakdown
                </h4>
                <ul className="space-y-2">
                  {result.subtasks.map((task, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="flex-shrink-0 text-xs font-medium mt-0.5">{idx + 1}.</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Blockers */}
              {result.blockers.length > 0 && (
                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Potential Blockers
                  </h4>
                  <ul className="space-y-2">
                    {result.blockers.map((blocker, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clarifying Questions */}
              {result.missing_info.length > 0 && (
                <div className="p-4 rounded-lg border border-secondary">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Clarifying Questions
                  </h4>
                  <ul className="space-y-2">
                    {result.missing_info.map((question, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">?</span>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended First Step */}
              <div className="p-4 rounded-lg border border-primary bg-primary/5">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Recommended First Step
                </h4>
                <p className="text-sm text-foreground font-medium">{result.recommended_first_step}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Confidence: {Math.round(result.confidence * 100)}%
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </Card>
  );
};
