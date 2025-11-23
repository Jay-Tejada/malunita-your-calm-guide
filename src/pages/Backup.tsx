import { BackupManager } from '@/features/backups/BackupManager';
import { Header } from '@/components/Header';

export default function Backup() {
  return (
    <div className="min-h-screen pb-20">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Backup & Restore</h1>
          <p className="text-muted-foreground">
            Keep Malunita's memories safe and restore them anytime
          </p>
        </div>
        <BackupManager />
      </main>
    </div>
  );
}
