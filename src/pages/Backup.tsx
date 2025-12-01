import { BackupManager } from '@/features/backups/BackupManager';
import { SimpleHeader } from '@/components/SimpleHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';

export default function Backup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        <SimpleHeader title="Backup & Restore" />
      </div>
      <main className="container max-w-4xl mx-auto px-4 pt-4">
        <div className="mb-8 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              hapticLight();
              navigate('/');
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
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
