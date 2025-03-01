// components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, Moon } from 'lucide-react';
import { Button } from "../ui/button";
import { useAuth } from '../../context/AuthContext';

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
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect backdrop-blur-md">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between h-16">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary-400 rounded-lg animate-float opacity-50 blur-sm"></div>
              <Moon className="h-5 w-5 text-primary-600 relative z-10" />
            </div>
            <h1 className="text-xl font-display font-semibold text-gray-900 select-none">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">My</span>
              <span>Routine</span>
            </h1>
          </button>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="glass" 
              size="icon-sm" 
              rounded="full"
              aria-label="Notifiche"
              className="relative"
              hasAnimation={true}
            >
              <Bell className="h-5 w-5 text-primary-500" />
              <span className="absolute -top-1 -right-1 bg-tertiary-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
                2
              </span>
            </Button>
            
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
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  )}
                </Button>
                
                {showUserMenu && (
                  <div 
                    id="user-menu"
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-60 glass-effect rounded-2xl shadow-card py-2 z-10 animate-in fade-in-50 duration-200"
                  >
                    <div className="px-4 py-3 border-b border-gray-100/50">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.displayName || 'Utente'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 transition-colors rounded-lg mx-1"
                        onClick={() => {
                          navigate('/settings');
                          setShowUserMenu(false);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2 text-primary-500" />
                        Impostazioni
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-2.5 text-sm text-tertiary-600 hover:bg-tertiary-50/50 transition-colors rounded-lg mx-1"
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2 text-tertiary-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;