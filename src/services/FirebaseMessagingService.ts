// src/services/FirebaseMessagingService.ts
import { 
  getToken, 
  onMessage, 
  MessagePayload, 
  NotificationPayload 
} from 'firebase/messaging';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { initializeMessaging } from '../firebase/config';
import { NotificationType } from '../types';

// Definizione di un'interfaccia per gli oggetti token
interface FCMToken {
  userId: string;
  token: string;
  device: string;
  createdAt: any;
  lastUsedAt: any;
}

/**
 * Servizio per la gestione di Firebase Cloud Messaging (FCM)
 * per notifiche push anche quando l'app non è attiva
 */
class FirebaseMessagingService {
  private static instance: FirebaseMessagingService;
  private messaging: any = null;
  private isMessagingSupported: boolean = false;
  private tokensCollectionName = 'fcm_tokens';
  private currentToken: string | null = null;
  private isPermissionGranted: boolean = false;
  
  // Costruttore privato (pattern singleton)
  private constructor() {}

  /**
   * Ottiene l'istanza del servizio
   * @returns L'istanza del servizio
   */
  public static getInstance(): FirebaseMessagingService {
    if (!FirebaseMessagingService.instance) {
      FirebaseMessagingService.instance = new FirebaseMessagingService();
    }
    return FirebaseMessagingService.instance;
  }
  
  /**
   * Inizializza il servizio FCM
   * @returns true se l'inizializzazione ha avuto successo, false altrimenti
   */
  public async initialize(): Promise<boolean> {
    try {
      // Inizializza FCM
      this.messaging = await initializeMessaging();
      this.isMessagingSupported = !!this.messaging;
      
      if (!this.isMessagingSupported) {
        console.log('Firebase Cloud Messaging non è supportato in questo browser o ambiente');
        return false;
      }
      
      // Configura la gestione dei messaggi in foreground
      this.setupForegroundMessageHandler();
      
      return true;
    } catch (error) {
      console.error('Errore durante l\'inizializzazione di FCM:', error);
      return false;
    }
  }
  
  /**
   * Richiede il permesso per le notifiche push e registra il token FCM
   * @param userId ID dell'utente corrente
   * @returns true se il token è stato ottenuto e registrato, false altrimenti
   */
  public async requestPermissionAndRegisterToken(userId: string): Promise<boolean> {
    if (!this.isMessagingSupported || !this.messaging) {
      console.log('Firebase Cloud Messaging non è supportato');
      return false;
    }
    
    try {
      // Richiedi il permesso Notification per il browser
      const permission = await Notification.requestPermission();
      this.isPermissionGranted = permission === 'granted';
      
      if (!this.isPermissionGranted) {
        console.log('Permesso notifiche non concesso dall\'utente');
        return false;
      }
      
      // Ottieni il token FCM
      const token = await getToken(this.messaging, {
        vapidKey: 'BFIXkm6BMHBkE3thQmqy2-3rX5U37a2zl6gC5axp6y4oMXFT71hQWBY3HcR12dE3BAnY6YaZRvvHgcDSKGNLKQE' // NOTA: Devi generare una chiave VAPID dal progetto Firebase
      });
      
      if (!token) {
        console.log('Impossibile ottenere il token FCM');
        return false;
      }
      
      // Salva il token
      this.currentToken = token;
      
      // Registra il token in Firestore
      await this.saveTokenToFirestore(userId, token);
      
      return true;
    } catch (error) {
      console.error('Errore durante la richiesta del permesso o la registrazione del token:', error);
      return false;
    }
  }
  
  /**
   * Verifica se le notifiche push sono abilitate
   * @returns true se le notifiche push sono abilitate, false altrimenti
   */
  public arePushNotificationsEnabled(): boolean {
    return this.isMessagingSupported && this.isPermissionGranted && !!this.currentToken;
  }
  
  /**
   * Configura la gestione dei messaggi quando l'app è in foreground
   */
  private setupForegroundMessageHandler(): void {
    if (!this.messaging) return;
    
    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('Messaggio ricevuto in foreground:', payload);
      
      // Mostra una notifica personalizzata quando l'app è aperta
      this.showForegroundNotification(payload);
    });
  }
  
  /**
   * Mostra una notifica quando l'app è in foreground
   * @param payload Il payload del messaggio FCM
   */
  private showForegroundNotification(payload: MessagePayload): void {
    // Recupera i dati dalla notifica
    const notification = payload.notification as NotificationPayload;
    const data = payload.data as any;
    
    // Mostra notifica solo se il browser lo supporta e l'utente ha dato il permesso
    if ('Notification' in window && Notification.permission === 'granted') {
      // Crea la notifica
      const notificationOptions = {
        body: notification?.body || 'Nuova notifica da MyRoutine',
        icon: '/logo192.png',
        badge: '/favicon.ico',
        tag: data?.tag || 'default',
        data: {
          type: data?.type || 'system',
          relatedId: data?.relatedId || null,
          url: data?.url || '/'
        }
      };
      
      // Mostra la notifica
      const notificationInstance = new Notification(notification?.title || 'MyRoutine', notificationOptions);
      
      // Gestione del click sulla notifica
      notificationInstance.onclick = () => {
        window.focus();
        
        // Reindirizza in base al tipo di notifica
        if (data && data.url) {
          window.location.href = data.url;
        }
        
        notificationInstance.close();
      };
    }
  }
  
  /**
   * Salva il token FCM in Firestore
   * @param userId ID dell'utente
   * @param token Token FCM
   */
  private async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      // Verifica se il token esiste già
      const tokensRef = collection(db, this.tokensCollectionName);
      const q = query(tokensRef, 
        where('userId', '==', userId),
        where('token', '==', token)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Il token non esiste, crea un nuovo documento
        const deviceInfo = this.getDeviceInfo();
        
        const tokenData: FCMToken = {
          userId,
          token,
          device: deviceInfo,
          createdAt: serverTimestamp(),
          lastUsedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, this.tokensCollectionName), tokenData);
      } else {
        // Il token esiste, aggiorna solo il timestamp lastUsedAt
        const tokenDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, this.tokensCollectionName, tokenDoc.id), {
          lastUsedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Errore durante il salvataggio del token in Firestore:', error);
      throw error;
    }
  }
  
  /**
   * Ottiene informazioni sul dispositivo corrente
   * @returns Stringa con informazioni sul dispositivo
   */
  private getDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    const pwa = window.matchMedia('(display-mode: standalone)').matches ? 'PWA' : 'Browser';
    
    return `${platform} - ${pwa} - ${screenSize} - ${userAgent}`;
  }
  
  /**
   * Rimuove il token FCM corrente
   * @param userId ID dell'utente
   */
  public async unregisterToken(userId: string): Promise<void> {
    if (!this.currentToken) return;
    
    try {
      // Trova e rimuovi il token dal database
      const tokensRef = collection(db, this.tokensCollectionName);
      const q = query(tokensRef, 
        where('userId', '==', userId),
        where('token', '==', this.currentToken)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Rimuovi tutti i token trovati (dovrebbe essere uno solo)
        const deletePromises = querySnapshot.docs.map(tokenDoc => 
          deleteDoc(doc(db, this.tokensCollectionName, tokenDoc.id))
        );
        
        await Promise.all(deletePromises);
      }
      
      this.currentToken = null;
      this.isPermissionGranted = false;
    } catch (error) {
      console.error('Errore durante la rimozione del token:', error);
      throw error;
    }
  }
  
  /**
   * Invia una notifica push a un utente specifico tramite Cloud Functions
   * Nota: Richiede una Cloud Function configurata sul backend
   * @param userId ID dell'utente destinatario
   * @param title Titolo della notifica
   * @param body Corpo della notifica
   * @param type Tipo di notifica (system, task, counter)
   * @param relatedId ID dell'oggetto correlato
   */
  public async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = 'system',
    relatedId?: string
  ): Promise<void> {
    try {
      // Questa è solo una simulazione: nella realtà, dovresti chiamare una Cloud Function
      // che si occupa di inviare effettivamente le notifiche push
      
      // Crea un documento nella collezione push_notifications_queue
      // che verrà elaborato da una Cloud Function
      const notificationData = {
        userId,
        title,
        body,
        type,
        relatedId,
        timestamp: serverTimestamp(),
        status: 'pending' // La Cloud Function cambierà lo stato in 'sent' o 'failed'
      };
      
      await addDoc(collection(db, 'push_notifications_queue'), notificationData);
      
      console.log('Notifica push accodata per l\'invio:', notificationData);
    } catch (error) {
      console.error('Errore durante l\'invio della notifica push:', error);
      throw error;
    }
  }
}

export default FirebaseMessagingService;