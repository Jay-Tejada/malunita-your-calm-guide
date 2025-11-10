import { useState } from "react";
import { MalunitaVoice } from "@/components/MalunitaVoice";
import { RecentNotes } from "@/components/RecentNotes";
const Index = () => {
  const [notes, setNotes] = useState<Array<{
    id: string;
    text: string;
    response: string;
    timestamp: Date;
  }>>([]);

  const handleSaveNote = (text: string, response: string) => {
    const newNote = {
      id: Date.now().toString(),
      text,
      response,
      timestamp: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-secondary">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-light tracking-tight text-foreground">Malunita</h1>
          <p className="text-sm text-muted-foreground mt-1">Your minimalist thinking partner</p>
        </div>
      </header>

      {/* Main content */}
      <div className="pt-24 pb-32">
        <MalunitaVoice onSaveNote={handleSaveNote} />
      </div>

      {/* Recent notes section */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-secondary">
        <RecentNotes notes={notes} onDelete={handleDeleteNote} />
      </div>
    </div>
  );
};

export default Index;
