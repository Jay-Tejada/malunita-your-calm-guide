import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const VoiceCommandsManager = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [newCommand, setNewCommand] = useState("");

  const defaultCommands = ['done', 'stop', 'finish', 'stop recording', "that's it"];
  const customCommands = profile?.custom_stop_commands || [];

  const handleAddCommand = async () => {
    const trimmed = newCommand.trim().toLowerCase();
    
    if (!trimmed) {
      toast({
        title: "Empty command",
        description: "Please enter a command",
        variant: "destructive",
      });
      return;
    }

    if (defaultCommands.includes(trimmed)) {
      toast({
        title: "Already exists",
        description: "This is already a default command",
        variant: "destructive",
      });
      return;
    }

    if (customCommands.includes(trimmed)) {
      toast({
        title: "Already exists",
        description: "This custom command already exists",
        variant: "destructive",
      });
      return;
    }

    await updateProfile({
      custom_stop_commands: [...customCommands, trimmed],
    });

    setNewCommand("");
    toast({
      title: "Command added",
      description: `"${trimmed}" will now stop recording`,
    });
  };

  const handleRemoveCommand = async (command: string) => {
    await updateProfile({
      custom_stop_commands: customCommands.filter((c) => c !== command),
    });

    toast({
      title: "Command removed",
      description: `"${command}" removed`,
    });
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Mic className="w-5 h-5" />
        Voice Commands
      </h3>
      
      <div className="bg-background rounded-xl p-4 border border-secondary space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Default Stop Commands</p>
          <p className="text-xs text-muted-foreground mb-3">
            Say any of these to stop recording
          </p>
          <div className="flex flex-wrap gap-2">
            {defaultCommands.map((cmd) => (
              <Badge key={cmd} variant="secondary" className="text-xs">
                "{cmd}"
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Your Custom Commands</p>
          <p className="text-xs text-muted-foreground mb-3">
            Add your own phrases to stop recording
          </p>
          
          {customCommands.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {customCommands.map((cmd) => (
                <Badge
                  key={cmd}
                  variant="default"
                  className="text-xs flex items-center gap-1"
                >
                  "{cmd}"
                  <button
                    onClick={() => handleRemoveCommand(cmd)}
                    className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Type a custom command..."
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCommand();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAddCommand}
              size="sm"
              disabled={!newCommand.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};