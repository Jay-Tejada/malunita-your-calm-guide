import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmotionalMemory } from '@/state/emotionalMemory';
import { useLevelSystem } from '@/state/levelSystem';
import { useMoodStore } from '@/state/moodMachine';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Cloud, Sparkles, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface BackupData {
  version: number;
  timestamp: string;
  emotionalMemory: {
    joy: number;
    stress: number;
    affection: number;
    fatigue: number;
  };
  levelState: {
    level: number;
    xp: number;
    nextLevelXp: number;
    evolutionStage: number;
  };
  moodHistory: {
    currentMood: string;
    energy: number;
  };
  settings: {
    companionName: string;
    personalityType: string;
    colorway: string;
    selectedAura: string;
    selectedTrail: string;
    unlockedColorways: string[];
    unlockedAuras: string[];
    unlockedTrails: string[];
  };
  preferences: {
    preferredInputStyle: string;
    wantsVoicePlayback: boolean;
    autocategorizeEnabled: boolean;
    wakeWordEnabled: boolean;
    customWakeWord: string;
  };
}

interface CloudBackup {
  id: string;
  created_at: string;
  is_auto_save: boolean;
  backup_name: string | null;
  backup_data: BackupData;
}

export const BackupManager = () => {
  const { toast } = useToast();
  const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  const emotionalMemory = useEmotionalMemory();
  const levelSystem = useLevelSystem();
  const moodStore = useMoodStore();
  const { profile } = useProfile();

  // Fetch cloud backups
  const fetchCloudBackups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('malunita_backups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCloudBackups((data || []) as unknown as CloudBackup[]);
    } catch (error) {
      console.error('Failed to fetch cloud backups:', error);
    }
  };

  useEffect(() => {
    fetchCloudBackups();
  }, []);

  // Auto-save to cloud every 12 hours
  useEffect(() => {
    const autoSave = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const backupData = createBackupData();
        
        await supabase
          .from('malunita_backups')
          .insert({
            user_id: user.id,
            backup_data: backupData as any,
            version: 1,
            is_auto_save: true,
          });

        console.log('Auto-save completed');
        fetchCloudBackups();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    // Initial auto-save after 1 minute
    const initialTimeout = setTimeout(autoSave, 60000);
    
    // Then every 12 hours
    const interval = setInterval(autoSave, 12 * 60 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const createBackupData = (): BackupData => {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      emotionalMemory: {
        joy: emotionalMemory.joy,
        stress: emotionalMemory.stress,
        affection: emotionalMemory.affection,
        fatigue: emotionalMemory.fatigue,
      },
      levelState: {
        level: levelSystem.level,
        xp: levelSystem.xp,
        nextLevelXp: levelSystem.nextLevelXp,
        evolutionStage: levelSystem.evolutionStage,
      },
      moodHistory: {
        currentMood: moodStore.mood,
        energy: moodStore.energy,
      },
      settings: {
        companionName: profile?.companion_name || '',
        personalityType: profile?.companion_personality_type || 'zen',
        colorway: profile?.companion_colorway || 'zen-default',
        selectedAura: profile?.selected_aura || 'calm-bloom',
        selectedTrail: profile?.selected_trail || '',
        unlockedColorways: profile?.unlocked_colorways || [],
        unlockedAuras: profile?.unlocked_auras || [],
        unlockedTrails: profile?.unlocked_trails || [],
      },
      preferences: {
        preferredInputStyle: profile?.preferred_input_style || 'voice',
        wantsVoicePlayback: profile?.wants_voice_playback ?? true,
        autocategorizeEnabled: profile?.autocategorize_enabled ?? true,
        wakeWordEnabled: profile?.wake_word_enabled ?? false,
        customWakeWord: profile?.custom_wake_word || 'hey malunita',
      },
    };
  };

  const handleExportBackup = () => {
    try {
      const backupData = createBackupData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `malunita-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.malu`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup exported',
        description: 'Your Malunita data has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export backup data.',
        variant: 'destructive',
      });
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.malu,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backupData: BackupData = JSON.parse(text);

        // Validate structure
        if (backupData.version !== 1) {
          throw new Error('Unsupported backup version');
        }

        await restoreBackupData(backupData);
      } catch (error) {
        toast({
          title: 'Import failed',
          description: 'Failed to import backup. Please check the file.',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  const restoreBackupData = async (backupData: BackupData) => {
    setIsRestoring(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Restore emotional memory with defaults for new properties
      const fullEmotionalMemory = {
        joy: backupData.emotionalMemory?.joy ?? 50,
        stress: backupData.emotionalMemory?.stress ?? 50,
        affection: backupData.emotionalMemory?.affection ?? 50,
        fatigue: backupData.emotionalMemory?.fatigue ?? 50,
        momentum: (backupData.emotionalMemory as any)?.momentum ?? 50,
        overwhelm: (backupData.emotionalMemory as any)?.overwhelm ?? 50,
        resilience: (backupData.emotionalMemory as any)?.resilience ?? 50,
        encouragement_need: (backupData.emotionalMemory as any)?.encouragement_need ?? 50,
      };
      emotionalMemory.loadFromProfile(fullEmotionalMemory);
      await emotionalMemory.syncToSupabase(user.id);

      // Restore level system
      levelSystem.loadFromProfile(backupData.levelState.xp, backupData.levelState.level);

      // Restore mood
      moodStore.updateMood(backupData.moodHistory.currentMood as any);
      moodStore.increaseEnergy(backupData.moodHistory.energy - moodStore.energy);

      // Restore profile settings
      await supabase
        .from('profiles')
        .update({
          companion_name: backupData.settings.companionName,
          companion_personality_type: backupData.settings.personalityType,
          companion_colorway: backupData.settings.colorway,
          selected_aura: backupData.settings.selectedAura,
          selected_trail: backupData.settings.selectedTrail,
          unlocked_colorways: backupData.settings.unlockedColorways,
          unlocked_auras: backupData.settings.unlockedAuras,
          unlocked_trails: backupData.settings.unlockedTrails,
          preferred_input_style: backupData.preferences.preferredInputStyle,
          wants_voice_playback: backupData.preferences.wantsVoicePlayback,
          autocategorize_enabled: backupData.preferences.autocategorizeEnabled,
          wake_word_enabled: backupData.preferences.wakeWordEnabled,
          custom_wake_word: backupData.preferences.customWakeWord,
        })
        .eq('id', user.id);

      // Show sparkle animation
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 2000);

      toast({
        title: 'I feel whole again!',
        description: 'Malunita has been restored successfully.',
      });

      // Reload the page to reflect all changes
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: 'Restore failed',
        description: 'Failed to restore backup data.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreCloudBackup = async (backup: CloudBackup) => {
    await restoreBackupData(backup.backup_data);
    fetchCloudBackups();
  };

  const handleDeleteCloudBackup = async (backupId: string) => {
    try {
      const { error } = await supabase
        .from('malunita_backups')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      toast({
        title: 'Backup deleted',
        description: 'Cloud backup has been removed.',
      });

      fetchCloudBackups();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete backup.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {showSparkle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <Sparkles className="w-32 h-32 text-primary animate-pulse" />
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Local Backup</CardTitle>
          <CardDescription>
            Export or import Malunita's data as a .malu file
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleExportBackup} className="gap-2">
            <Download className="w-4 h-4" />
            Export Backup
          </Button>
          <Button onClick={handleImportBackup} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Backups
          </CardTitle>
          <CardDescription>
            Auto-saved every 12 hours (last 10 versions kept)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cloudBackups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cloud backups yet</p>
          ) : (
            <div className="space-y-2">
              {cloudBackups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {backup.is_auto_save ? 'Auto-save' : 'Manual backup'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(backup.created_at), 'PPpp')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreCloudBackup(backup)}
                      disabled={isRestoring}
                    >
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCloudBackup(backup.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
