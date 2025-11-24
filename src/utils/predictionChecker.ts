import { useEmotionalMemory } from '@/state/emotionalMemory';

interface PredictionState {
  predictedTaskId: string | null;
  predictedTaskTitle: string | null;
  predictionMade: boolean;
  predictionDate: string | null;
}

/**
 * Check if a selected task matches today's prediction
 * If it does, increase affection and dispatch celebration event
 */
export const checkAndHandlePrediction = (taskId: string, taskTitle: string): boolean => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const storedPrediction = localStorage.getItem('primary-focus-prediction');
    
    if (!storedPrediction) return false;
    
    const prediction: PredictionState = JSON.parse(storedPrediction);
    
    // Only check predictions made today
    if (prediction.predictionDate !== today || !prediction.predictionMade) {
      return false;
    }
    
    // Check if the selected task matches our prediction
    const isMatch = 
      taskId === prediction.predictedTaskId ||
      taskTitle.toLowerCase().includes(prediction.predictedTaskTitle?.toLowerCase() || '') ||
      prediction.predictedTaskTitle?.toLowerCase().includes(taskTitle.toLowerCase());
    
    if (isMatch) {
      console.log('Prediction matched! User selected predicted task.');
      
      // Increase affection
      const emotionalMemory = useEmotionalMemory.getState();
      emotionalMemory.adjustAffection(2);
      
      // Dispatch companion message
      window.dispatchEvent(new CustomEvent('companion:prediction-match', {
        detail: { 
          message: "I had a feeling you'd pick that one." 
        }
      }));
      
      // Clear prediction
      localStorage.removeItem('primary-focus-prediction');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking prediction:', error);
    return false;
  }
};
