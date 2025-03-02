// src/components/layout/NotificationPopover.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X, Calendar, Repeat, Info, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { 
  formatDistanceToNow, 
  isToday, 
  isYesterday, 
  format
} from 'date-fns';
import { it } from 'date-fns/locale';
import NotificationEntriesService from '../../services/NotificationEntriesService';
import { Notification as NotificationType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { useApp } from '../../context/AppContext';

const NotificationPopover: React.FC = () => {
  const { currentUser } = useAuth();
  const { tasks, counters } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const notificationService = NotificationEntriesService.getInstance();

  // Carica le notifiche
  const loadNotifications = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const recentNotifications = await notificationService.getRecentNotifications(currentUser.uid);
      setNotifications(recentNotifications);
      
      const count = await notificationService.getUnreadCount(currentUser.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Errore durante il caricamento delle notifiche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effetto per caricare le notifiche all'avvio e quando l'utente cambia
  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  // Chiudi il popover quando si clicca al di fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Formatta la data della notifica in modo leggibile
  const formatNotificationDate = (timestamp: any): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    
    if (isToday(date)) {
      return `Oggi, ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Ieri, ${format(date, 'HH:mm')}`;
    } else {
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: it
      });
    }
  };

  // Segna una notifica come letta
  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!currentUser) return;
    
    try {
      await notificationService.markAsRead(notificationId);
      
      // Aggiorna le notifiche locali
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Aggiorna il conteggio non letto
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Errore durante il set di notifica come letta:', error);
    }
  };

  // Segna tutte le notifiche come lette
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await notificationService.markAllAsRead(currentUser.uid);
      
      // Aggiorna le notifiche locali
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Aggiorna il conteggio non letto
      setUnreadCount(0);
    } catch (error) {
      console.error('Errore durante il set di tutte le notifiche come lette:', error);
    }
  };

  // Gestisce il click su una notifica
  const handleNotificationClick = (notification: NotificationType) => {
    // Segna come letta se non lo è già
    if (!notification.read) {
      notificationService.markAsRead(notification.id);
    }
    
    // Naviga alla risorsa correlata in base al tipo di notifica
    if (notification.type === 'task' && notification.relatedId) {
      navigate('/'); // Vai alla home page per vedere il task
    } else if (notification.type === 'counter' && notification.relatedId) {
      navigate('/stats'); // Vai alle statistiche per vedere il contatore
    }
    
    // Chiudi il popover
    setShowNotifications(false);
  };

  // Ottieni l'icona in base al tipo di notifica
  const getNotificationIcon = (notification: NotificationType) => {
    switch (notification.type) {
      case 'task':
        return <Repeat className="h-4 w-4 text-primary-500" />;
      case 'counter':
        return <Calendar className="h-4 w-4 text-secondary-500" />;
      case 'system':
      default:
        return <Info className="h-4 w-4 text-tertiary-500" />;
    }
  };

  return (
    <div className="relative">
      <Button 
        ref={buttonRef}
        variant="glass" 
        size="icon-sm" 
        rounded="full"
        aria-label="Notifiche"
        aria-expanded={showNotifications}
        aria-controls="notifications-popover"
        onClick={() => setShowNotifications(!showNotifications)}
        hasAnimation={true}
        className="relative"
      >
        <Bell className="h-5 w-5 text-primary-500" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 bg-tertiary-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-[10px] font-bold animate-pulse"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>
      
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            id="notifications-popover"
            ref={popoverRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-2 w-[90vw] max-w-[320px] sm:w-80 glass-effect rounded-2xl shadow-card py-2 z-50"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100/50">
              <h2 className="text-sm font-medium text-gray-900">Notifiche</h2>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-7 px-2"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Segna tutte come lette
                </Button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto py-1">
              {isLoading ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  Nessuna notifica da mostrare
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        cursor-pointer mx-2 my-1 p-3 rounded-xl transition-all
                        ${notification.read 
                          ? 'bg-white/30' 
                          : 'bg-white/80 border-l-2 border-primary-500'
                        }
                        hover:bg-white/50
                      `}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <button 
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="text-gray-400 hover:text-primary-500"
                                aria-label="Segna come letta"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400">
                              {formatNotificationDate(notification.timestamp)}
                            </span>
                            {notification.relatedId && (
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPopover;