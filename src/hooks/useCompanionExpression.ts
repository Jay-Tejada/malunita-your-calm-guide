import { useState, useCallback } from "react";
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

  const autoEmotionTick = useCallback(() => {
    // Pick a random ambient expression
    const randomIndex = Math.floor(Math.random() * AMBIENT_EXPRESSIONS.length);
    const nextExpression = AMBIENT_EXPRESSIONS[randomIndex];
    
    // Get the asset filename (without extension)
    const assetPath = getExpressionAsset(nextExpression);
    const expressionKey = assetPath.replace(".png", "");
    
    setCurrentExpression(expressionKey);
  }, []);

  return {
    currentExpression,
    autoEmotionTick,
  };
}
