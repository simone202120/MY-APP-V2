// components/layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import { useLayoutContext } from '../../context/LayoutContext';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showFooter } = useLayoutContext();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Simula un piccolo ritardo per l'animazione di caricamento
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-background-alt">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary-100/20 filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary-100/20 filter blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tertiary-100/10 filter blur-3xl opacity-30"></div>
      </div>
      
      <Header />
      
      <AnimatePresence>
        {isLoaded && (
          <motion.main 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-8 pb-28 pt-20 max-w-2xl"
          >
            {children}
          </motion.main>
        )}
      </AnimatePresence>
      
      {showFooter && <Navigation />}
    </div>
  );
};

export default Layout;