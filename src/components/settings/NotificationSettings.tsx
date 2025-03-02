// src/components/settings/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Bell, Trash, Smartphone, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import NotificationEntriesService from '../../services/NotificationEntriesService';
import NotificationService from '../../services/NotificationService'; 
import FirebaseMessagingService from '../../services/FirebaseMessagingService';
import { motion } from 'framer-motion';

const NotificationSettings: React.FC = () => {
  const { currentUser, isPushNotificationsEnabled, enablePushNotifications, disablePushNotifications } = useAuth();
  const { createSystemNotification } = useApp();
  const [enableInAppNotifications, setEnableInAppNotifications] = useState(true);
  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState(false);
  const [deleteAfterDays, setDeleteAfterDays] = useState(30);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasBrowserPermission, setHasBrowserPermission] = useState(false);
  const [isClearingNotifications, setIsClearingNotifications] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(false);
  
  const notificationEntriesService = NotificationEntriesService.getInstance();
  const browserNotificationService = NotificationService.getInstance();
  const fcmService = FirebaseMessagingService.getInstance();

  // Verifica il supporto per le notifiche push e lo stato delle notifiche browser all'avvio
  useEffect(() => {
    const checkNotificationsSupport = async () => {
      // Verifica il supporto per FCM
      const fcmInitialized = await fcmService.initialize();
      setPushNotificationsSupported(fcmInitialized);
      
      // Verifica le notifiche browser tradizionali
      const hasPermission = await browserNotificationService.areNotificationsEnabled();
      setEnableBrowserNotifications(hasPermission);
      setHasBrowserPermission(hasPermission);
    };
    
    checkNotificationsSupport();
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
  
  // Gestisce il cambio di stato per le notifiche push FCM
  const handlePushNotificationsChange = async (checked: boolean) => {
    if (!currentUser) return;
    
    if (checked) {
      setIsEnablingPush(true);
      try {
        const enabled = await enablePushNotifications();
        if (enabled) {
          // Invia una notifica di test per FCM (simulata, la reale implementazione
          // richiederebbe una Cloud Function)
          await fcmService.sendPushNotification(
            currentUser.uid,
            'Notifiche push abilitate',
            'Le notifiche push sono state abilitate con successo. Riceverai notifiche anche quando l\'app non è aperta.',
            'system'
          );
          
          // Invia anche una notifica in-app come conferma
          await createSystemNotification(
            'Notifiche push abilitate',
            'Le notifiche push sono state abilitate con successo'
          );
        }
      } catch (error) {
        console.error('Errore durante l\'abilitazione delle notifiche push:', error);
      } finally {
        setIsEnablingPush(false);
      }
    } else {
      try {
        await disablePushNotifications();
        // Invia una notifica in-app come conferma
        await createSystemNotification(
          'Notifiche push disabilitate',
          'Le notifiche push sono state disabilitate'
        );
      } catch (error) {
        console.error('Errore durante la disabilitazione delle notifiche push:', error);
      }
    }
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
    
    // Notifica push FCM
    if (isPushNotificationsEnabled) {
      await fcmService.sendPushNotification(
        currentUser.uid,
        'Notifica push di test',
        'Questa è una notifica push di test tramite Firebase Cloud Messaging',
        'system'
      );
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
                <p className="text-sm text-gray-500">Ricevi notifiche quando il browser è aperto</p>
              </div>
              <Switch 
                checked={enableBrowserNotifications}
                onCheckedChange={handleBrowserNotificationsChange}
                disabled={!("Notification" in window)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium">Notifiche push</h3>
                  {!pushNotificationsSupported && (
                    <div className="tooltip" data-tip="Le notifiche push non sono supportate in questo browser o dispositivo">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Ricevi notifiche anche quando l'app non è aperta
                  {!pushNotificationsSupported && (
                    <span className="text-amber-500 block mt-1">
                      Non supportate in questo browser/dispositivo
                    </span>
                  )}
                </p>
              </div>
              <Switch 
                checked={isPushNotificationsEnabled}
                onCheckedChange={handlePushNotificationsChange}
                disabled={!pushNotificationsSupported || isEnablingPush}
              />
            </div>
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sendTestNotification}
                disabled={!enableInAppNotifications && !enableBrowserNotifications && !isPushNotificationsEnabled}
              >
                Invia notifica di test
              </Button>
            </div>
          </div>
          
          {isPushNotificationsEnabled && (
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <div className="flex gap-3">
                <Smartphone className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-primary-700">Notifiche push attive</h4>
                  <p className="text-xs text-primary-600 mt-1">
                    Riceverai notifiche anche quando l'app non è aperta nel browser. Per disabilitarle, disattiva l'interruttore sopra.
                  </p>
                </div>
              </div>
            </div>
          )}
          
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