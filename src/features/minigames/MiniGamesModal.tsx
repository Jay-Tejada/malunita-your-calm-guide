import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PeekABoo } from './PeekABoo';
import { BounceGame } from './BounceGame';
import { MemoryMatch } from './MemoryMatch';
import { Gamepad2, Eye, Zap, Brain } from 'lucide-react';

interface MiniGamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GameType = 'menu' | 'peek-a-boo' | 'bounce' | 'memory-match';

export const MiniGamesModal = ({ open, onOpenChange }: MiniGamesModalProps) => {
  const [currentGame, setCurrentGame] = useState<GameType>('menu');

  const handleComplete = () => {
    setCurrentGame('menu');
  };

  const handleClose = () => {
    setCurrentGame('menu');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Gamepad2 className="w-6 h-6" />
            Play with Malunita
          </DialogTitle>
        </DialogHeader>

        {currentGame === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <Card
              className="p-6 cursor-pointer hover:border-primary transition-all hover:scale-105 bg-card/50 backdrop-blur-sm"
              onClick={() => setCurrentGame('peek-a-boo')}
            >
              <div className="flex flex-col items-center gap-3">
                <Eye className="w-12 h-12 text-primary" />
                <h3 className="font-semibold text-lg">Peek-a-Boo</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Find Malunita hiding behind the cards!
                </p>
                <div className="text-xs text-primary font-semibold">
                  +5 affection per find
                </div>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:border-primary transition-all hover:scale-105 bg-card/50 backdrop-blur-sm"
              onClick={() => setCurrentGame('bounce')}
            >
              <div className="flex flex-col items-center gap-3">
                <Zap className="w-12 h-12 text-primary" />
                <h3 className="font-semibold text-lg">Bounce Game</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Tap when Malunita reaches the zones!
                </p>
                <div className="text-xs text-primary font-semibold">
                  +5 joy, +8 XP per perfect tap
                </div>
              </div>
            </Card>

            <Card
              className="p-6 cursor-pointer hover:border-primary transition-all hover:scale-105 bg-card/50 backdrop-blur-sm"
              onClick={() => setCurrentGame('memory-match')}
            >
              <div className="flex flex-col items-center gap-3">
                <Brain className="w-12 h-12 text-primary" />
                <h3 className="font-semibold text-lg">Memory Match</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Match Malunita's expressions!
                </p>
                <div className="text-xs text-primary font-semibold">
                  +10 affection, +20 XP when complete
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentGame === 'peek-a-boo' && <PeekABoo onComplete={handleComplete} />}
        {currentGame === 'bounce' && <BounceGame onComplete={handleComplete} />}
        {currentGame === 'memory-match' && <MemoryMatch onComplete={handleComplete} />}

        {currentGame !== 'menu' && (
          <div className="flex justify-center p-4">
            <Button variant="ghost" onClick={handleComplete}>
              Back to Menu
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
