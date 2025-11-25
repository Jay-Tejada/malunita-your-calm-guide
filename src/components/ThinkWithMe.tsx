import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Sparkles, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { runLongReasoning } from '@/ai/longReasoningEngine';
import { useTasks } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { useMemoryEngine } from '@/state/memoryEngine';
import { useMoodStore } from '@/state/moodMachine';
import { useToast } from '@/hooks/use-toast';
import { CompanionAvatar } from '@/components/companion/CompanionAvatar';
import { supabase } from '@/integrations/supabase/client';

interface ThinkWithMeProps {
  trigger?: React.ReactNode;
}

interface StructuredAnswer {
  mainInsight: string;
  recommendedPlan: string[];
  risks: string[];
  nextActions: string[];
  clarifyingQuestions: string[];
}

export const ThinkWithMe = ({ trigger }: ThinkWithMeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [answer, setAnswer] = useState<StructuredAnswer | null>(null);
  const [rawAnswer, setRawAnswer] = useState<string>('');
  const { tasks } = useTasks();
  const { profile } = useProfile();
  const { toast } = useToast();
  const mood = useMoodStore(state => state.mood);

  const parseStructuredAnswer = (text: string): StructuredAnswer => {
    // Try to parse structured sections from the answer
    const sections: StructuredAnswer = {
      mainInsight: '',
      recommendedPlan: [],
      risks: [],
      nextActions: [],
      clarifyingQuestions: [],
    };

    // Extract main insight (first paragraph or section)
    const insightMatch = text.match(/(?:main insight|insight|summary):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
    if (insightMatch) {
      sections.mainInsight = insightMatch[1].trim();
    } else {
      // Use first paragraph as main insight
      const firstPara = text.split('\n\n')[0];
      sections.mainInsight = firstPara || text.substring(0, 200);
    }

    // Extract recommended plan
    const planMatch = text.match(/(?:recommended plan|plan|approach):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
    if (planMatch) {
      sections.recommendedPlan = planMatch[1]
        .split(/\n[-•]\s*/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    // Extract risks
    const risksMatch = text.match(/(?:risks|bottlenecks|challenges|concerns):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
    if (risksMatch) {
      sections.risks = risksMatch[1]
        .split(/\n[-•]\s*/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    // Extract next actions
    const actionsMatch = text.match(/(?:next actions|actions|steps|to-do):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
    if (actionsMatch) {
      sections.nextActions = actionsMatch[1]
        .split(/\n[-•]\s*/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    // Extract clarifying questions
    const questionsMatch = text.match(/(?:questions|clarify|clarifying questions):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
    if (questionsMatch) {
      sections.clarifyingQuestions = questionsMatch[1]
        .split(/\n[-•]\s*/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    return sections;
  };

  const handleThink = async () => {
    if (!question.trim()) {
      toast({
        title: 'Question needed',
        description: 'Please enter a question or problem to think about.',
        variant: 'destructive',
      });
      return;
    }

    setIsThinking(true);
    const startTime = Date.now();

    try {
      const memoryEngine = useMemoryEngine.getState();
      const result = await runLongReasoning(question, {
        tasks: tasks?.filter(t => !t.completed).map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          is_focus: t.is_focus,
        })) || [],
        goals: profile?.current_goal || null,
        mood: mood,
        memory: {
          writingStyle: memoryEngine.writingStyle,
          positiveReinforcers: memoryEngine.positiveReinforcers.slice(-10),
        },
      });

      const timeTaken = Date.now() - startTime;
      
      setRawAnswer(result.answer);
      const structured = parseStructuredAnswer(result.answer);
      setAnswer(structured);

      // Log to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ai_reasoning_log').insert({
          user_id: user.id,
          transcript: question,
          mode: 'deep',
          answer: result.answer,
          steps: result.steps,
          reasoning_metadata: {
            chain_of_thought: result.reasoning,
            steps_count: result.steps.length,
          },
          time_taken_ms: timeTaken,
          context_snapshot: {
            task_count: tasks?.length || 0,
            goals: profile?.current_goal,
            mood: mood,
          },
        });
      }

      toast({
        title: 'Deep thinking complete',
        description: `Analyzed in ${(timeTaken / 1000).toFixed(1)}s`,
      });
    } catch (error: any) {
      console.error('Think With Me error:', error);
      toast({
        title: 'Thinking failed',
        description: error.message || 'Failed to process your question',
        variant: 'destructive',
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setAnswer(null);
    setRawAnswer('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Brain className="w-4 h-4" />
            Think With Me
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="w-6 h-6 text-primary" />
            Think With Me
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Question Input */}
          {!answer && (
            <div className="space-y-2">
              <label className="text-sm font-medium">What would you like to think through?</label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., How should I prioritize my work today? What's the best approach to tackle this complex project?"
                className="min-h-[100px] resize-none"
                disabled={isThinking}
              />
              <Button 
                onClick={handleThink} 
                disabled={isThinking || !question.trim()}
                className="w-full gap-2"
              >
                {isThinking ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Thinking deeply...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Start Deep Thinking
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Thinking Animation */}
          {isThinking && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="w-24 h-24">
                  <CompanionAvatar 
                    mode="thinking"
                  />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                Analyzing your question...
              </p>
            </div>
          )}

          {/* Structured Answer */}
          {answer && !isThinking && (
            <div className="space-y-6">
              {/* Main Insight */}
              {answer.mainInsight && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <h3 className="font-semibold text-lg">Main Insight</h3>
                  </div>
                  <p className="text-foreground leading-relaxed">{answer.mainInsight}</p>
                </div>
              )}

              {/* Recommended Plan */}
              {answer.recommendedPlan.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Recommended Plan</h3>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {answer.recommendedPlan.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks / Bottlenecks */}
              {answer.risks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold">Risks & Bottlenecks</h3>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {answer.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Actions */}
              {answer.nextActions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Next Actions</h3>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {answer.nextActions.map((action, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">{idx + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Clarifying Questions */}
              {answer.clarifyingQuestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Questions to Clarify</h3>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {answer.clarifyingQuestions.map((q, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw answer fallback if no structured sections */}
              {!answer.mainInsight && 
               answer.recommendedPlan.length === 0 && 
               answer.risks.length === 0 && 
               answer.nextActions.length === 0 && 
               rawAnswer && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{rawAnswer}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  Ask Another Question
                </Button>
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(handleReset, 300);
                  }}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
