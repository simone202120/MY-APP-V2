// src/services/NotificationEntriesService.ts
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Notification, NotificationType } from '../types';

/**
 * Servizio per gestire le notifiche in-app dell'applicazione
 * Implementa il pattern singleton
 */
class NotificationEntriesService {
  private static instance: NotificationEntriesService;
  private collectionName = 'notifications';
  
  private constructor() {
    // Singleton pattern
  }

  /**
   * Ottiene l'istanza del servizio NotificationEntriesService
   * @returns {NotificationEntriesService} L'istanza del servizio
   */
  public static getInstance(): NotificationEntriesService {
    if (!NotificationEntriesService.instance) {
      NotificationEntriesService.instance = new NotificationEntriesService();
    }
    return NotificationEntriesService.instance;
  }

  /**
   * Crea una nuova notifica
   * @param {string} userId - ID dell'utente
   * @param {string} title - Titolo della notifica
   * @param {string} message - Messaggio della notifica
   * @param {NotificationType} type - Tipo di notifica
   * @param {string} relatedId - ID dell'oggetto correlato (opzionale)
   * @returns {Promise<string>} L'ID della notifica creata
   */
  public async createNotification(
    userId: string, 
    title: string, 
    message: string, 
    type: NotificationType, 
    relatedId?: string
  ): Promise<string> {
    try {
      const notificationData = {
        userId,
        title,
        message,
        timestamp: Timestamp.now(),
        read: false,
        type,
        relatedId
      };
      
      const docRef = await addDoc(collection(db, this.collectionName), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Errore durante la creazione della notifica:', error);
      throw error;
    }
  }
  
  /**
   * Crea una notifica con un timestamp personalizzato
   * Utile per generare notifiche di test con date diverse
   * @param {string} userId - ID dell'utente
   * @param {string} title - Titolo della notifica
   * @param {string} message - Messaggio della notifica
   * @param {NotificationType} type - Tipo di notifica
   * @param {Timestamp} timestamp - Timestamp personalizzato
   * @param {boolean} read - Se la notifica è già stata letta
   * @param {string} relatedId - ID dell'oggetto correlato (opzionale)
   * @returns {Promise<string>} L'ID della notifica creata
   */
  public async createNotificationWithCustomTimestamp(
    userId: string, 
    title: string, 
    message: string, 
    type: NotificationType,
    timestamp: Timestamp,
    read: boolean = false,
    relatedId?: string
  ): Promise<string> {
    try {
      const notificationData = {
        userId,
        title,
        message,
        timestamp,
        read,
        type,
        relatedId
      };
      
      const docRef = await addDoc(collection(db, this.collectionName), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Errore durante la creazione della notifica con timestamp personalizzato:', error);
      throw error;
    }
  }

  /**
   * Crea una notifica di sistema
   * @param {string} userId - ID dell'utente
   * @param {string} title - Titolo della notifica
   * @param {string} message - Messaggio della notifica
   * @returns {Promise<string>} L'ID della notifica creata
   */
  public async createSystemNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<string> {
    return this.createNotification(userId, title, message, 'system', '');
  }

  /**
   * Crea una notifica relativa a un task
   * @param {string} userId - ID dell'utente
   * @param {string} title - Titolo della notifica
   * @param {string} message - Messaggio della notifica
   * @param {string} taskId - ID del task correlato
   * @returns {Promise<string>} L'ID della notifica creata
   */
  public async createTaskNotification(
    userId: string,
    title: string,
    message: string,
    taskId: string
  ): Promise<string> {
    return this.createNotification(userId, title, message, 'task', taskId);
  }

  /**
   * Crea una notifica relativa a un contatore
   * @param {string} userId - ID dell'utente
   * @param {string} title - Titolo della notifica
   * @param {string} message - Messaggio della notifica
   * @param {string} counterId - ID del contatore correlato
   * @returns {Promise<string>} L'ID della notifica creata
   */
  public async createCounterNotification(
    userId: string,
    title: string,
    message: string,
    counterId: string
  ): Promise<string> {
    return this.createNotification(userId, title, message, 'counter', counterId);
  }

  /**
   * Ottiene tutte le notifiche di un utente
   * @param {string} userId - ID dell'utente
   * @returns {Promise<Notification[]>} Array di notifiche dell'utente
   */
  public async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      console.error('Errore durante il recupero delle notifiche:', error);
      throw error;
    }
  }

  /**
   * Ottiene le notifiche non lette di un utente
   * @param {string} userId - ID dell'utente
   * @returns {Promise<Notification[]>} Array di notifiche non lette
   */
  public async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      console.error('Errore durante il recupero delle notifiche non lette:', error);
      throw error;
    }
  }

  /**
   * Ottiene il conteggio delle notifiche non lette di un utente
   * @param {string} userId - ID dell'utente
   * @returns {Promise<number>} Numero di notifiche non lette
   */
  public async getUnreadCount(userId: string): Promise<number> {
    try {
      const unreadNotifications = await this.getUnreadNotifications(userId);
      return unreadNotifications.length;
    } catch (error) {
      console.error('Errore durante il conteggio delle notifiche non lette:', error);
      throw error;
    }
  }

  /**
   * Ottiene le ultime N notifiche di un utente
   * @param {string} userId - ID dell'utente
   * @param {number} count - Numero di notifiche da recuperare
   * @returns {Promise<Notification[]>} Array delle ultime N notifiche
   */
  public async getRecentNotifications(userId: string, count: number = 10): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(count)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      console.error('Errore durante il recupero delle notifiche recenti:', error);
      throw error;
    }
  }

  /**
   * Marca una notifica come letta
   * @param {string} notificationId - ID della notifica
   * @returns {Promise<void>}
   */
  public async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Errore durante l\'aggiornamento della notifica:', error);
      throw error;
    }
  }

  /**
   * Marca tutte le notifiche di un utente come lette
   * @param {string} userId - ID dell'utente
   * @returns {Promise<void>}
   */
  public async markAllAsRead(userId: string): Promise<void> {
    try {
      const unreadNotifications = await this.getUnreadNotifications(userId);
      
      // Aggiorna ogni notifica non letta a letta
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, this.collectionName, notification.id), { read: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento di tutte le notifiche:', error);
      throw error;
    }
  }

  /**
   * Elimina una notifica
   * @param {string} notificationId - ID della notifica da eliminare
   * @returns {Promise<void>}
   */
  public async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, notificationId));
    } catch (error) {
      console.error('Errore durante l\'eliminazione della notifica:', error);
      throw error;
    }
  }

  /**
   * Elimina tutte le notifiche di un utente
   * @param {string} userId - ID dell'utente
   * @returns {Promise<void>}
   */
  public async deleteAllUserNotifications(userId: string): Promise<void> {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      
      // Elimina ogni notifica dell'utente
      const deletePromises = userNotifications.map(notification => 
        deleteDoc(doc(db, this.collectionName, notification.id))
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Errore durante l\'eliminazione di tutte le notifiche:', error);
      throw error;
    }
  }

  /**
   * Elimina le notifiche più vecchie di un certo numero di giorni
   * @param {string} userId - ID dell'utente
   * @param {number} days - Numero di giorni dopo i quali eliminare le notifiche
   * @returns {Promise<number>} Il numero di notifiche eliminate
   */
  public async deleteOldNotifications(userId: string, days: number = 30): Promise<number> {
    try {
      const userNotifications = await this.getUserNotifications(userId);
      const now = new Date();
      const cutoffDate = new Date(now.setDate(now.getDate() - days));
      
      // Filtra le notifiche più vecchie del cutoff
      const oldNotifications = userNotifications.filter(notification => {
        const notificationDate = notification.timestamp.toDate();
        return notificationDate < cutoffDate;
      });
      
      // Elimina le notifiche vecchie
      const deletePromises = oldNotifications.map(notification => 
        deleteDoc(doc(db, this.collectionName, notification.id))
      );
      
      await Promise.all(deletePromises);
      return oldNotifications.length;
    } catch (error) {
      console.error('Errore durante l\'eliminazione delle notifiche vecchie:', error);
      throw error;
    }
  }
}

export default NotificationEntriesService;