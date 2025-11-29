import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import { CREATURE_EXPRESSIONS } from "@/constants/expressions";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getLQIP } from "@/lib/imageOptimization";

// Import all companion expression images
import baseExpression from "@/assets/companions/base_expression.png";
import baseHappyExpression from "@/assets/companions/base_happy_expression.png";
import excitedExpression from "@/assets/companions/excited_expression.png";
import overjoyedExpression from "@/assets/companions/overjoyed_expression.png";
import happy2Expression from "@/assets/companions/happy_2_expression.png";
import happyToSeeYouExpression from "@/assets/companions/happy_to_see_you_expression.png";
import loveExpression from "@/assets/companions/love_expression.png";
import winkingExpression from "@/assets/companions/winking_expression.png";
import surprisedExpression from "@/assets/companions/surprised_expression.png";
import surprised2Expression from "@/assets/companions/surprised_2_expression.png";
import concernedExpression from "@/assets/companions/concerned_expression.png";
import whyExpression from "@/assets/companions/why_expression.png";
import lowEnergyExpression from "@/assets/companions/low_energy_expression.png";
import sleepingExpression from "@/assets/companions/sleeping_expression.png";
import angryExpression from "@/assets/companions/angry_expression.png";

const expressionImageMap: Record<string, string> = {
  "base_expression.png": baseExpression,
  "base_happy_expression.png": baseHappyExpression,
  "excited_expression.png": excitedExpression,
  "overjoyed_expression.png": overjoyedExpression,
  "happy_2_expression.png": happy2Expression,
  "happy_to_see_you_expression.png": happyToSeeYouExpression,
  "love_expression.png": loveExpression,
  "winking_expression.png": winkingExpression,
  "surprised_expression.png": surprisedExpression,
  "surprised_2_expression.png": surprised2Expression,
  "concerned_expression.png": concernedExpression,
  "why_expression.png": whyExpression,
  "low_energy_expression.png": lowEnergyExpression,
  "sleeping_expression.png": sleepingExpression,
  "angry_expression.png": angryExpression,
};

interface CompanionExpressionProps {
  expression: string;
}

export const CompanionExpression = memo(function CompanionExpression({ expression }: CompanionExpressionProps) {
  // Memoize the image URL computation
  const imageUrl = useMemo(() => {
    const filename = `${expression}.png`;
    return expressionImageMap[filename] || baseExpression;
  }, [expression]);

  const placeholder = useMemo(() => getLQIP(imageUrl), [imageUrl]);

  return (
    <motion.div
      key={expression}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: [-2, 2, -2] }}
      transition={{
        opacity: { duration: 0.3 },
        y: {
          duration: 3,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }
      }}
      className="w-40 h-auto select-none"
    >
      <OptimizedImage
        src={imageUrl}
        alt={`Companion ${expression} expression`}
        placeholder={placeholder}
        preload={true}
        className="w-full h-auto"
      />
    </motion.div>
  );
});
