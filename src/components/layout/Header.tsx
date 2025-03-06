// components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Moon, Sparkles } from 'lucide-react';
import { Button } from "../ui/button";
import { useAuth } from '../../context/AuthContext';
import NotificationPopover from './NotificationPopover';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  return (
    <motion.header 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect shadow-sm"
    >
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 focus:outline-none group"
          >
            <div className="relative w-9 h-9 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-accent opacity-80 rounded-xl"></div>
              <div className="absolute inset-0 bg-gradient-accent opacity-50 blur-sm rounded-xl group-hover:scale-110 transition-transform duration-500"></div>
              <Sparkles className="h-5 w-5 text-white relative z-10" />
            </div>
            <h1 className="text-xl font-display font-semibold text-gray-900 select-none ml-1">
              <span className="gradient-text font-bold">My</span>
              <span>Routine</span>
            </h1>
          </button>
          
          <div className="flex items-center space-x-3">
            <NotificationPopover />
            
            {currentUser && (
              <div className="relative">
                <Button 
                  ref={buttonRef}
                  variant="glass" 
                  size="icon-sm" 
                  rounded="full"
                  aria-label="Profilo utente"
                  aria-expanded={showUserMenu}
                  aria-controls="user-menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  hasAnimation={true}
                  className="shadow-sm hover:shadow-md"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-accent flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </Button>
                
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      id="user-menu"
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-64 card card-glass rounded-xl shadow-card-hover py-2 z-10"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 py-3 border-b border-gray-100/50">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {currentUser.displayName || 'Utente'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                      <div className="py-2 px-1">
                        <button
                          className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-primary-50/70 transition-colors rounded-lg mx-1"
                          onClick={() => {
                            navigate('/settings');
                            setShowUserMenu(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <Settings className="h-4 w-4 text-primary-600" />
                          </div>
                          Impostazioni
                        </button>
                        <button
                          className="flex items-center w-full text-left px-4 py-3 text-sm text-tertiary-600 hover:bg-tertiary-50/70 transition-colors rounded-lg mx-1"
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-tertiary-50 flex items-center justify-center mr-3">
                            <LogOut className="h-4 w-4 text-tertiary-600" />
                          </div>
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;