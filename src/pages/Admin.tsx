import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Activity, Users } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isCheckingAdmin } = useAdmin();

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('admin-stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!isCheckingAdmin && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  if (isCheckingAdmin || isLoadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-light mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor AI usage and costs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-semibold">${stats?.totalCost || '0.00'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weekly Cost</p>
                <p className="text-2xl font-semibold">${stats?.weeklyCost || '0.00'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-semibold">{stats?.totalRequests?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-semibold">{stats?.userCount || '0'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Model Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-light mb-4">Model Configuration</h2>
            <ModelSelector />
          </div>

          {/* Model Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Usage by Model</h3>
            <div className="space-y-3">
              {stats?.modelStats && Object.entries(stats.modelStats).map(([model, data]: [string, any]) => (
                <div key={model} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{model}</p>
                    <p className="text-sm text-muted-foreground">{data.count} requests • {data.tokens.toLocaleString()} tokens</p>
                  </div>
                  <p className="font-semibold">${data.cost.toFixed(4)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Function Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Usage by Function</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats?.functionStats && Object.entries(stats.functionStats).map(([fn, data]: [string, any]) => (
              <div key={fn} className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">{fn}</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{data.count} requests</p>
                  <p>{data.tokens.toLocaleString()} tokens</p>
                  <p className="font-semibold text-foreground">${data.cost.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats?.recentLogs?.map((log: any) => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm">
                <div>
                  <p className="font-medium">{log.function_name}</p>
                  <p className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{log.model_used}</p>
                  <p className="text-muted-foreground">{log.tokens_used} tokens • ${Number(log.estimated_cost).toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
