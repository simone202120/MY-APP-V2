// components/common/AnimatedComponents.tsx
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

// Card animata per elementi della lista
export const AnimatedCard = motion.div;

// Componente per le transizioni di pagina
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

// Contenitore per liste animate
export const AnimatedList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnimatePresence mode="popLayout">
    {children}
  </AnimatePresence>
);

// Modal animato
export const AnimatedModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);