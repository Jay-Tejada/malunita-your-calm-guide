import { getExpressionAsset } from '@/utils/getExpressionAsset';
import { cn } from '@/lib/utils';

// Import all expression assets
import baseExpression from '@/assets/companions/base_expression.png';
import baseHappyExpression from '@/assets/companions/base_happy_expression.png';
import excitedExpression from '@/assets/companions/excited_expression.png';
import overjoyedExpression from '@/assets/companions/overjoyed_expression.png';
import happy2Expression from '@/assets/companions/happy_2_expression.png';
import happyToSeeYouExpression from '@/assets/companions/happy_to_see_you_expression.png';
import loveExpression from '@/assets/companions/love_expression.png';
import winkingExpression from '@/assets/companions/winking_expression.png';
import surprisedExpression from '@/assets/companions/surprised_expression.png';
import surprised2Expression from '@/assets/companions/surprised_2_expression.png';
import concernedExpression from '@/assets/companions/concerned_expression.png';
import whyExpression from '@/assets/companions/why_expression.png';
import lowEnergyExpression from '@/assets/companions/low_energy_expression.png';
import sleepingExpression from '@/assets/companions/sleeping_expression.png';
import angryExpression from '@/assets/companions/angry_expression.png';

interface CreatureSpriteProps {
  emotion: string;             // determines the sprite to display
  size?: number;               // default 160px
  animate?: boolean;           // enables idle bounce animation
  className?: string;          // extra classes
}

// Map filenames to imported assets
const assetMap: Record<string, string> = {
  'base_expression.png': baseExpression,
  'base_happy_expression.png': baseHappyExpression,
  'excited_expression.png': excitedExpression,
  'overjoyed_expression.png': overjoyedExpression,
  'happy_2_expression.png': happy2Expression,
  'happy_to_see_you_expression.png': happyToSeeYouExpression,
  'love_expression.png': loveExpression,
  'winking_expression.png': winkingExpression,
  'surprised_expression.png': surprisedExpression,
  'surprised_2_expression.png': surprised2Expression,
  'concerned_expression.png': concernedExpression,
  'why_expression.png': whyExpression,
  'low_energy_expression.png': lowEnergyExpression,
  'sleeping_expression.png': sleepingExpression,
  'angry_expression.png': angryExpression,
};

export const CreatureSprite = ({ 
  emotion, 
  size = 160, 
  animate = false, 
  className 
}: CreatureSpriteProps) => {
  const filename = getExpressionAsset(emotion);
  const imageSrc = assetMap[filename] || baseExpression;

  return (
    <div 
      className={cn(
        "flex items-center justify-center",
        animate && "animate-[float_3s_ease-in-out_infinite]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={imageSrc}
        alt={`Creature ${emotion} expression`}
        className="w-full h-full object-contain"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};
