// components/layout/Navigation.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart2, Settings, Plus, LucideIcon, X, Target } from 'lucide-react';
import { Button } from "../ui/button";
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  gradient: string[];
  ariaLabel: string;
}

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { 
      id: '/', 
      icon: Home, 
      label: 'Home',
      gradient: ['from-primary-400', 'to-primary-600'],
      ariaLabel: 'Vai alla Home'
    },
    { 
      id: '/calendar', 
      icon: Calendar, 
      label: 'Calendario',
      gradient: ['from-secondary-400', 'to-secondary-600'],
      ariaLabel: 'Vai al Calendario'
    },
    { 
      id: '/stats', 
      icon: BarChart2, 
      label: 'Statistiche',
      gradient: ['from-tertiary-400', 'to-tertiary-600'],
      ariaLabel: 'Vai alle Statistiche'
    }
  ];

  // Stato per gestire il menu di creazione
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);

  return (
    <motion.nav 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Menu di creazione che appare quando si preme il pulsante + */}
        <AnimatePresence>
          {showCreateMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-xs -z-10"
                onClick={() => setShowCreateMenu(false)}
              />
              <motion.div 
                className="absolute bottom-full left-0 right-0 glass-effect rounded-t-3xl shadow-xl p-6 mb-5"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-display text-xl font-bold text-gray-900">Crea nuovo</h3>
                  <Button 
                    variant="glass" 
                    size="icon-sm" 
                    rounded="full"
                    className="text-gray-500"
                    onClick={() => setShowCreateMenu(false)}
                    hasAnimation={true}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex items-center p-5 rounded-2xl bg-white shadow-sm border border-primary-100/80 overflow-hidden group transition-all"
                    onClick={() => {
                      navigate('/create-task');
                      setShowCreateMenu(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center shadow-colored mr-4 z-10">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 z-10">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Nuovo impegno</h4>
                      <p className="text-sm text-gray-500">Crea un nuovo task o routine</p>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex items-center p-5 rounded-2xl bg-white shadow-sm border border-secondary-100/80 overflow-hidden group transition-all"
                    onClick={() => {
                      navigate('/create-counter');
                      setShowCreateMenu(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary-50 to-secondary-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center shadow-colored mr-4 z-10">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 z-10">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">Nuovo contatore</h4>
                      <p className="text-sm text-gray-500">Tieni traccia con contatori numerici</p>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="glass-effect rounded-t-3xl py-5 px-3 shadow-xl border-t border-white/60 mb-safe">
          {/* Pulsante centrale di creazione */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-7">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-colored-hover bg-gradient-accent border-4 border-white"
              aria-label="Crea nuovo"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
            >
              <Plus className="h-6 w-6 text-white" />
            </motion.button>
          </div>

          <div className="flex justify-evenly items-center">
            {/* Tab di navigazione - Solo icone */}
            {navItems.map(({ id, icon: Icon, label, gradient, ariaLabel }) => {
              const isActive = location.pathname === id;
              
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center justify-center py-1 relative px-5 space-y-1.5
                    ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}
                  `}
                  onClick={() => navigate(id)}
                  aria-label={ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className={`absolute -inset-3 -top-4 bg-gradient-accent-soft rounded-2xl opacity-100`}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative h-8 w-8 flex items-center justify-center">
                      {isActive ? (
                        <Icon className="w-full h-full text-primary-500" strokeWidth={2.5} />
                      ) : (
                        <Icon className="w-full h-full text-gray-400" strokeWidth={2} />
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;