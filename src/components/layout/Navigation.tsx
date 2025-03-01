// components/layout/Navigation.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart2, Settings, Plus, LucideIcon, X } from 'lucide-react';
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
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Menu di creazione che appare quando si preme il pulsante + */}
        <AnimatePresence>
          {showCreateMenu && (
            <motion.div 
              className="absolute bottom-full left-0 right-0 glass-effect rounded-t-2xl shadow-card p-5 mb-3"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-lg text-gray-900">Crea nuovo</h3>
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
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="glass"
                  className="flex flex-col items-center justify-center gap-3 h-auto py-6 relative overflow-hidden group border-2 border-primary-200/50"
                  onClick={() => {
                    navigate('/create-task');
                    setShowCreateMenu(false);
                  }}
                  hasAnimation={true}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg mb-1">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium relative">Nuovo impegno</span>
                </Button>
                
                <Button
                  variant="glass"
                  className="flex flex-col items-center justify-center gap-3 h-auto py-6 relative overflow-hidden group border-2 border-secondary-200/50"
                  onClick={() => {
                    navigate('/create-counter');
                    setShowCreateMenu(false);
                  }}
                  hasAnimation={true}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary-100 to-secondary-200 opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-lg mb-1">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-gray-800 font-medium relative">Nuovo contatore</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-effect rounded-t-2xl pt-6 pb-2 px-6 shadow-card mb-safe">
          {/* Pulsante centrale di creazione */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5">
            <Button
              variant="glass"
              size="icon-md"
              rounded="full"
              className="shadow-xl border-2 border-white bg-gradient-to-br from-primary-400 to-secondary-500"
              aria-label="Crea nuovo"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              hasAnimation={true}
            >
              <Plus className="h-5 w-5 text-white" />
            </Button>
          </div>

          <div className="flex justify-between items-center pt-1">
            {/* Tab di navigazione */}
            {navItems.map(({ id, icon: Icon, label, gradient, ariaLabel }, index) => {
              const isActive = location.pathname === id;
              
              return (
                <Button
                  key={id}
                  variant="ghost"
                  className={`flex flex-col items-center justify-center py-1.5 px-4 relative
                    ${isActive ? 'text-gray-900' : 'text-gray-500'}
                  `}
                  onClick={() => navigate(id)}
                  aria-label={ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                  hasAnimation={!isActive}
                >
                  <div className="relative mb-0.5">
                    {isActive && (
                      <div className={`absolute -inset-1 bg-gradient-to-br ${gradient[0]} ${gradient[1]} rounded-full opacity-10 animate-breathe`}></div>
                    )}
                    <div className="relative h-5 w-5 flex items-center justify-center">
                      {isActive ? (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient[0]} ${gradient[1]} rounded-full`}>
                          <Icon className="w-full h-full p-1.5 text-white" strokeWidth={2} />
                        </div>
                      ) : (
                        <Icon className="w-full h-full text-gray-500" strokeWidth={1.5} />
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;