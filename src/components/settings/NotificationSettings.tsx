// src/components/settings/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Bell, Trash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import NotificationEntriesService from '../../services/NotificationEntriesService';
import NotificationService from '../../services/NotificationService'; 
import { motion } from 'framer-motion';

const NotificationSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const { createSystemNotification } = useApp();
  const [enableInAppNotifications, setEnableInAppNotifications] = useState(true);
  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState(false);
  const [deleteAfterDays, setDeleteAfterDays] = useState(30);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasBrowserPermission, setHasBrowserPermission] = useState(false);
  const [isClearingNotifications, setIsClearingNotifications] = useState(false);
  
  const notificationEntriesService = NotificationEntriesService.getInstance();
  const browserNotificationService = NotificationService.getInstance();

  // Verifica lo stato delle notifiche browser all'avvio
  useEffect(() => {
    const checkBrowserPermission = async () => {
      const hasPermission = await browserNotificationService.areNotificationsEnabled();
      setEnableBrowserNotifications(hasPermission);
      setHasBrowserPermission(hasPermission);
    };
    
    checkBrowserPermission();
  }, []);

  // Carica le impostazioni utente da Firestore (da implementare)
  useEffect(() => {
    // TODO: carica le impostazioni utente
  }, [currentUser]);

  // Gestisce il cambio di stato per le notifiche in-app
  const handleInAppNotificationsChange = async (checked: boolean) => {
    setEnableInAppNotifications(checked);
    
    // TODO: salva l'impostazione in Firestore
    
    if (checked) {
      // Invia una notifica di test
      await createSystemNotification(
        'Notifiche abilitate',
        'Le notifiche in-app sono state abilitate con successo'
      );
    }
  };

  // Gestisce il cambio di stato per le notifiche del browser
  const handleBrowserNotificationsChange = async (checked: boolean) => {
    if (checked) {
      const permission = await browserNotificationService.requestPermission();
      setHasBrowserPermission(permission);
      setEnableBrowserNotifications(permission);
      
      if (permission) {
        // Invia una notifica di test
        new Notification('Notifiche abilitate', {
          body: 'Le notifiche del browser sono state abilitate con successo',
          icon: '/logo.svg'
        });
      }
    } else {
      setEnableBrowserNotifications(false);
    }
    
    // TODO: salva l'impostazione in Firestore
  };

  // Gestisce il cambio del periodo di conservazione delle notifiche
  const handleDeleteAfterDaysChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDeleteAfterDays(Number(event.target.value));
    // TODO: salva l'impostazione in Firestore
  };

  // Elimina le notifiche vecchie
  const handleDeleteOldNotifications = async () => {
    if (!currentUser) return;
    
    setIsDeleting(true);
    try {
      const deletedCount = await notificationEntriesService.deleteOldNotifications(
        currentUser.uid, 
        deleteAfterDays
      );
      
      // Notifica l'utente della cancellazione
      await createSystemNotification(
        'Notifiche eliminate',
        `Sono state eliminate ${deletedCount} notifiche vecchie`
      );
    } catch (error) {
      console.error('Errore durante l\'eliminazione delle notifiche vecchie:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Elimina tutte le notifiche
  const handleClearAllNotifications = async () => {
    if (!currentUser) return;
    
    setIsClearingNotifications(true);
    try {
      await notificationEntriesService.deleteAllUserNotifications(currentUser.uid);
      
      // Notifica l'utente della cancellazione
      await createSystemNotification(
        'Notifiche eliminate',
        'Tutte le notifiche sono state eliminate'
      );
    } catch (error) {
      console.error('Errore durante l\'eliminazione di tutte le notifiche:', error);
    } finally {
      setIsClearingNotifications(false);
    }
  };

  // Invia una notifica di test
  const sendTestNotification = async () => {
    if (!currentUser) return;
    
    // Notifica in-app
    if (enableInAppNotifications) {
      await createSystemNotification(
        'Notifica di test',
        'Questa è una notifica di test in-app'
      );
    }
    
    // Notifica del browser
    if (enableBrowserNotifications && hasBrowserPermission) {
      new Notification('Notifica di test', {
        body: 'Questa è una notifica di test del browser',
        icon: '/logo.svg'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-500" />
            Impostazioni notifiche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Notifiche in-app</h3>
                <p className="text-sm text-gray-500">Ricevi notifiche all'interno dell'applicazione</p>
              </div>
              <Switch 
                checked={enableInAppNotifications}
                onCheckedChange={handleInAppNotificationsChange}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Notifiche browser</h3>
                <p className="text-sm text-gray-500">Ricevi notifiche anche quando l'app non è aperta</p>
              </div>
              <Switch 
                checked={enableBrowserNotifications}
                onCheckedChange={handleBrowserNotificationsChange}
                disabled={!("Notification" in window)}
              />
            </div>
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sendTestNotification}
                disabled={!enableInAppNotifications && !enableBrowserNotifications}
              >
                Invia notifica di test
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-medium mb-3">Gestione notifiche</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="deleteAfter" className="text-sm text-gray-600 block">
                  Elimina notifiche vecchie dopo:
                </label>
                <select
                  id="deleteAfter"
                  value={deleteAfterDays}
                  onChange={handleDeleteAfterDaysChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value={7}>7 giorni</option>
                  <option value={14}>14 giorni</option>
                  <option value={30}>30 giorni</option>
                  <option value={60}>60 giorni</option>
                  <option value={90}>90 giorni</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline"
                  size="default"
                  onClick={handleDeleteOldNotifications}
                  isLoading={isDeleting}
                  leftIcon={<Trash className="h-4 w-4" />}
                >
                  Elimina notifiche vecchie
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <Button
                variant="destructive"
                size="default"
                onClick={handleClearAllNotifications}
                isLoading={isClearingNotifications}
              >
                Elimina tutte le notifiche
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationSettings;