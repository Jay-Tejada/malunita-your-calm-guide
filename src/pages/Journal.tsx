import { SimpleJournal } from '@/features/journal/SimpleJournal';

export default function Journal() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <main className="container max-w-6xl mx-auto px-4 pt-20">
        <SimpleJournal />
      </main>
    </div>
  );
}
