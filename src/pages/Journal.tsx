import { MemoryJournal } from '@/features/journal/MemoryJournal';
import { Header } from '@/components/Header';

export default function Journal() {
  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="container max-w-6xl mx-auto px-4 pt-20">
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
