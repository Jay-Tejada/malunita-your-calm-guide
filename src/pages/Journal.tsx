import { SimpleJournal } from '@/features/journal/SimpleJournal';
import { Header } from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';

export default function Journal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 pt-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            navigate('/');
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <SimpleJournal />
      </main>
    </div>
  );
}
