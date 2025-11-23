import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HatchingGallery } from "@/components/HatchingGallery";
import { ArtStyleSwitcher } from "@/features/artstyles/ArtStyleSwitcher";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Trophy, Camera, Heart, Palette, TrendingUp, Award } from "lucide-react";
import { useCompanionGrowth } from "@/hooks/useCompanionGrowth";
import { Progress } from "@/components/ui/progress";
import { useBondingMeter } from "@/hooks/useBondingMeter";

interface CompanionHubProps {
  open: boolean;
  onClose: () => void;
}

export function CompanionHub({ open, onClose }: CompanionHubProps) {
  const navigate = useNavigate();
  const growth = useCompanionGrowth();
  const bonding = useBondingMeter();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono">Companion Hub</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="memories">Memories</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4 mt-4">
            {/* Growth Stats */}
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Stage</p>
                  <p className="text-xl font-medium font-mono">{growth.stage}/5</p>
                </div>
                <Award className="w-8 h-8 text-primary" />
              </div>
              <Progress value={growth.progressToNextStage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {growth.xp} XP • {growth.progressToNextStage}% to next stage
              </p>
            </div>

            {/* Bonding Stats */}
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Relationship</p>
                  <p className="text-xl font-medium font-mono capitalize">{String(bonding.bonding.tier)}</p>
                </div>
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <Progress value={(bonding.bonding.score / 100) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {bonding.bonding.score} bonding points
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  navigate('/quests');
                  onClose();
                }}
                className="flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Quests
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  navigate('/weekly-insights');
                  onClose();
                }}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Insights
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="customize" className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Art Style</h3>
              <ArtStyleSwitcher />
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  navigate('/customization');
                  onClose();
                }}
                className="w-full flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Cosmetics Shop
              </Button>

              <Button 
                variant="outline" 
                onClick={() => {
                  navigate('/ambient-worlds');
                  onClose();
                }}
                className="w-full flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Ambient Worlds
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="memories" className="mt-4">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  navigate('/hatching-gallery');
                  onClose();
                }}
                className="w-full flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                View Hatching Memories
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  navigate('/journal');
                  onClose();
                }}
                className="w-full flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Memory Journal
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
