import { SimpleJournal } from '@/features/journal/SimpleJournal';
import { SimpleHeader } from '@/components/SimpleHeader';
import { Sparkles } from 'lucide-react';

export default function Journal() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <main className="container max-w-6xl mx-auto px-4 pt-6">
        <SimpleHeader title="Journal" />
        <SimpleJournal />
      </main>
    </div>
  );
}
