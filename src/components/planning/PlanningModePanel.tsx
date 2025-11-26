import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PlanningModePanelProps {
  initialText: string;
  onClose: () => void;
}

export const PlanningModePanel: React.FC<PlanningModePanelProps> = ({ initialText, onClose }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <Card className="max-w-2xl w-full p-6 space-y-6">
        <div>
          <h3 className="text-xl font-light mb-2">Planning Mode</h3>
          <p className="text-sm text-muted-foreground">
            Malunita is helping you break this down
          </p>
        </div>

        <div className="space-y-4">
          {/* Section 1: Extracted Goals & Statements */}
          <div className="p-4 rounded-lg border border-secondary">
            <h4 className="font-medium text-sm mb-2">Extracted Goals & Statements</h4>
            <div className="text-sm text-muted-foreground">
              <p className="italic">{initialText}</p>
            </div>
          </div>

          {/* Section 2: AI Breakdown */}
          <div className="p-4 rounded-lg border border-secondary">
            <h4 className="font-medium text-sm mb-2">AI Breakdown</h4>
            <div className="text-sm text-muted-foreground">
              {/* Empty for now */}
            </div>
          </div>

          {/* Section 3: Clarifying Questions */}
          <div className="p-4 rounded-lg border border-secondary">
            <h4 className="font-medium text-sm mb-2">Clarifying Questions</h4>
            <div className="text-sm text-muted-foreground">
              {/* Empty for now */}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};
