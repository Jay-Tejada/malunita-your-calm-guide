import { supabase } from "@/integrations/supabase/client";

export type OrbMode = 'capture' | 'reflection' | 'planning' | 'quiet';

export const detectModeSwitch = (text: string): OrbMode | null => {
  const lowerText = text.toLowerCase();
  
  // Planning mode triggers
  if (lowerText.includes('planning mode') || 
      lowerText.includes('switch to planning') ||
      lowerText.includes('enter planning') ||
      lowerText.includes('focus mode')) {
    return 'planning';
  }
  
  // Reflection mode triggers
  if (lowerText.includes('reflection mode') || 
      lowerText.includes('switch to reflection') ||
      lowerText.includes('enter reflection')) {
    return 'reflection';
  }
  
  // Quiet mode triggers (maps to reflection)
  if (lowerText.includes('quiet mode') || 
      lowerText.includes('switch to quiet') ||
      lowerText.includes("i'm in quiet") ||
      lowerText.includes('enter quiet')) {
    return 'quiet';
  }
  
  // Capture mode triggers
  if (lowerText.includes('capture mode') || 
      lowerText.includes('switch to capture') ||
      lowerText.includes('normal mode') ||
      lowerText.includes('default mode')) {
    return 'capture';
  }
  
  return null;
};

export const getModeDisplayName = (mode: OrbMode): string => {
  switch (mode) {
    case 'planning': return 'planning mode';
    case 'reflection': return 'reflection mode';
    case 'quiet': return 'quiet mode';
    default: return 'capture mode';
  }
};

export const getModeDescription = (mode: OrbMode): string => {
  switch (mode) {
    case 'planning': return 'Focused on goals and priorities';
    case 'reflection': return 'A space for deeper thought';
    case 'quiet': return 'Listening mode for gentle input';
    default: return 'Ready to capture your tasks';
  }
};

export interface ProcessAudioOptions {
  audioBlob: Blob;
  userId?: string;
  companionName?: string;
  onTranscribed: (text: string) => void;
  onModeDetected?: (mode: OrbMode) => void;
  onNameMention?: () => void;
  onError: (error: string) => void;
}

export const processAudioTranscription = async ({
  audioBlob,
  userId,
  companionName,
  onTranscribed,
  onModeDetected,
  onNameMention,
  onError,
}: ProcessAudioOptions): Promise<void> => {
  // Convert blob to base64
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      const base64Audio = reader.result?.toString().split(',')[1];
      
      if (!base64Audio) {
        const error = "Failed to process audio";
        onError(error);
        reject(new Error(error));
        return;
      }

      try {
        console.log('Calling transcribe-audio function...');
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        console.log('Transcribe response:', { data, error });
        
        if (error) {
          console.error('Transcription error details:', error);
          throw error;
        }

        const transcribedText = data.text;
        
        // Check for companion name mention
        if (companionName && transcribedText.toLowerCase().includes(companionName.toLowerCase())) {
          onNameMention?.();
        }
        
        // Check for mode switch command
        const detectedMode = detectModeSwitch(transcribedText);
        if (detectedMode && onModeDetected) {
          onModeDetected(detectedMode);
          resolve();
          return;
        }
        
        if (transcribedText) {
          onTranscribed(transcribedText);
          
          // Categorize in background and update if confident
          supabase.functions.invoke('categorize-task', {
            body: { 
              text: transcribedText,
              userId: userId
            }
          }).then(({ data: categoryData, error: categoryError }) => {
            if (!categoryError && categoryData?.confidence === 'high' && categoryData.category !== 'inbox') {
              console.log(`Auto-categorized as: ${categoryData.category}`);
            }
          }).catch(err => {
            console.error('Background categorization error:', err);
          });
        }
        
        resolve();
      } catch (error) {
        console.error('Transcription error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
        onError(errorMessage);
        reject(error);
      }
    };
  });
};
