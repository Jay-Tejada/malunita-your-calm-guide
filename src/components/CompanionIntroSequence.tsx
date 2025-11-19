import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PersonalityType } from '@/hooks/useCompanionIdentity';
import { CompanionHabitat } from './CompanionHabitat';

interface CompanionIntroSequenceProps {
  onComplete: (name: string, personality: PersonalityType) => void;
}

type OnboardingStep = 
  | 'habitat-fade'
  | 'companion-enter'
  | 'welcome-message'
  | 'name-prompt'
  | 'personality-choice'
  | 'evolution'
  | 'complete';

export const CompanionIntroSequence = ({ onComplete }: CompanionIntroSequenceProps) => {
  const [step, setStep] = useState<OnboardingStep>('habitat-fade');
  const [companionName, setCompanionName] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityType | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  // Step progression
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    if (step === 'habitat-fade') {
      timers.push(setTimeout(() => setStep('companion-enter'), 1500));
    } else if (step === 'companion-enter') {
      timers.push(setTimeout(() => setStep('welcome-message'), 2000));
    } else if (step === 'welcome-message') {
      timers.push(setTimeout(() => setStep('name-prompt'), 3000));
    }

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [step]);

  const handleNameSubmit = async () => {
    if (!companionName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please give your companion a name.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnimating(true);
    
    // Sparkle effect
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setStep('personality-choice');
    setIsAnimating(false);
  };

  const handlePersonalitySelect = async (personality: PersonalityType) => {
    setSelectedPersonality(personality);
    setIsAnimating(true);

    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        companion_name: companionName,
        companion_personality_type: personality,
        companion_stage: 1, // Evolve from Seed (0) to Sprout (1)
        companion_xp: 20, // Stage 1 threshold
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving companion data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save companion data.',
        variant: 'destructive',
      });
      return;
    }

    // Evolution animation
    setStep('evolution');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setStep('complete');
    
    // Complete onboarding
    setTimeout(() => {
      onComplete(companionName, personality);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden">
      {/* Habitat Background */}
      <div 
        className={`absolute inset-0 transition-opacity duration-2000 ${
          step === 'habitat-fade' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <CompanionHabitat
          personality="zen"
          stage={step === 'evolution' || step === 'complete' ? 1 : 0}
          emotion="neutral"
        />
      </div>

      {/* Companion Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Companion Visual */}
        <div 
          className={`transition-all duration-1000 ${
            step === 'habitat-fade' ? 'opacity-0 scale-50' :
            step === 'companion-enter' ? 'opacity-100 scale-100 translate-y-0' :
            step === 'welcome-message' ? 'opacity-100 scale-100 -translate-y-2' :
            step === 'evolution' ? 'opacity-100 scale-125 animate-[evolution-bloom_3s_ease-in-out]' :
            'opacity-100 scale-100'
          } ${
            step === 'name-prompt' && isAnimating ? 'animate-[voice-name-flash_0.8s_ease-out]' : ''
          }`}
        >
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            {/* Outer Halo */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
              style={{
                background: 'radial-gradient(circle, hsl(200, 70%, 60%), transparent)',
                transform: step === 'evolution' || step === 'complete' ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 3s ease-in-out',
              }}
            />

            {/* Middle Glow */}
            <div
              className="absolute inset-2 rounded-full blur-xl opacity-60"
              style={{
                background: 'radial-gradient(circle, hsl(200, 65%, 65%), transparent)',
                transform: step === 'evolution' || step === 'complete' ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 3s ease-in-out',
              }}
            />

            {/* Core Orb */}
            <div
              className={`absolute inset-4 rounded-full ${
                selectedPersonality === 'spark' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                selectedPersonality === 'cosmo' ? 'bg-gradient-to-br from-purple-400 to-indigo-500' :
                'bg-gradient-to-br from-blue-300 to-blue-500'
              }`}
              style={{
                boxShadow: '0 0 40px hsl(200, 65%, 65%)',
                transform: step === 'evolution' || step === 'complete' ? 'scale(1.15)' : 
                          step === 'welcome-message' ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 3s ease-in-out, background 1s ease',
              }}
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="mt-12 text-center max-w-md">
          {/* Welcome Message */}
          {step === 'welcome-message' && (
            <div className="animate-fade-in">
              <p className="text-2xl sm:text-3xl font-light text-foreground tracking-wide">
                Welcome to the Malunita Universe
              </p>
            </div>
          )}

          {/* Name Prompt */}
          {step === 'name-prompt' && (
            <div className="animate-fade-in space-y-6">
              <p className="text-xl sm:text-2xl font-light text-foreground">
                This is your companion.
              </p>
              <p className="text-lg text-muted-foreground">
                What would you like to name them?
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <Input
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                  placeholder="Enter a name..."
                  className="text-center text-lg bg-background/50 border-border/50 focus:border-primary"
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                />
                <Button 
                  onClick={handleNameSubmit}
                  disabled={!companionName.trim() || isAnimating}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Personality Choice */}
          {step === 'personality-choice' && (
            <div className="animate-fade-in space-y-6">
              <p className="text-xl sm:text-2xl font-light text-foreground mb-8">
                Choose their vibe
              </p>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handlePersonalitySelect('zen')}
                  disabled={isAnimating}
                  className="group p-6 rounded-2xl border-2 border-border hover:border-blue-400 bg-background/50 hover:bg-blue-500/5 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="text-lg font-medium">Zen</p>
                      <p className="text-sm text-muted-foreground">Calm and steady</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePersonalitySelect('spark')}
                  disabled={isAnimating}
                  className="group p-6 rounded-2xl border-2 border-border hover:border-amber-400 bg-background/50 hover:bg-amber-500/5 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="text-lg font-medium">Spark</p>
                      <p className="text-sm text-muted-foreground">Energetic and quick</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handlePersonalitySelect('cosmo')}
                  disabled={isAnimating}
                  className="group p-6 rounded-2xl border-2 border-border hover:border-purple-400 bg-background/50 hover:bg-purple-500/5 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-300 to-indigo-500 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <p className="text-lg font-medium">Cosmo</p>
                      <p className="text-sm text-muted-foreground">Dreamy and mysterious</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Evolution Message */}
          {step === 'evolution' && (
            <div className="animate-fade-in">
              <p className="text-xl sm:text-2xl font-light text-foreground">
                {companionName} is awakening...
              </p>
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <div className="animate-fade-in">
              <p className="text-xl sm:text-2xl font-light text-foreground">
                Welcome, {companionName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
