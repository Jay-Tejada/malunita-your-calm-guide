import { QuestSystem } from '@/features/quests/QuestSystem';
import { QuestProgressNotification } from '@/features/quests/QuestProgressNotification';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { hapticLight } from '@/utils/haptics';

const Quests = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <QuestProgressNotification />
      <div className="container py-8">
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
        <QuestSystem />
      </div>
    </div>
  );
};

export default Quests;
