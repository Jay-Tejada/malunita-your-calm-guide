import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";

export const NotificationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  
  const notificationPrefs = profile?.notification_preferences as any || {};
  
  const [frequency, setFrequency] = useState<string>(notificationPrefs.frequency || 'daily');
  const [customDays, setCustomDays] = useState<number>(notificationPrefs.customIntervalDays || 3);
  const [quietStart, setQuietStart] = useState<string>(notificationPrefs.quietHoursStart || '22:00');
  const [quietEnd, setQuietEnd] = useState<string>(notificationPrefs.quietHoursEnd || '07:00');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updatedPrefs = {
        ...notificationPrefs,
        frequency,
        customIntervalDays: customDays,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Notification Timing
        </CardTitle>
        <CardDescription>
          Customize when and how often you receive smart notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency Settings */}
        <div className="space-y-3">
          <Label htmlFor="frequency">Notification Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily - Get reminders every day</SelectItem>
              <SelectItem value="weekly">Weekly - Once per week only</SelectItem>
              <SelectItem value="custom">Custom - Set your own interval</SelectItem>
            </SelectContent>
          </Select>
          
          {frequency === 'custom' && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="customDays">Send reminder every</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  max="30"
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          )}
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <Label>Quiet Hours</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            No notifications will be sent during these hours
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietStart" className="text-sm">Start time</Label>
              <Input
                id="quietStart"
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietEnd" className="text-sm">End time</Label>
              <Input
                id="quietEnd"
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Currently set: {quietStart} - {quietEnd}
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};
