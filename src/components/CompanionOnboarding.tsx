import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PersonalityType } from '@/hooks/useCompanionIdentity';
import { Sparkles, Waves, Star } from 'lucide-react';

interface CompanionOnboardingProps {
  open: boolean;
  onComplete: (name: string, personality: PersonalityType) => void;
}

export const CompanionOnboarding = ({ open, onComplete }: CompanionOnboardingProps) => {
  const [step, setStep] = useState<'welcome' | 'name' | 'personality'>('welcome');
  const [name, setName] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityType | null>(null);
  const [hoveredPersonality, setHoveredPersonality] = useState<PersonalityType | null>(null);

  const personalities = [
    {
      type: 'zen' as PersonalityType,
      name: 'Zen',
      description: 'Calm, gentle, and grounding. Soft blues and peaceful presence.',
      icon: Waves,
      gradient: 'from-blue-300 to-cyan-200',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-400',
      bgColor: 'bg-blue-50',
    },
    {
      type: 'spark' as PersonalityType,
      name: 'Spark',
      description: 'Energetic, warm, and lively. Golden tones and bouncy reactions.',
      icon: Sparkles,
      gradient: 'from-amber-300 to-orange-200',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-400',
      bgColor: 'bg-amber-50',
    },
    {
      type: 'cosmo' as PersonalityType,
      name: 'Cosmo',
      description: 'Mystical, dreamy, and cosmic. Purple galaxy tones and ethereal glow.',
      icon: Star,
      gradient: 'from-purple-300 to-indigo-200',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-400',
      bgColor: 'bg-purple-50',
    },
  ];

  const handleNameSubmit = () => {
    if (name.trim().length >= 2) {
      setStep('personality');
    }
  };

  const handlePersonalitySelect = (personality: PersonalityType) => {
    setSelectedPersonality(personality);
    // Small delay for animation feedback
    setTimeout(() => {
      onComplete(name, personality);
    }, 300);
  };

  return (
    <Dialog open={open} modal>
      <DialogContent className="max-w-lg">
        {step === 'welcome' && (
          <div className="flex flex-col items-center gap-6 py-8">
            {/* Animated Orb */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orb-core-idle to-orb-glow-idle animate-companion-breath" 
                style={{
                  boxShadow: '0 8px 32px hsl(var(--orb-halo-idle) / 0.4), inset 0 2px 8px hsl(var(--orb-core-idle) / 0.3)',
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-radial from-white/20 to-transparent animate-companion-float" />
              </div>
              {/* Curious particles */}
              <div className="absolute -inset-4 animate-orbit opacity-40">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-2xl font-light text-foreground">
                Welcome to the Malunita Universe
              </h2>
              <p className="text-muted-foreground max-w-md">
                I'm your companion. Together, we'll organize your life, capture your thoughts, and help you focus on what matters.
              </p>
            </div>

            <Button 
              onClick={() => setStep('name')}
              size="lg"
              className="mt-4"
            >
              Let's get started
            </Button>
          </div>
        )}

        {step === 'name' && (
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-orb-core-idle to-orb-glow-idle animate-companion-breath" 
              style={{
                boxShadow: '0 6px 24px hsl(var(--orb-halo-idle) / 0.3)',
              }}
            />

            <div className="text-center space-y-3 w-full">
              <DialogHeader>
                <DialogTitle className="text-2xl font-light">
                  What would you like to name me?
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Choose a name that feels right to you
              </p>
            </div>

            <div className="w-full space-y-4">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name..."
                className="text-center text-lg h-12"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              />
              
              <Button 
                onClick={handleNameSubmit}
                size="lg"
                disabled={name.trim().length < 2}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'personality' && (
          <div className="flex flex-col gap-6 py-6">
            <div className="text-center space-y-2">
              <DialogHeader>
                <DialogTitle className="text-2xl font-light">
                  Choose {name}'s vibe
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This will shape {name}'s colors, animations, and presence
              </p>
            </div>

            <div className="space-y-3">
              {personalities.map((personality) => {
                const Icon = personality.icon;
                const isSelected = selectedPersonality === personality.type;
                const isHovered = hoveredPersonality === personality.type;
                
                return (
                  <button
                    key={personality.type}
                    onClick={() => handlePersonalitySelect(personality.type)}
                    onMouseEnter={() => setHoveredPersonality(personality.type)}
                    onMouseLeave={() => setHoveredPersonality(null)}
                    className={`
                      w-full p-5 rounded-xl border-2 transition-all duration-300 text-left
                      ${isSelected 
                        ? `${personality.borderColor} ${personality.bgColor} scale-105` 
                        : isHovered
                        ? `${personality.borderColor} ${personality.bgColor}/50 scale-102`
                        : 'border-border hover:border-secondary bg-card'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon with personality color */}
                      <div className={`
                        p-3 rounded-lg bg-gradient-to-br ${personality.gradient} 
                        ${isSelected || isHovered ? 'animate-companion-breath' : ''}
                      `}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium mb-1 ${personality.textColor}`}>
                          {personality.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {personality.description}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      {(isSelected || isHovered) && (
                        <div className="flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full ${personality.textColor} animate-pulse`} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
