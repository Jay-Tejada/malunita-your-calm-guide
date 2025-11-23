import { useProfile } from "@/hooks/useProfile";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sunrise, Sun, Moon, Calendar } from "lucide-react";

export const RitualPreferences = () => {
  const { profile, updateProfile } = useProfile();

  if (!profile) return null;

  const ritualPrefs = profile.ritual_preferences || {
    morning_ritual: {
      enabled: true,
      start_hour: 5,
      end_hour: 11,
      action_button: "Start Planning"
    },
    evening_ritual: {
      enabled: true,
      start_hour: 19,
      end_hour: 1,
      action_button: "Start Reflection"
    },
    midday_checkin: {
      enabled: true,
      start_hour: 12,
      end_hour: 15,
      action_button: "View Tasks"
    },
    weekly_reset: {
      enabled: true,
      day: 0,
      hour: 19,
      action_button: "View Insights"
    }
  };

  const updateRitualPref = (ritual: string, field: string, value: any) => {
    const updated = {
      ...ritualPrefs,
      [ritual]: {
        ...ritualPrefs[ritual],
        [field]: value
      }
    };
    updateProfile({ ritual_preferences: updated });
  };

  const rituals = [
    {
      key: 'morning_ritual',
      icon: Sunrise,
      name: 'Morning Ritual',
      description: 'Guided planning session (5am-11am)',
      hasTimeWindow: true
    },
    {
      key: 'evening_ritual',
      icon: Moon,
      name: 'Evening Ritual',
      description: 'Guided reflection session (7pm-1am)',
      hasTimeWindow: true
    },
    {
      key: 'midday_checkin',
      icon: Sun,
      name: 'Midday Check-in',
      description: 'Progress review',
      hasTimeWindow: true
    },
    {
      key: 'weekly_reset',
      icon: Calendar,
      name: 'Weekly Reset',
      description: 'Sunday reflection',
      hasTimeWindow: false
    }
  ];

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Workflow Rituals</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Customize your daily rituals and notifications
      </p>

      <div className="space-y-4">
        {rituals.map(({ key, icon: Icon, name, description, hasTimeWindow }) => {
          const pref = ritualPrefs[key];
          
          return (
            <Card key={key} className="p-4 border-secondary">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">{name}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
                <Switch
                  checked={pref?.enabled ?? true}
                  onCheckedChange={(checked) => updateRitualPref(key, 'enabled', checked)}
                />
              </div>

              {pref?.enabled && (
                <div className="space-y-4 ml-8 pl-3 border-l-2 border-secondary">
                  {hasTimeWindow ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Start Hour</Label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={pref?.start_hour ?? 0}
                          onChange={(e) => updateRitualPref(key, 'start_hour', parseInt(e.target.value))}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">End Hour</Label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={pref?.end_hour ?? 0}
                          onChange={(e) => updateRitualPref(key, 'end_hour', parseInt(e.target.value))}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Day (0=Sunday)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="6"
                          value={pref?.day ?? 0}
                          onChange={(e) => updateRitualPref(key, 'day', parseInt(e.target.value))}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Hour</Label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={pref?.hour ?? 0}
                          onChange={(e) => updateRitualPref(key, 'hour', parseInt(e.target.value))}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-muted-foreground">Action Button Label</Label>
                    <Input
                      value={pref?.action_button ?? ''}
                      onChange={(e) => updateRitualPref(key, 'action_button', e.target.value)}
                      placeholder="Enter button text"
                      className="mt-1 h-9"
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};