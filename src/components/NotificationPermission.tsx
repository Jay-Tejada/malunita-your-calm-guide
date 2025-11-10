import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const NotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not supported",
        description: "Notifications are not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
        toast({
          title: "Notifications enabled",
          description: "You'll receive reminders for tasks and daily reviews",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive",
      });
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key - you'll need to generate this
      const publicVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscription.toJSON() as any,
          }, {
            onConflict: 'user_id,subscription'
          });
        
        if (!error) {
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Subscription failed",
        description: "Could not subscribe to push notifications",
        variant: "destructive",
      });
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id);
        }
        
        setIsSubscribed(false);
        toast({
          title: "Notifications disabled",
          description: "You won't receive push notifications",
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive",
      });
    }
  };

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
        <BellOff className="w-5 h-5 text-destructive" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Notifications blocked</p>
          <p className="text-xs text-muted-foreground">Enable in browser settings</p>
        </div>
      </div>
    );
  }

  if (permission === 'granted' && isSubscribed) {
    return (
      <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-foreground">Notifications enabled</p>
            <p className="text-xs text-muted-foreground">You'll receive reminders</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={unsubscribe}
          className="text-muted-foreground hover:text-destructive"
        >
          Disable
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-secondary rounded-xl">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Push Notifications</p>
          <p className="text-xs text-muted-foreground">Get reminders for tasks & daily review</p>
        </div>
      </div>
      <Button
        onClick={requestPermission}
        size="sm"
      >
        Enable
      </Button>
    </div>
  );
};
