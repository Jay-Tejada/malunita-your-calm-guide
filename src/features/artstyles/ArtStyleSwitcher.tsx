import { motion, AnimatePresence } from 'framer-motion';
import { Check, Paintbrush } from 'lucide-react';
import { useArtStyleStore } from './useArtStyleStore';
import { ART_STYLES, ArtStyleKey } from './artStyleConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ArtStyleSwitcher = () => {
  const { currentStyle, setStyle } = useArtStyleStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5" />
          Art Style
        </CardTitle>
        <CardDescription>
          Choose how Malunita appears visually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(ART_STYLES).map((style) => {
            const isActive = currentStyle === style.id;
            
            return (
              <motion.div
                key={style.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setStyle(style.id as ArtStyleKey)}
                  className={cn(
                    "w-full h-auto p-4 flex flex-col items-center gap-2 relative",
                    isActive && "border-primary bg-primary/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-2 right-2"
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                  
                  <span className="text-3xl">{style.icon}</span>
                  
                  <div className="text-center">
                    <p className="font-medium text-sm">{style.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {style.description}
                    </p>
                  </div>
                  
                  {/* Coming soon badge for non-storybook styles */}
                  {style.id !== 'storybook' && (
                    <span className="absolute bottom-2 text-[10px] px-2 py-0.5 bg-secondary/80 rounded-full">
                      Assets TBD
                    </span>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Art style changes apply instantly with a smooth transition
        </p>
      </CardContent>
    </Card>
  );
};
