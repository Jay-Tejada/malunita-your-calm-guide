import { useState, useEffect } from 'react';
import { SimpleHeader } from '@/components/SimpleHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wrench, Database, Activity, FileText, LogOut, Download, Check, RefreshCw } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { hapticLight } from '@/utils/haptics';
import { getPerformanceMetrics, clearPerformanceMetrics } from '@/lib/performance';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AudioToggle } from '@/components/settings/AudioToggle';
import { ThemeToggle } from '@/components/settings/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateAvailable, applyUpdate } = useAppUpdate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS or if prompt not available
      navigate('/install');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      toast({
        title: "Installing...",
        description: "Malunita is being added to your home screen",
      });
    }
    setDeferredPrompt(null);
  };

  const showMetrics = () => {
    const metrics = getPerformanceMetrics();
    console.table(metrics);
    console.log('Full metrics:', metrics);
    toast({
      title: "Performance Metrics",
      description: "Check the console for detailed metrics",
    });
  };

  const clearAllData = () => {
    if (confirm('Clear all localStorage data? This will log you out.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const showQueryCache = () => {
    const cache = (window as any).__REACT_QUERY_DEVTOOLS__;
    console.log('React Query Cache:', cache);
    toast({
      title: "Query Cache",
      description: "Check the console for cache details",
    });
  };

  const showErrorLogs = () => {
    const errors = localStorage.getItem('error_logs');
    console.log('Error logs:', errors ? JSON.parse(errors) : []);
    toast({
      title: "Error Logs",
      description: "Check the console for error logs",
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        <SimpleHeader title="Settings" />
      </div>
      <main className="container max-w-4xl mx-auto px-4 pt-4">
        <div className="mb-8 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              hapticLight();
              navigate('/');
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and app configuration
          </p>
        </div>

        {/* General Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic app settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ThemeToggle />
            <AudioToggle />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Install App</p>
                <p className="text-sm text-muted-foreground">
                  {isInstalled ? "App is installed" : "Add to your home screen"}
                </p>
              </div>
              <Button
                variant={isInstalled ? "outline" : "default"}
                size="sm"
                onClick={handleInstall}
                disabled={isInstalled}
              >
                {isInstalled ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Installed
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Version</p>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>
              <Button
                variant={updateAvailable ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  hapticLight();
                  applyUpdate();
                  toast({
                    title: "Updating...",
                    description: "The app will refresh with the latest version",
                  });
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {updateAvailable ? "Update Available" : "Check Update"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll need to sign in again to access your tasks and data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await supabase.auth.signOut();
                      toast({
                        title: "Signed out",
                        description: "You've been signed out successfully.",
                      });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Developer Tools - Only in Development Mode */}
        {import.meta.env.DEV && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Developer Tools
              </CardTitle>
              <CardDescription>
                Tools for debugging and development (only visible in dev mode)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={showMetrics}
              >
                <Activity className="w-4 h-4 mr-2" />
                Show Performance Metrics
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={showQueryCache}
              >
                <Database className="w-4 h-4 mr-2" />
                Show Query Cache
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  clearPerformanceMetrics();
                  toast({
                    title: "Metrics Cleared",
                    description: "Performance metrics have been reset",
                  });
                }}
              >
                <Activity className="w-4 h-4 mr-2" />
                Clear Performance Metrics
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={showErrorLogs}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Error Logs
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={clearAllData}
              >
                <Database className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
