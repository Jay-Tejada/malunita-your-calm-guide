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
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-card rounded-xl border border-secondary flex items-start justify-between gap-3 group"
            >
              <p className="text-sm text-foreground flex-1">{item.text}</p>
              
              <div className="flex items-center gap-1 shrink-0">
                {!item.category && (
                  <>
                    <Button
                      onClick={() => handleCategorize(item.id, "today")}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      title="Move to Today"
                    >
                      Today
                    </Button>
                    <Button
                      onClick={() => handleCategorize(item.id, "this-week")}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      title="This Week"
                    >
                      Week
                    </Button>
                    <Button
                      onClick={() => handleCategorize(item.id, "later")}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      title="Later"
                    >
                      Later
                    </Button>
                  </>
                )}
                
                {item.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {item.category === "this-week" ? "This Week" : item.category === "later" ? "Later" : ""}
                    </span>
                    {item.category !== "today" && (
                      <Button
                        onClick={() => handleCategorize(item.id, "today")}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Move to Today"
                      >
                        <MoveRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                
                <Button
                  onClick={() => handleRemove(item.id)}
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
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
