import { QuestSystem } from '@/features/quests/QuestSystem';
import { QuestProgressNotification } from '@/features/quests/QuestProgressNotification';

const Quests = () => {
  return (
    <div className="min-h-screen bg-background">
      <QuestProgressNotification />
      <div className="container py-8">
        <QuestSystem />
      </div>
    </div>
  );
};

export default Quests;
