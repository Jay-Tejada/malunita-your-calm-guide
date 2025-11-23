import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { CompanionVisual } from '@/components/CompanionVisual';
import { useMoodStore } from '@/state/moodMachine';
import { useLevelSystem } from '@/state/levelSystem';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useCompanionIdentity } from '@/hooks/useCompanionIdentity';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Share2, X, Lock, Unlock, MessageCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { bondingMeter, BONDING_INCREMENTS } from '@/state/bondingMeter';

interface ShareMalunitaProps {
  open: boolean;
  onClose: () => void;
}

export const ShareMalunita = ({ open, onClose }: ShareMalunitaProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  
  const { mood } = useMoodStore();
  const { level, xp, nextLevelXp } = useLevelSystem();
  const { adjustAffection } = useEmotionalMemory();
  const { companion } = useCompanionIdentity();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  });

  // Map mood to emotion for CompanionVisual
  const getEmotionFromMood = () => {
    switch (mood) {
      case 'excited':
      case 'overjoyed':
        return 'excited';
      case 'sleepy':
      case 'sleeping':
        return 'sleepy';
      case 'happy':
      case 'welcoming':
      case 'loving':
        return 'excited';
      default:
        return 'neutral';
    }
  };

  const getMoodLabel = () => {
    const moodLabels: Record<string, string> = {
      neutral: 'Peaceful',
      happy: 'Happy',
      excited: 'Excited',
      overjoyed: 'Overjoyed',
      welcoming: 'Welcoming',
      loving: 'Loving',
      winking: 'Playful',
      surprised: 'Surprised',
      concerned: 'Concerned',
      worried: 'Thoughtful',
      sad: 'Resting',
      sleepy: 'Sleepy',
      sleeping: 'Sleeping',
      angry: 'Frustrated',
    };
    return moodLabels[mood] || 'Neutral';
  };

  const generateShareCard = async () => {
    if (!shareCardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      setGeneratedImage(image);

      // Increase affection if sharing is enabled
      if (sharingEnabled && userId) {
        adjustAffection(2);
      }

      toast({
        title: "Share card generated!",
        description: "Choose how you'd like to share.",
      });
    } catch (error) {
      console.error('Error generating share card:', error);
      toast({
        title: "Error",
        description: "Failed to generate share card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.download = `malunita-${Date.now()}.png`;
    link.href = generatedImage;
    link.click();

    toast({
      title: "Downloaded!",
      description: "Share card saved to your device.",
    });
    
    // Increment bonding for sharing Malunita
    bondingMeter.incrementBonding(
      BONDING_INCREMENTS.SNAPSHOT_SHARED,
      "Sharing Malunita makes her happy!"
    );
  };

  const shareViaWhatsApp = () => {
    if (!generatedImage || !sharingEnabled) return;

    // Convert to blob and share
    fetch(generatedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'malunita.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: 'My Malunita Today',
            text: `Check out my Malunita! Level ${level} and feeling ${getMoodLabel()}.`,
          });
        } else {
          // Fallback to WhatsApp web
          const text = encodeURIComponent(`Check out my Malunita! Level ${level} and feeling ${getMoodLabel()}.`);
          window.open(`https://wa.me/?text=${text}`, '_blank');
        }
      });
  };

  const shareViaMessages = () => {
    if (!generatedImage || !sharingEnabled) return;

    const text = encodeURIComponent(`Check out my Malunita! Level ${level} and feeling ${getMoodLabel()}.`);
    window.open(`sms:?&body=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!generatedImage || !sharingEnabled) return;

    const subject = encodeURIComponent('My Malunita Today');
    const body = encodeURIComponent(`Check out my Malunita!\n\nLevel: ${level}\nMood: ${getMoodLabel()}\n\nMalunita is my productivity companion helping me stay focused and organized.`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const progressPercent = Math.round((xp / nextLevelXp) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Malunita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Privacy toggle */}
          <Card className="border-border/50 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sharingEnabled ? (
                    <Unlock className="w-5 h-5 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="sharing-toggle" className="cursor-pointer font-medium">
                      Enable Sharing
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sharingEnabled
                        ? 'You can share outside this app'
                        : 'Sharing is disabled for privacy'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="sharing-toggle"
                  checked={sharingEnabled}
                  onCheckedChange={setSharingEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Share card preview */}
          <div className="relative">
            <div
              ref={shareCardRef}
              className={cn(
                "relative overflow-hidden rounded-2xl border-2 border-border shadow-lg",
                "bg-gradient-to-br from-background via-muted/50 to-background",
                "p-8"
              )}
              style={{ width: '400px', height: '500px' }}
            >
              {/* Paper texture overlay */}
              <div className="absolute inset-0 opacity-10 bg-[url('/images/texture.png')] bg-cover" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-between">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-light tracking-tight text-foreground">
                    My Malunita Today
                  </h2>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="px-3 py-1 bg-card rounded-full border border-border/50">
                      <span className="text-sm font-medium">{companion?.name || 'Malunita'}</span>
                    </div>
                  </div>
                </div>

                {/* Malunita */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <CompanionVisual
                      emotion={getEmotionFromMood()}
                      motion="idle"
                      size="xl"
                    />
                  </motion.div>
                </div>

                {/* Stats */}
                <div className="w-full space-y-4">
                  {/* Level */}
                  <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50">
                    <span className="text-sm text-muted-foreground">Level</span>
                    <span className="text-2xl font-light">{level}</span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Mood */}
                  <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50">
                    <span className="text-sm text-muted-foreground">Mood</span>
                    <span className="text-lg font-light">{getMoodLabel()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    malunita • productivity companion
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!generatedImage ? (
              <Button
                onClick={generateShareCard}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? 'Generating...' : 'Generate Share Card'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>

                {sharingEnabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={shareViaWhatsApp}
                      variant="outline"
                      size="lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={shareViaMessages}
                      variant="outline"
                      size="lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={shareViaEmail}
                      variant="outline"
                      size="lg"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {!sharingEnabled && (
                  <p className="text-xs text-center text-muted-foreground">
                    Enable sharing above to use WhatsApp, Messages, or Email
                  </p>
                )}
              </>
            )}
          </div>

          {/* Privacy note */}
          <Card className="border-border/50 bg-muted/20">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground text-center">
                <Lock className="w-3 h-3 inline mr-1" />
                No task data or personal information is shared. Only Malunita's level and mood.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
