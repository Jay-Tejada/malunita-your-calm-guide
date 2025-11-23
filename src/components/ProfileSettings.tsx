import { useProfile } from "@/hooks/useProfile";
import { usePersonality } from "@/hooks/usePersonality";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Clock, MessageSquare, Mic, Sparkles, Heart } from "lucide-react";
import { NotificationPermission } from "@/components/NotificationPermission";
import { GoalSetting } from "@/components/GoalSetting";
import { CustomCategoryManager } from "@/components/CustomCategoryManager";
import { VoiceCommandsManager } from "@/components/VoiceCommandsManager";
import { PersonalizationInsights } from "@/components/PersonalizationInsights";
import { WakeWordTraining } from "@/components/WakeWordTraining";
import { RitualPreferences } from "@/components/RitualPreferences";
import { CompanionCustomization } from "@/components/CompanionCustomization";
import { ArtStyleSwitcher } from "@/features/artstyles/ArtStyleSwitcher";
import { ARCHETYPE_CONFIG, PersonalityArchetype } from "@/state/personality";
import { useState } from "react";


interface ProfileSettingsProps {
  onClose?: () => void;
}

export const ProfileSettings = ({ onClose }: ProfileSettingsProps) => {
  const { profile, isLoading, updateProfile } = useProfile();
  const { personalityState, updatePersonality } = usePersonality();
  const [customWakeWord, setCustomWakeWord] = useState(profile?.custom_wake_word || 'hey malunita');
  const [showCustomization, setShowCustomization] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-8">
      <div className="bg-card rounded-3xl border border-secondary shadow-lg">
        <div className="p-6 border-b border-secondary">
          <h2 className="text-2xl font-light">Settings & Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize how Malunita works for you
          </p>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-6 space-y-8">
            {/* Personalization Insights */}
            <PersonalizationInsights />

            {/* Personality Archetype */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Personality Archetype
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Shape how Malunita communicates and behaves
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="personality-archetype" className="mb-2 block">
                    Choose Personality
                  </Label>
                  <Select
                    value={personalityState?.selectedArchetype || 'zen-guide'}
                    onValueChange={(value) =>
                      updatePersonality({
                        selectedArchetype: value as PersonalityArchetype,
                      })
                    }
                  >
                    <SelectTrigger id="personality-archetype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ARCHETYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{config.icon}</span>
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-xs text-muted-foreground">{config.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between bg-background rounded-xl p-4 border border-secondary">
                  <div>
                    <Label htmlFor="auto-adapt">Auto-Adapt Over Time</Label>
                    <p className="text-sm text-muted-foreground">
                      Let Malunita adjust personality based on your interactions
                    </p>
                  </div>
                  <Switch
                    id="auto-adapt"
                    checked={personalityState?.autoAdapt ?? true}
                    onCheckedChange={(checked) =>
                      updatePersonality({
                        autoAdapt: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Analytics Section */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Activity
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4 border border-secondary">
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-3xl font-light mt-1">{profile.total_tasks_logged}</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-secondary">
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                  <p className="text-3xl font-light mt-1">{profile.average_tasks_per_day}</p>
                </div>
              </div>
              <div className="mt-4 bg-background rounded-xl p-4 border border-secondary">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Peak Activity Time</p>
                </div>
                <p className="text-lg capitalize">{profile.peak_activity_time}</p>
              </div>
            </div>

            {/* Goal Setting */}
            <div>
              <h3 className="text-lg font-medium mb-4">Goal Awareness</h3>
              <GoalSetting />
            </div>

            {/* Custom Categories */}
            <CustomCategoryManager />
            
            {/* Companion Cosmetics */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Companion Cosmetics
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock colorways, auras, and particle trails through consistent engagement.
              </p>
              <Button 
                onClick={() => setShowCustomization(true)}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Customize Companion
              </Button>
            </div>

            {/* Art Style Themes */}
            <ArtStyleSwitcher />

            {/* Voice Commands */}
            <VoiceCommandsManager />

            {/* Voice Preferences */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Voice Preferences
              </h3>
              
              {/* Notification Permission Component */}
              <div className="mb-6">
                <NotificationPermission />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="voice-playback">Voice Playback</Label>
                    <p className="text-sm text-muted-foreground">
                      Hear Malunita's responses out loud
                    </p>
                  </div>
                  <Switch
                    id="voice-playback"
                    checked={profile.wants_voice_playback}
                    onCheckedChange={(checked) =>
                      updateProfile({ wants_voice_playback: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-categorize">Auto-Categorize Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Let AI sort tasks automatically
                    </p>
                  </div>
                  <Switch
                    id="auto-categorize"
                    checked={profile.autocategorize_enabled}
                    onCheckedChange={(checked) =>
                      updateProfile({ autocategorize_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="routine-nudges">Routine Nudges</Label>
                    <p className="text-sm text-muted-foreground">
                      Get suggestions based on your patterns
                    </p>
                  </div>
                  <Switch
                    id="routine-nudges"
                    checked={profile.likes_routine_nudges}
                    onCheckedChange={(checked) =>
                      updateProfile({ likes_routine_nudges: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="seasonal-visuals">Seasonal Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Show seasonal overlays and effects (Winter, Spring, Summer, Starfall)
                    </p>
                  </div>
                  <Switch
                    id="seasonal-visuals"
                    checked={profile.ritual_preferences?.seasonal_visuals !== false}
                    onCheckedChange={(checked) =>
                      updateProfile({
                        ritual_preferences: {
                          ...profile.ritual_preferences,
                          seasonal_visuals: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Wake Word Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Hands-Free Activation
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="wake-word">Wake Word</Label>
                    <p className="text-sm text-muted-foreground">
                      Activate voice input by saying a phrase
                    </p>
                  </div>
                  <Switch
                    id="wake-word"
                    checked={profile.wake_word_enabled || false}
                    onCheckedChange={(checked) =>
                      updateProfile({ wake_word_enabled: checked })
                    }
                  />
                </div>

                {profile.wake_word_enabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <Label htmlFor="custom-wake-word">Custom Phrase</Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-wake-word"
                        value={customWakeWord}
                        onChange={(e) => setCustomWakeWord(e.target.value)}
                        placeholder="hey malunita"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => updateProfile({ custom_wake_word: customWakeWord })}
                        variant="secondary"
                      >
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Say "{customWakeWord}" to activate voice input hands-free
                    </p>
                    
                    {/* Wake Word Training */}
                    <WakeWordTraining />
                  </div>
                )}
              </div>
            </div>

            {/* Task Patterns */}
            <div>
              <h3 className="text-lg font-medium mb-4">Your Task Patterns</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${profile.uses_reminders ? 'bg-success' : 'bg-muted'}`} />
                  <span className="text-sm">Uses reminders</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${profile.uses_names ? 'bg-success' : 'bg-muted'}`} />
                  <span className="text-sm">Mentions people's names</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${profile.often_time_based ? 'bg-success' : 'bg-muted'}`} />
                  <span className="text-sm">Creates time-based tasks</span>
                </div>
              </div>

              {profile.common_prefixes && profile.common_prefixes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Common phrases:</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.common_prefixes.map((prefix, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-secondary/50 rounded-full text-xs"
                      >
                        "{prefix}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Rituals */}
            <RitualPreferences />
          </div>
        </ScrollArea>

        {onClose && (
          <div className="p-6 border-t border-secondary">
            <Button onClick={onClose} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        )}
      </div>
      
      {/* Customization Drawer */}
      {showCustomization && (
        <CompanionCustomization onClose={() => setShowCustomization(false)} />
      )}
    </div>
  );
};
