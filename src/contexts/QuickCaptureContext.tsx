import { createContext, useContext, useState, ReactNode } from 'react';

interface QuickCaptureContextType {
  isOpen: boolean;
  openQuickCapture: () => void;
  closeQuickCapture: () => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextType | null>(null);

export const QuickCaptureProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openQuickCapture = () => setIsOpen(true);
  const closeQuickCapture = () => setIsOpen(false);

  return (
    <QuickCaptureContext.Provider value={{ isOpen, openQuickCapture, closeQuickCapture }}>
      {children}
    </QuickCaptureContext.Provider>
  );
};

export const useQuickCapture = () => {
  const context = useContext(QuickCaptureContext);
  if (!context) {
    throw new Error('useQuickCapture must be used within QuickCaptureProvider');
  }
  return context;
};
