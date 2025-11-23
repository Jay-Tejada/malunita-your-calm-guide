import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useWeeklyQuests } from '@/hooks/useWeeklyQuests';
import { useQuestTracking } from '@/hooks/useQuestTracking';
import { CreatureSprite } from '@/components/CreatureSprite';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Gift, CheckCircle2 } from 'lucide-react';

export const QuestSystem = () => {
  const { quests, isLoading, generateQuests, isGenerating, claimReward, isClaiming, allQuestsCompleted, allRewardsClaimed } = useWeeklyQuests();
  
  // Initialize quest tracking
  useQuestTracking();

  // Auto-generate quests if none exist for current week
  useEffect(() => {
    if (!isLoading && quests.length === 0) {
      generateQuests();
    }
  }, [isLoading, quests.length]);

  if (isLoading || isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <CreatureSprite size={100} emotion="neutral" className="mx-auto" />
          <p className="text-muted-foreground">Loading your weekly quests...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (current: number, target: number) => Math.min((current / target) * 100, 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Weekly Quests</h2>
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground">Complete quests to earn XP, affection, and special rewards!</p>
        
        {/* Malunita cheering */}
        <div className="relative">
          <CreatureSprite size={80} emotion={allQuestsCompleted ? "overjoyed" : "excited"} className="mx-auto" />
          {allQuestsCompleted && !allRewardsClaimed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </motion.div>
          )}
        </div>
        
        {allQuestsCompleted && !allRewardsClaimed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 rounded-lg border border-primary/20"
          >
            <div className="flex items-center justify-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <p className="font-medium">All quests completed! Claim your rewards!</p>
            </div>
          </motion.div>
        )}
        
        {allRewardsClaimed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-lg border border-green-500/20"
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="font-medium text-green-600">Amazing work! All rewards claimed this week!</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quest Cards */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {quests.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-6 ${quest.completed ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' : 'hover:shadow-lg transition-shadow'}`}>
                <div className="space-y-4">
                  {/* Quest Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{quest.title}</h3>
                        {quest.completed && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        {quest.claimed && (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-700">
                            <Gift className="h-3 w-3 mr-1" />
                            Claimed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{quest.description}</p>
                    </div>
                    
                    {/* Quest type icon */}
                    <div className="text-2xl">
                      {quest.quest_type === 'complete_tasks' && '✓'}
                      {quest.quest_type === 'ritual_streak' && '🌅'}
                      {quest.quest_type === 'focus_sessions' && '🎯'}
                      {quest.quest_type === 'mini_games' && '🎮'}
                      {quest.quest_type === 'complete_project' && '📁'}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {quest.current_value} / {quest.target_value}
                      </span>
                    </div>
                    <Progress value={progressPercentage(quest.current_value, quest.target_value)} className="h-3" />
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-medium">{quest.reward_xp} XP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-pink-500">♥</span>
                        <span className="font-medium">{quest.reward_affection} Affection</span>
                      </div>
                      {quest.reward_cosmetic_type && (
                        <Badge variant="secondary" className="text-xs">
                          <Gift className="h-3 w-3 mr-1" />
                          {quest.reward_cosmetic_type}
                        </Badge>
                      )}
                    </div>

                    {/* Claim Button */}
                    {quest.completed && !quest.claimed && (
                      <Button
                        onClick={() => claimReward(quest.id)}
                        disabled={isClaiming}
                        className="gap-2"
                      >
                        <Gift className="h-4 w-4" />
                        Claim Reward
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bonus Reward Section */}
      {allQuestsCompleted && allRewardsClaimed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <CreatureSprite size={120} emotion="overjoyed" className="mx-auto" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="absolute -top-4 -right-4"
                >
                  <Trophy className="h-12 w-12 text-yellow-500 filter drop-shadow-lg" />
                </motion.div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">🎉 All Quests Complete! 🎉</h3>
                <p className="text-muted-foreground">
                  You've completed all quests this week! Come back next Monday for new challenges!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {quests.length === 0 && !isLoading && !isGenerating && (
        <Card className="p-12 text-center">
          <CreatureSprite size={100} emotion="curious" className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Quests Yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate your weekly quests to start earning rewards!
          </p>
          <Button onClick={() => generateQuests()} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Quests
          </Button>
        </Card>
      )}
    </div>
  );
};
