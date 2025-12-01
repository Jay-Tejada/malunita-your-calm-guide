import { createContext, useContext, useState, ReactNode } from 'react';

interface ProgressContextType {
  showProgress: () => void;
  isProgressVisible: boolean;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [isProgressVisible, setIsProgressVisible] = useState(false);

  const showProgress = () => {
    setIsProgressVisible(true);
    setTimeout(() => setIsProgressVisible(false), 5000); // Show for 5 seconds
  };

  return (
    <ProgressContext.Provider value={{ showProgress, isProgressVisible }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgressVisibility = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgressVisibility must be used within ProgressProvider');
  }
  return context;
};
