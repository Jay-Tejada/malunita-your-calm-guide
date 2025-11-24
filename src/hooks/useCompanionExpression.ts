import { useState, useCallback, useEffect } from "react";
import { getExpressionAsset } from "@/utils/getExpressionAsset";
import { CREATURE_EXPRESSIONS } from "@/constants/expressions";

type ExpressionName = keyof typeof CREATURE_EXPRESSIONS;

const AMBIENT_EXPRESSIONS: ExpressionName[] = [
  "neutral",
  "happy",
  "excited",
  "welcoming",
  "winking",
];

export function useCompanionExpression() {
  const [currentExpression, setCurrentExpression] = useState<string>("neutral");
  const [isReacting, setIsReacting] = useState(false);

  // Listen for companion reaction events
  useEffect(() => {
    const handleReaction = (event: CustomEvent) => {
      const { expression, duration } = event.detail;
      
      // Get the asset filename (without extension)
      const assetPath = getExpressionAsset(expression);
      const expressionKey = assetPath.replace(".png", "");
      
      setCurrentExpression(expressionKey);
      
      if (duration > 0) {
        setIsReacting(true);
        // Reacting flag prevents auto-emotion from interrupting
        setTimeout(() => {
          setIsReacting(false);
        }, duration);
      } else {
        setIsReacting(false);
      }
    };

    window.addEventListener('companion:reaction' as any, handleReaction);
    
    return () => {
      window.removeEventListener('companion:reaction' as any, handleReaction);
    };
  }, []);

  const autoEmotionTick = useCallback(() => {
    // Don't auto-tick if currently reacting to an event
    if (isReacting) return;
    
    // Pick a random ambient expression
    const randomIndex = Math.floor(Math.random() * AMBIENT_EXPRESSIONS.length);
    const nextExpression = AMBIENT_EXPRESSIONS[randomIndex];
    
    // Get the asset filename (without extension)
    const assetPath = getExpressionAsset(nextExpression);
    const expressionKey = assetPath.replace(".png", "");
    
    setCurrentExpression(expressionKey);
  }, [isReacting]);

  return {
    currentExpression,
    autoEmotionTick,
  };
}
