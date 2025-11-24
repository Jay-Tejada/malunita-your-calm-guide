import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface CompanionExpressionProps {
  expression: string;
}

export function CompanionExpression({ expression }: CompanionExpressionProps) {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const loadImage = async () => {
      // Get the public URL for the expression image
      const { data } = supabase.storage
        .from('companion-expressions')
        .getPublicUrl(`companion/expressions/${expression}.png`);
      
      if (data?.publicUrl) {
        setImageUrl(data.publicUrl);
      }
    };

    loadImage();
  }, [expression]);

  return (
    <motion.img
      src={imageUrl}
      alt={`Companion ${expression} expression`}
      initial={{ y: 0 }}
      animate={{ y: [-2, 2, -2] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut"
      }}
      style={{
        width: "160px",
        height: "auto",
        objectFit: "contain",
        userSelect: "none"
      }}
    />
  );
}
