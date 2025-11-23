import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemoryJournal, type FilterType, type JournalEntry } from '@/hooks/useMemoryJournal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreatureSprite } from '@/components/CreatureSprite';
import { Smile, AlertCircle, Trophy, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export const MemoryJournal = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const { entries, isLoading, filterEntries, getStats } = useMemoryJournal();
  const filteredEntries = filterEntries(entries, activeFilter);
  const stats = getStats(entries);

  const filters = [
    { id: 'all' as const, label: 'All Entries', icon: Calendar },
    { id: 'happy' as const, label: 'Happy Moments', icon: Smile },
    { id: 'stress' as const, label: 'Stress Spikes', icon: AlertCircle },
    { id: 'wins' as const, label: 'Task Wins', icon: Trophy },
    { id: 'ritual' as const, label: 'Ritual Entries', icon: Sparkles },
  ];

  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      happy: 'text-yellow-500',
      overjoyed: 'text-yellow-400',
      excited: 'text-orange-400',
      loving: 'text-pink-400',
      concerned: 'text-blue-400',
      sleepy: 'text-purple-400',
      neutral: 'text-muted-foreground',
    };
    return moodColors[mood] || 'text-muted-foreground';
  };

  const getEmotionBadge = (entry: JournalEntry) => {
    const { joy, stress, affection, fatigue } = entry.emotional_state;
    
    if (joy >= 70) return { label: 'Joyful', color: 'bg-yellow-500/20 text-yellow-700' };
    if (stress >= 70) return { label: 'Stressed', color: 'bg-red-500/20 text-red-700' };
    if (affection >= 70) return { label: 'Connected', color: 'bg-pink-500/20 text-pink-700' };
    if (fatigue >= 70) return { label: 'Tired', color: 'bg-purple-500/20 text-purple-700' };
    return { label: 'Balanced', color: 'bg-green-500/20 text-green-700' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading journal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{stats.totalEntries}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Happy Moments</p>
                <p className="text-2xl font-bold">{stats.happyMoments}</p>
              </div>
              <Smile className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Task Wins</p>
                <p className="text-2xl font-bold">{stats.tasksWins}</p>
              </div>
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter.id)}
                className="gap-2"
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Timeline</CardTitle>
          <CardDescription>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No entries yet. Keep interacting to build memories!</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredEntries.map((entry) => {
                  const isExpanded = expandedEntry === entry.id;
                  const emotionBadge = getEmotionBadge(entry);

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            {/* Creature Icon */}
                            <div className="flex-shrink-0">
                              <div className={`w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center ${getMoodColor(entry.mood)}`}>
                                <CreatureSprite emotion={entry.mood} size={40} />
                              </div>
                            </div>

                            {/* Entry Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {format(new Date(entry.timestamp), 'MMM d, yyyy')}
                                  </p>
                                  <Badge className={emotionBadge.color}>
                                    {emotionBadge.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(entry.timestamp), 'h:mm a')}
                                </p>
                              </div>

                              {/* AI Summary */}
                              {entry.ai_summary && (
                                <p className="text-sm text-foreground mb-3">
                                  {entry.ai_summary}
                                </p>
                              )}

                              {/* Quick Stats */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {entry.tasks_completed > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    {entry.tasks_completed} completed
                                  </span>
                                )}
                                {entry.tasks_created > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    {entry.tasks_created} created
                                  </span>
                                )}
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-4 pt-4 border-t space-y-2"
                                  >
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Joy</p>
                                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-yellow-500"
                                            style={{ width: `${entry.emotional_state.joy}%` }}
                                          />
                                        </div>
                                        <p className="text-xs mt-1">{entry.emotional_state.joy}/100</p>
                                      </div>

                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Stress</p>
                                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-red-500"
                                            style={{ width: `${entry.emotional_state.stress}%` }}
                                          />
                                        </div>
                                        <p className="text-xs mt-1">{entry.emotional_state.stress}/100</p>
                                      </div>

                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Affection</p>
                                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-pink-500"
                                            style={{ width: `${entry.emotional_state.affection}%` }}
                                          />
                                        </div>
                                        <p className="text-xs mt-1">{entry.emotional_state.affection}/100</p>
                                      </div>

                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Fatigue</p>
                                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-purple-500"
                                            style={{ width: `${entry.emotional_state.fatigue}%` }}
                                          />
                                        </div>
                                        <p className="text-xs mt-1">{entry.emotional_state.fatigue}/100</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3">
                                      <Badge variant="outline" className="text-xs">
                                        Mood: {entry.mood}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Type: {entry.entry_type}
                                      </Badge>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
