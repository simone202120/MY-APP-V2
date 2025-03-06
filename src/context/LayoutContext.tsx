// src/context/LayoutContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  showFooter: boolean;
  setShowFooter: React.Dispatch<React.SetStateAction<boolean>>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showFooter, setShowFooter] = useState(true);

  const value = {
    showFooter,
    setShowFooter
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};