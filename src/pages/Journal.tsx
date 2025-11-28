import { SimpleJournal } from '@/features/journal/SimpleJournal';
import { useNavigate } from 'react-router-dom';
import { HomeOrb } from '@/components/HomeOrb';

export default function Journal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Home Navigation Orb */}
      <div className="fixed top-4 left-4 z-50">
        <button 
          onClick={() => navigate('/')}
          className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Go to home"
        >
          <HomeOrb />
        </button>
      </div>

      <main className="container max-w-6xl mx-auto px-4 pt-20">
        <SimpleJournal />
      </main>
    </div>
  );
}
