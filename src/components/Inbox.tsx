import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, MoveRight } from "lucide-react";

interface InboxItem {
  id: string;
  text: string;
  category?: "today" | "this-week" | "later";
}

interface InboxProps {
  onMoveToToday: (text: string) => void;
}

export const Inbox = ({ onMoveToToday }: InboxProps) => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    
    const newItem: InboxItem = {
      id: Date.now().toString(),
      text: inputValue,
    };
    
    setItems([...items, newItem]);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  const handleCategorize = (itemId: string, category: "today" | "this-week" | "later") => {
    if (category === "today") {
      const item = items.find(i => i.id === itemId);
      if (item) {
        onMoveToToday(item.text);
        handleRemove(itemId);
      }
    } else {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, category } : item
      ));
    }
  };

  const handleRemove = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  return (
    <div className="space-y-4">
      {/* Capture Input */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Capture a task or idea..."
          className="bg-card border-secondary"
        />
        <Button
          onClick={handleAdd}
          size="icon"
          variant="outline"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Inbox Items */}
      {items.length > 0 && (
        <div className="divide-y divide-foreground/5">
          {items.map((item) => (
            <div key={item.id}>
              {/* Main row */}
              <div 
                onClick={() => setExpandedTask(expandedTask === item.id ? null : item.id)}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-foreground/[0.02] transition-colors"
              >
                {/* Checkbox - stops propagation so tap doesn't expand */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleRemove(item.id); 
                  }}
                  className="w-5 h-5 mt-0.5 rounded-full border border-foreground/20 hover:border-foreground/40 flex-shrink-0"
                />
                
                {/* Task text */}
                <p className="flex-1 font-mono text-sm text-foreground/70 leading-relaxed">
                  {item.text}
                </p>
              </div>
              
              {/* Actions - revealed on tap */}
              {expandedTask === item.id && (
                <div className="flex items-center gap-6 px-4 py-2 pl-12 bg-foreground/[0.015]">
                  <button 
                    onClick={() => { 
                      handleCategorize(item.id, "today"); 
                      setExpandedTask(null); 
                    }}
                    className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                    Today
                  </button>
                  <button 
                    onClick={() => { 
                      handleCategorize(item.id, "this-week"); 
                      setExpandedTask(null); 
                    }}
                    className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                    Week
                  </button>
                  <button 
                    onClick={() => { 
                      handleCategorize(item.id, "later"); 
                      setExpandedTask(null); 
                    }}
                    className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground/70"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                    Later
                  </button>
                  <button 
                    onClick={() => { 
                      handleRemove(item.id); 
                      setExpandedTask(null); 
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Your inbox is empty. Add a quick thought above.
        </p>
      )}
    </div>
  );
};
