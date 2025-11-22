import { useState } from 'react';
import { useHatchingMoments } from '@/hooks/useHatchingMoments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Share2, Trash2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export const HatchingGallery = () => {
  const { moments, isLoading, getImageUrl, shareHatchingMoment, downloadHatchingMoment, deleteMoment } = useHatchingMoments();
  const [selectedMoment, setSelectedMoment] = useState<string | null>(null);
  const [selectedMomentData, setSelectedMomentData] = useState<any>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Hatching Memories
          </CardTitle>
          <CardDescription>Loading your special moments...</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (moments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Hatching Memories
          </CardTitle>
          <CardDescription>
            Your companion's hatching moments will appear here. Keep interacting to reach 50 XP and witness the magic! 🥚✨
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-muted-foreground" />
            </div>
            <p>No hatching moments yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Hatching Memories
          </CardTitle>
          <CardDescription>
            Cherished moments from your companion's journey ({moments.length} {moments.length === 1 ? 'photo' : 'photos'})
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {moments.map((moment) => {
            const imageUrl = getImageUrl(moment.image_path);
            return (
              <div
                key={moment.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-all cursor-pointer"
                onClick={() => {
                  setSelectedMoment(imageUrl);
                  setSelectedMomentData(moment);
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Hatching moment - Stage ${moment.stage_reached}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white font-medium">
                      Stage {moment.stage_reached}
                    </p>
                    <p className="text-xs text-white/80">
                      {format(new Date(moment.captured_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMoment} onOpenChange={(open) => !open && setSelectedMoment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Hatching Memory
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMoment && (
              <>
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={selectedMoment}
                    alt="Hatching moment"
                    className="w-full h-auto"
                  />
                </div>
                {selectedMomentData && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Companion:</span>
                      <span className="font-medium">{selectedMomentData.companion_name || 'Unnamed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Personality:</span>
                      <span className="font-medium capitalize">{selectedMomentData.personality_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stage reached:</span>
                      <span className="font-medium">Stage {selectedMomentData.stage_reached}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Captured:</span>
                      <span className="font-medium">
                        {format(new Date(selectedMomentData.captured_at), 'PPpp')}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => shareHatchingMoment(selectedMoment, selectedMomentData?.companion_name)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => downloadHatchingMoment(selectedMoment, selectedMomentData?.companion_name)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedMomentData && window.confirm('Delete this memory?')) {
                        deleteMoment(selectedMomentData.id, selectedMomentData.image_path);
                        setSelectedMoment(null);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
