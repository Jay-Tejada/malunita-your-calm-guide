import { motion } from 'framer-motion';

interface EndOfDayWrapUpProps {
  completed: boolean;
}

export const EndOfDayWrapUp = ({ completed }: EndOfDayWrapUpProps) => {
  const currentHour = new Date().getHours();
  
  // Evening reflection prompt (8 PM - midnight)
  const getPromptText = () => {
    if (currentHour >= 20) {
      return completed
        ? "You did it. That one thing made today a success. 🌟"
        : "How did today go? Want to reflect or plan for tomorrow?";
    }
    return completed 
      ? "You did it. That one thing made the day a win."
      : "No worries — tomorrow is a fresh start. Want to carry it forward?";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full text-center"
    >
      <p className="text-sm text-muted-foreground">
        {getPromptText()}
      </p>
    </motion.div>
  );
};
