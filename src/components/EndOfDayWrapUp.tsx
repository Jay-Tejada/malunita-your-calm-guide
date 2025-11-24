import { motion } from 'framer-motion';

interface EndOfDayWrapUpProps {
  completed: boolean;
}

export const EndOfDayWrapUp = ({ completed }: EndOfDayWrapUpProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full text-center"
    >
      <p className="text-sm text-muted-foreground">
        {completed 
          ? "You did it. That one thing made the day a win."
          : "No worries — tomorrow is a fresh start. Want to carry it forward?"}
      </p>
    </motion.div>
  );
};
