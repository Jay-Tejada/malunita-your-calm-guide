import { createContext, useContext, ReactNode } from 'react';

interface DrawerContextType {
  isAnyDrawerOpen: boolean;
}

const DrawerContext = createContext<DrawerContextType>({ isAnyDrawerOpen: false });

export const DrawerProvider = ({ 
  children,
  isAnyDrawerOpen 
}: { 
  children: ReactNode;
  isAnyDrawerOpen: boolean;
}) => {
  return (
    <DrawerContext.Provider value={{ isAnyDrawerOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawerState = () => {
  return useContext(DrawerContext);
};
