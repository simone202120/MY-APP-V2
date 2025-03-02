// src/services/NotificationManager.ts
import { Task, NotificationType } from '../types';
import { format } from 'date-fns';

/**
 * Sistema di gestione delle notifiche personalizzato che utilizza l'API Web Push
 * per inviare notifiche anche quando l'app è chiusa
 */
class NotificationManager {
  private static instance: NotificationManager;
  private isNotificationsSupported: boolean = false;
  private isPermissionGranted: boolean = false;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private applicationServerKey: string = 'BFIXkm6BMHBkE3thQmqy2-3rX5U37a2zl6gC5axp6y4oMXFT71hQWBY3HcR12dE3BAnY6YaZRvvHgcDSKGNLKQE'; // Sostituire con una vera chiave VAPID
  private pushSubscription: PushSubscription | null = null;
  private tasks: Task[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  private constructor() {
    // Verifica se le notifiche sono supportate
    this.isNotificationsSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    
    // Inizializza il service worker
    this.initializeServiceWorker();
    
    // Controlla lo stato del permesso
    if (this.isNotificationsSupported) {
      this.isPermissionGranted = Notification.permission === 'granted';
    }
  }
  
  /**
   * Ottiene l'istanza singleton del NotificationManager
   */
  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  /**
   * Inizializza il service worker per le notifiche
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!this.isNotificationsSupported) return;
    
    try {
      // Ottieni la registrazione del service worker
      this.swRegistration = await navigator.serviceWorker.ready;
      
      // Verifica se esiste già una sottoscrizione push
      this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
      
      // Configura la gestione dei messaggi dal service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
      
      console.log('Service worker inizializzato per le notifiche push');
    } catch (error) {
      console.error('Errore durante l\'inizializzazione del service worker:', error);
    }
  }
  
  /**
   * Verifica se le notifiche push sono supportate
   */
  public areNotificationsSupported(): boolean {
    return this.isNotificationsSupported;
  }
  
  /**
   * Verifica se il permesso per le notifiche è stato concesso
   */
  public isNotificationPermissionGranted(): boolean {
    return this.isPermissionGranted;
  }
  
  /**
   * Richiede il permesso per le notifiche
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isNotificationsSupported) {
      console.log('Le notifiche non sono supportate su questo browser/dispositivo');
      return false;
    }
    
    try {
      const permission = await Notification.permission;
      
      if (permission === 'granted') {
        this.isPermissionGranted = true;
        return true;
      }
      
      if (permission === 'default') {
        const result = await Notification.requestPermission();
        this.isPermissionGranted = result === 'granted';
        return this.isPermissionGranted;
      }
      
      return false;
    } catch (error) {
      console.error('Errore durante la richiesta del permesso per le notifiche:', error);
      return false;
    }
  }
  
  /**
   * Sottoscrive l'utente alle notifiche push
   */
  public async subscribeToPushNotifications(userId: string): Promise<boolean> {
    if (!this.isNotificationsSupported || !this.swRegistration) {
      return false;
    }
    
    try {
      // Richiedi il permesso se non è già stato concesso
      if (!this.isPermissionGranted) {
        const granted = await this.requestPermission();
        if (!granted) return false;
      }
      
      // Se esiste già una sottoscrizione, usala
      if (this.pushSubscription) {
        return true;
      }
      
      // Crea una nuova sottoscrizione
      this.pushSubscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.applicationServerKey)
      });
      
      // Salva la sottoscrizione sul server (questo è solo un esempio)
      const success = await this.saveSubscriptionToServer(userId, this.pushSubscription);
      
      return success;
    } catch (error) {
      console.error('Errore durante la sottoscrizione alle notifiche push:', error);
      return false;
    }
  }
  
  /**
   * Disiscrive l'utente dalle notifiche push
   */
  public async unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
    if (!this.pushSubscription) {
      return true; // Già non sottoscritto
    }
    
    try {
      // Cancella la sottoscrizione
      const success = await this.pushSubscription.unsubscribe();
      
      if (success) {
        // Rimuovi la sottoscrizione dal server
        await this.deleteSubscriptionFromServer(userId, this.pushSubscription);
        this.pushSubscription = null;
      }
      
      return success;
    } catch (error) {
      console.error('Errore durante la disiscrizione dalle notifiche push:', error);
      return false;
    }
  }
  
  /**
   * Salva la sottoscrizione push sul server
   * In un'app reale, questo invierebbe la sottoscrizione a un server backend
   */
  private async saveSubscriptionToServer(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      // Log limitato per evitare di mostrare l'intera sottoscrizione
      console.log(`Salvataggio sottoscrizione push per l'utente ${userId}`, {
        endpoint: subscription.endpoint.substring(0, 50) + '...'
      });
      
      // Invia la sottoscrizione al server push
      const response = await fetch('http://localhost:5000/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription })
      });
      
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }
      
      console.log(`Sottoscrizione push per l'utente ${userId} salvata con successo`);
      return true;
    } catch (error) {
      console.error('Errore durante il salvataggio della sottoscrizione sul server:', error);
      return false;
    }
  }
  
  /**
   * Elimina la sottoscrizione push dal server
   */
  private async deleteSubscriptionFromServer(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      console.log(`Eliminazione sottoscrizione push per l'utente ${userId}`);
      
      // Elimina la sottoscrizione dal server push
      const response = await fetch('http://localhost:5000/api/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }
      
      console.log(`Sottoscrizione push per l'utente ${userId} eliminata con successo`);
      return true;
    } catch (error) {
      console.error('Errore durante l\'eliminazione della sottoscrizione dal server:', error);
      return false;
    }
  }
  
  /**
   * Invia una notifica locale (quando l'app è aperta)
   */
  public async showLocalNotification(
    title: string,
    body: string,
    data: any = {},
    actions: NotificationAction[] = []
  ): Promise<boolean> {
    if (!this.isNotificationsSupported || !this.isPermissionGranted || !this.swRegistration) {
      return false;
    }
    
    try {
      // Opzioni della notifica
      const options: NotificationOptions = {
        body,
        icon: '/logo192.png',
        badge: '/favicon.ico',
        tag: data.tag || 'default',
        data: data || {},
        vibrate: [100, 50, 100],
        actions: actions,
        requireInteraction: true
      };
      
      // Mostra la notifica
      await this.swRegistration.showNotification(title, options);
      return true;
    } catch (error) {
      console.error('Errore durante la visualizzazione della notifica locale:', error);
      return false;
    }
  }
  
  /**
   * Simula l'invio di una notifica push al server
   * In un'app reale, questo invierebbe la richiesta a un server backend
   */
  public async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = 'system',
    relatedId?: string,
    actions: NotificationAction[] = []
  ): Promise<boolean> {
    try {
      console.log('Invio notifica push:', { userId, title, body, type });
      
      // Dati aggiuntivi per la notifica
      const data = {
        type,
        relatedId,
        userId,
        tag: `${type}-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      
      // Se l'app è aperta, mostra una notifica locale
      if (document.visibilityState === 'visible' && this.swRegistration) {
        await this.showLocalNotification(title, body, data, actions);
        return true;
      }
      
      // Altrimenti, invia una richiesta al server per inviare una notifica push
      const response = await fetch('http://localhost:5000/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          body,
          data,
          actions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Se la sottoscrizione non è stata trovata, ma abbiamo il permesso, 
        // proviamo a creare una nuova sottoscrizione
        if (response.status === 404 && this.isPermissionGranted && this.swRegistration) {
          console.log('Sottoscrizione non trovata, provo a crearne una nuova...');
          
          // Crea una nuova sottoscrizione
          await this.subscribeToPushNotifications(userId);
          
          // Riprova a inviare la notifica
          return this.sendPushNotification(userId, title, body, type, relatedId, actions);
        }
        
        throw new Error(`Errore HTTP: ${response.status}, ${errorData.error || 'Errore sconosciuto'}`);
      }
      
      console.log(`Notifica push inviata con successo all'utente ${userId}`);
      return true;
    } catch (error) {
      console.error('Errore durante l\'invio della notifica push:', error);
      
      // Se c'è stato un errore ma l'app è aperta, ripieghiamo su una notifica locale
      if (document.visibilityState === 'visible' && this.swRegistration) {
        try {
          const data = { type, relatedId, userId };
          await this.showLocalNotification(title, body, data, actions);
          return true;
        } catch (localError) {
          console.error('Anche la notifica locale è fallita:', localError);
        }
      }
      
      return false;
    }
  }
  
  /**
   * Aggiungi la gestione dei task per le notifiche
   */
  public updateTasks(tasks: Task[]): void {
    // Cancella tutti i timer esistenti
    this.clearAllNotifications();
    
    // Memorizza i nuovi task
    this.tasks = tasks;
    
    // Non procedere se le notifiche non sono attivate
    if (!this.isNotificationsSupported || !this.isPermissionGranted) return;
    
    // Imposta nuovi timer per i task che richiedono notifiche
    const now = new Date();
    
    tasks.forEach(task => {
      // Non pianificare notifiche se il task non ha notifiche
      if (!task.notifyBefore) return;
      
      // Non pianificare per task completati
      if (task.type === 'oneTime' && task.isCompleted) return;
      
      // Pianifica la notifica
      if (task.type === 'oneTime') {
        this.scheduleOneTimeTaskNotification(task);
      } else if (task.type === 'routine') {
        this.scheduleRoutineTaskNotification(task);
      }
    });
  }
  
  /**
   * Pianifica una notifica per un task singolo
   */
  private scheduleOneTimeTaskNotification(task: Task): void {
    if (!task.date || !task.time) return;
    
    const taskDateTime = new Date(`${task.date}T${task.time}`);
    const notificationTime = this.calculateNotificationTime(taskDateTime, task);
    
    const now = new Date();
    if (notificationTime <= now) return; // Non programmare notifiche nel passato
    
    const timeToNotification = notificationTime.getTime() - now.getTime();
    
    const timerId = setTimeout(() => {
      this.sendTaskNotification(task);
    }, timeToNotification);
    
    this.timers.set(task.id, timerId);
  }
  
  /**
   * Pianifica notifiche per un task ricorrente
   */
  private scheduleRoutineTaskNotification(task: Task): void {
    // Implementazione semplificata - nella versione completa dovresti gestire
    // le diverse regole di ricorrenza come nel NotificationService originale
    
    if (!task.time) return;
    
    // Per semplicità, pianifichiamo solo per la prossima occorrenza
    const nextOccurrence = this.getNextOccurrenceDate(task);
    if (!nextOccurrence) return;
    
    // Imposta l'ora
    const [hours, minutes] = task.time.split(':').map(Number);
    nextOccurrence.setHours(hours, minutes, 0, 0);
    
    // Calcola quando inviare la notifica
    const notificationTime = this.calculateNotificationTime(nextOccurrence, task);
    
    const now = new Date();
    if (notificationTime <= now) return; // Non programmare notifiche nel passato
    
    const timeToNotification = notificationTime.getTime() - now.getTime();
    
    const timerId = setTimeout(() => {
      this.sendTaskNotification(task);
      // Pianifica la prossima notifica dopo aver inviato questa
      this.scheduleRoutineTaskNotification(task);
    }, timeToNotification);
    
    this.timers.set(`${task.id}_${nextOccurrence.toISOString()}`, timerId);
  }
  
  /**
   * Calcola quando inviare la notifica in base alle preferenze del task
   */
  private calculateNotificationTime(taskDateTime: Date, task: Task): Date {
    const defaultAdvanceMinutes = 10; // Default: 10 minuti prima
    let advanceTime = defaultAdvanceMinutes * 60 * 1000;
    
    if (task.notifyInAdvance && task.notifyInAdvance > 0) {
      if (task.notifyTimeUnit === 'hours') {
        advanceTime = task.notifyInAdvance * 60 * 60 * 1000; // Ore in millisecondi
      } else {
        advanceTime = task.notifyInAdvance * 60 * 1000; // Minuti in millisecondi
      }
    }
    
    return new Date(taskDateTime.getTime() - advanceTime);
  }
  
  /**
   * Ottiene la data della prossima occorrenza di un task ricorrente
   * Nota: questa è una versione semplificata
   */
  private getNextOccurrenceDate(task: Task): Date | null {
    // Per una versione completa, implementa la logica dal NotificationService originale
    // Questa è una versione semplificata che ritorna domani come esempio
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  /**
   * Invia una notifica per un task
   */
  private async sendTaskNotification(task: Task): Promise<void> {
    if (!this.isNotificationsSupported || !this.isPermissionGranted) return;
    
    // Verifica se il task è già stato completato
    if (task.type === 'oneTime' && task.isCompleted) return;
    if (task.type === 'routine') {
      const today = format(new Date(), 'yyyy-MM-dd');
      if (task.completedDates?.includes(today)) return;
    }
    
    // Crea le azioni per la notifica
    const actions: NotificationAction[] = [
      {
        action: 'complete-task',
        title: 'Completato',
        icon: '/action-icons/check.png'
      },
      {
        action: 'snooze',
        title: 'Posticipa 15m',
        icon: '/action-icons/snooze.png'
      }
    ];
    
    // Aggiungi azione per feedback se il task supporta questa opzione
    if (task.collectFeedback) {
      actions.push(
        {
          action: 'feedback-good',
          title: '😊',
          icon: '/action-icons/good.png'
        },
        {
          action: 'feedback-neutral',
          title: '😐',
          icon: '/action-icons/neutral.png'
        },
        {
          action: 'feedback-bad',
          title: '😞',
          icon: '/action-icons/bad.png'
        }
      );
    }
    
    // Crea il titolo e il corpo della notifica
    let title = 'Promemoria';
    let body = task.title;
    
    if (task.notifyInAdvance && task.notifyInAdvance > 0) {
      if (task.notifyTimeUnit === 'hours') {
        if (task.notifyInAdvance === 1) {
          title = 'Promemoria (tra 1 ora)';
        } else {
          title = `Promemoria (tra ${task.notifyInAdvance} ore)`;
        }
      } else {
        if (task.notifyInAdvance === 1) {
          title = 'Promemoria (tra 1 minuto)';
        } else {
          title = `Promemoria (tra ${task.notifyInAdvance} minuti)`;
        }
      }
    }
    
    // Dati aggiuntivi per la notifica
    const notificationData = {
      type: 'task' as NotificationType,
      taskId: task.id,
      relatedId: task.id,
      date: format(new Date(), 'yyyy-MM-dd'),
      tag: `task-${task.id}-${new Date().toISOString().split('T')[0]}`
    };
    
    // Invia la notifica
    await this.sendPushNotification(
      'current-user', // Sostituire con l'ID dell'utente attuale
      title,
      body,
      'task',
      task.id,
      actions
    );
  }
  
  /**
   * Gestisce i messaggi in arrivo dal service worker
   */
  private handleServiceWorkerMessage = (event: MessageEvent) => {
    console.log('Messaggio ricevuto dal service worker:', event.data);
    
    // Gestisci le azioni dalle notifiche
    const data = event.data;
    
    if (data.action === 'complete-task' && data.taskId) {
      // Completa il task
      console.log('Completamento task richiesto:', data.taskId);
      // Qui dovresti chiamare la funzione per completare il task
      // Ad esempio: this.completeTask(data.taskId);
    }
    
    if (data.action === 'snooze-task' && data.taskId) {
      // Posticipa il task
      console.log('Posticipare il task richiesto:', data.taskId, 'per', data.minutes, 'minuti');
      // Qui dovresti chiamare la funzione per posticipare il task
    }
    
    if (data.action === 'feedback' && data.taskId) {
      // Salva il feedback
      console.log('Feedback ricevuto per il task:', data.taskId, 'valore:', data.feedback);
      // Qui dovresti chiamare la funzione per salvare il feedback
    }
  };
  
  /**
   * Cancella tutti i timer delle notifiche
   */
  public clearAllNotifications(): void {
    this.timers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.timers.clear();
  }
  
  /**
   * Cancella le notifiche per un singolo task
   */
  public clearTaskNotification(taskId: string): void {
    this.timers.forEach((timerId, key) => {
      if (key === taskId || key.startsWith(`${taskId}_`)) {
        clearTimeout(timerId);
        this.timers.delete(key);
      }
    });
  }
  
  /**
   * Converte una stringa Base64 URL-safe in Uint8Array
   * Necessario per l'applicationServerKey
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}

export default NotificationManager;