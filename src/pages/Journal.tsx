import { MemoryJournal } from '@/features/journal/MemoryJournal';
import { Header } from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';

export default function Journal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 pt-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            navigate('/');
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Memory Journal</h1>
          <p className="text-muted-foreground">
            A private logbook of our emotional journey together
          </p>
        </div>
        <MemoryJournal />
      </main>
    </div>
  );
}
