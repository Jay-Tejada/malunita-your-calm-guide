import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKnowledgeClusters } from "@/hooks/useKnowledgeClusters";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X, CheckCircle2, Circle } from "lucide-react";
import { TaskCluster } from "@/ai/knowledgeClusters";

export const ClusterView = () => {
  const { clusters, isLoading, refreshClusters } = useKnowledgeClusters();
  const { tasks, updateTask } = useTasks();
  const [selectedCluster, setSelectedCluster] = useState<TaskCluster | null>(null);

  const handleClusterClick = (cluster: TaskCluster) => {
    setSelectedCluster(cluster);
  };

  const getTaskById = (taskId: string) => {
    return tasks?.find(t => t.id === taskId);
  };

  const handleTaskToggle = async (taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) return;

    await updateTask({
      id: taskId,
      updates: { completed: !task.completed },
    });
  };

  // Calculate bubble positions in a circular layout
  const getBubblePosition = (index: number, total: number) => {
    const radius = 35; // percentage from center
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Clusters</h2>
          <p className="text-muted-foreground">
            AI-powered semantic grouping of your tasks
          </p>
        </div>
        <Button
          onClick={refreshClusters}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Bubble Graph */}
      {clusters.length > 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="relative w-full aspect-square max-w-2xl mx-auto">
              {/* Central label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-sm text-muted-foreground">Your Task Universe</p>
                <p className="text-lg font-semibold">{clusters.length} Clusters</p>
              </div>

              {/* Cluster bubbles */}
              {clusters.map((cluster, index) => {
                const position = getBubblePosition(index, clusters.length);
                const size = Math.max(60, Math.min(150, 60 + cluster.taskCount * 5));

                return (
                  <motion.button
                    key={cluster.id}
                    className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: cluster.color,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => handleClusterClick(cluster)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="text-white font-semibold text-center px-2 text-sm">
                      {cluster.name}
                    </span>
                    <Badge variant="secondary" className="mt-1 bg-white/90">
                      {cluster.taskCount}
                    </Badge>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {isLoading ? "Analyzing your tasks..." : "No clusters yet. Add some tasks to get started!"}
            </p>
            {!isLoading && tasks && tasks.length > 0 && (
              <Button onClick={refreshClusters}>
                Generate Clusters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cluster Details Modal */}
      <AnimatePresence>
        {selectedCluster && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCluster(null)}
          >
            <motion.div
              className="w-full max-w-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader 
                  className="flex flex-row items-center justify-between"
                  style={{ borderLeft: `4px solid ${selectedCluster.color}` }}
                >
                  <CardTitle>{selectedCluster.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCluster(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCluster.tasks.map((taskId) => {
                      const task = getTaskById(taskId);
                      if (!task) return null;

                      return (
                        <motion.div
                          key={taskId}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          whileHover={{ x: 4 }}
                        >
                          <button
                            onClick={() => handleTaskToggle(taskId)}
                            className="flex-shrink-0"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </p>
                            {task.category && (
                              <Badge variant="outline" className="mt-1">
                                {task.category}
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {selectedCluster.taskCount === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        All tasks in this cluster are complete! 🎉
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
