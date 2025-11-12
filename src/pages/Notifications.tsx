import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";
import { NotificationSnooze } from "@/components/NotificationSnooze";

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from environment or use a default
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Store subscription in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("push_subscriptions")
        .insert({
          user_id: user.id,
          subscription: subscription.toJSON() as any,
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: "Success!",
        description: "You'll now receive push notifications for reminders and reviews",
      });
    } catch (error: any) {
      console.error("Error subscribing to push:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Could not subscribe to notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id);
      }

      setIsSubscribed(false);
      toast({
        title: "Unsubscribed",
        description: "You won't receive push notifications anymore",
      });
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      toast({
        title: "Error",
        description: "Could not unsubscribe from notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl pb-20 md:pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🔔 Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Manage your notification preferences
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              Push Notifications
            </CardTitle>
            <CardDescription>
              Receive reminders and voice reviews directly in your browser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isSupported ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                <p className="font-semibold">Not Supported</p>
                <p className="text-sm mt-1">
                  Your browser doesn't support push notifications
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed
                      ? "You're receiving push notifications"
                      : "Enable notifications to get reminders for your tasks"}
                  </p>
                  
                  {permission === "denied" && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                      Notifications are blocked. Please enable them in your browser settings.
                    </div>
                  )}
                </div>

                {isSubscribed ? (
                  <Button
                    onClick={unsubscribeFromPush}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? "Unsubscribing..." : "Disable Notifications"}
                  </Button>
                ) : (
                  <Button
                    onClick={subscribeToPush}
                    disabled={loading || permission === "denied"}
                    className="w-full"
                  >
                    {loading ? "Enabling..." : "Enable Notifications"}
                  </Button>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2">What you'll receive:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Daily review reminders</li>
                    <li>• Task deadline notifications</li>
                    <li>• Voice review summaries</li>
                    <li>• Goal progress updates</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {isSubscribed && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Snooze Reminders</CardTitle>
              <CardDescription>
                Need a break? Temporarily pause your focus task reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSnooze />
            </CardContent>
          </Card>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Notifications;
