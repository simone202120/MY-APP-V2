// src/services/NotificationService.ts - Versione completa con supporto per ricorrenza mensile
import { Task, NotificationTimeUnit } from '../types';
import { addDays, format, isAfter, isBefore, getDate, parseISO } from 'date-fns';

class NotificationService {
  private static instance: NotificationService;
  private notificationsEnabled: boolean = false;
  private tasks: Task[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Verifica e richiede i permessi per le notifiche
   */
  public async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("Questo browser non supporta le notifiche desktop");
      return false;
    }

    if (Notification.permission === "granted") {
      this.notificationsEnabled = true;
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.notificationsEnabled = permission === "granted";
      return this.notificationsEnabled;
    }

    return false;
  }

  /**
   * Controlla se le notifiche sono abilitate
   */
  public areNotificationsEnabled(): boolean {
    return this.notificationsEnabled && Notification.permission === "granted";
  }

  /**
   * Aggiorna la lista dei task e imposta i timer per le notifiche
   */
  public updateTasks(tasks: Task[]): void {
    this.clearAllNotifications(); // Rimuovi tutti i timer esistenti
    this.tasks = tasks;
    
    if (!this.notificationsEnabled) return;
    
    // Imposta i nuovi timer solo per i task che devono essere notificati
    const now = new Date();
    
    tasks.forEach(task => {
      // Non pianificare notifiche se il task non ha l'opzione di notifica
      if (!task.notifyBefore) return;
      
      // Per task una tantum, verifica il flag isCompleted
      if (task.type === 'oneTime' && task.isCompleted) return;
      
      // Per task ricorrenti, non verificare isCompleted (controlla solo completedDates)
      // La verifica dettagliata avverrà in showNotification
      
      if (task.type === 'oneTime') {
        this.scheduleOneTimeNotification(task);
      } else if (task.type === 'routine') {
        this.scheduleRoutineNotifications(task);
      }
    });
  }

  /**
   * Calcola il tempo di anticipo per la notifica in millisecondi
   */
  private getNotificationAdvanceTime(task: Task): number {
    const defaultAdvanceMinutes = 10; // Valore di default: 10 minuti prima
    
    if (!task.notifyInAdvance || task.notifyInAdvance <= 0) {
      return defaultAdvanceMinutes * 60 * 1000; // Default: 10 minuti in millisecondi
    }
    
    if (task.notifyTimeUnit === 'hours') {
      return task.notifyInAdvance * 60 * 60 * 1000; // Ore in millisecondi
    }
    
    // Altrimenti, assume che sia in minuti
    return task.notifyInAdvance * 60 * 1000; // Minuti in millisecondi
  }

  /**
   * Pianifica una notifica per un task una tantum
   */
  private scheduleOneTimeNotification(task: Task): void {
    if (!task.date || !task.time) return;
    
    const taskDateTime = new Date(`${task.date}T${task.time}`);
    const advanceTime = this.getNotificationAdvanceTime(task);
    const notificationTime = new Date(taskDateTime.getTime() - advanceTime);
    
    const now = new Date();
    if (notificationTime <= now) return; // Non programmare notifiche nel passato
    
    const timeToNotification = notificationTime.getTime() - now.getTime();
    
    const timerId = setTimeout(() => {
      this.showNotification(task);
    }, timeToNotification);
    
    this.timers.set(task.id, timerId);
  }

  /**
   * Pianifica notifiche per un task ricorrente
   */
  private scheduleRoutineNotifications(task: Task): void {
    if (!task.time) return;
    
    const now = new Date();
    
    // Calcola la prossima occorrenza in base al tipo di ricorrenza
    let nextOccurrence: Date | null = null;
    
    if (task.recurrenceType === 'custom' && task.recurrenceInterval) {
      // Ricorrenza personalizzata in base a un intervallo di giorni
      nextOccurrence = this.getNextCustomOccurrence(task);
    } else if (task.recurrenceType === 'biweekly') {
      // Ricorrenza bisettimanale
      nextOccurrence = this.getNextBiweeklyOccurrence(task);
    } else if (task.recurrenceType === 'monthly') {
      // Ricorrenza mensile
      nextOccurrence = this.getNextMonthlyOccurrence(task);
    } else {
      // Ricorrenza settimanale standard (default)
      nextOccurrence = this.getNextWeekdayOccurrence(task);
    }
    
    // Se non c'è una prossima occorrenza valida, esci
    if (!nextOccurrence) return;
    
    // Imposta l'ora
    const [hours, minutes] = task.time.split(':').map(Number);
    nextOccurrence.setHours(hours, minutes, 0, 0);
    
    // Calcola il tempo di anticipo personalizzato
    const advanceTime = this.getNotificationAdvanceTime(task);
    const notificationTime = new Date(nextOccurrence.getTime() - advanceTime);
    const timeToNotification = notificationTime.getTime() - now.getTime();
    
    if (timeToNotification > 0) {
      const timerId = setTimeout(() => {
        this.showNotification(task);
        // Dopo aver mostrato la notifica, pianifica la prossima
        this.scheduleRoutineNotifications(task);
      }, timeToNotification);
      
      this.timers.set(`${task.id}_${nextOccurrence.toISOString()}`, timerId);
    }
  }
  
  /**
   * Trova la prossima occorrenza per un task ricorrente con intervallo personalizzato
   */
  private getNextCustomOccurrence(task: Task): Date | null {
    if (!task.startDate || !task.recurrenceInterval) {
      return null;
    }
    
    const now = new Date();
    let startDate = parseISO(task.startDate);
    
    // Se siamo dopo la data di fine, non ci sono più occorrenze
    if (task.endDate && isAfter(now, parseISO(task.endDate))) {
      return null;
    }
    
    const unit = task.recurrenceUnit || 'days';
    let nextOccurrence: Date;
    
    if (unit === 'days') {
      // Calcola quanti giorni sono passati dalla data di inizio
      const diffInDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcola quante ricorrenze complete sono già passate
      const completedRecurrences = Math.floor(diffInDays / task.recurrenceInterval);
      
      // Calcola la data della prossima ricorrenza
      nextOccurrence = addDays(startDate, (completedRecurrences + 1) * task.recurrenceInterval);
    } 
    else if (unit === 'weeks') {
      // Per settimane, manteniamo lo stesso giorno della settimana
      const dayOfWeek = startDate.getDay();
      const today = now.getDay();
      
      // Calcola quante settimane sono passate
      const diffInDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const diffInWeeks = Math.floor(diffInDays / 7);
      const completedRecurrences = Math.floor(diffInWeeks / task.recurrenceInterval);
      
      // Calcola la prossima ricorrenza base
      let baseNextOccurrence = new Date(startDate);
      baseNextOccurrence.setDate(startDate.getDate() + (completedRecurrences + 1) * 7 * task.recurrenceInterval);
      
      // Se oggi è lo stesso giorno della settimana e l'ora è già passata, aggiungi un ciclo
      if (dayOfWeek === today && baseNextOccurrence <= now) {
        baseNextOccurrence.setDate(baseNextOccurrence.getDate() + 7 * task.recurrenceInterval);
      }
      
      nextOccurrence = baseNextOccurrence;
    } 
    else if (unit === 'months') {
      // Per mesi, manteniamo lo stesso giorno del mese (o l'ultimo giorno se necessario)
      const targetDay = startDate.getDate();
      
      // Calcola quanti mesi sono passati
      const diffYears = now.getFullYear() - startDate.getFullYear();
      const diffMonths = now.getMonth() - startDate.getMonth() + (diffYears * 12);
      const completedRecurrences = Math.floor(diffMonths / task.recurrenceInterval);
      
      // Calcola la prossima ricorrenza
      let baseNextOccurrence = new Date(startDate);
      baseNextOccurrence.setMonth(startDate.getMonth() + (completedRecurrences + 1) * task.recurrenceInterval);
      
      // Se oggi è lo stesso giorno del mese e l'ora è già passata, aggiungi un ciclo
      if (now.getDate() === targetDay && baseNextOccurrence <= now) {
        baseNextOccurrence.setMonth(baseNextOccurrence.getMonth() + task.recurrenceInterval);
      }
      
      nextOccurrence = baseNextOccurrence;
    }
    else {
      // Default fallback a giorni
      const diffInDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const completedRecurrences = Math.floor(diffInDays / task.recurrenceInterval);
      nextOccurrence = addDays(startDate, (completedRecurrences + 1) * task.recurrenceInterval);
    }
    
    // Verifica che la prossima ricorrenza sia entro la data di fine (se specificata)
    if (task.endDate && isAfter(nextOccurrence, parseISO(task.endDate))) {
      return null;
    }
    
    // Verifica che questa data non sia esclusa
    const nextOccurrenceStr = format(nextOccurrence, 'yyyy-MM-dd');
    if (task.excludedDates?.includes(nextOccurrenceStr)) {
      // Se la data è esclusa, prova con la successiva
      const nextDay = addDays(nextOccurrence, 1);
      const tempTask = {
        ...task,
        startDate: format(nextDay, 'yyyy-MM-dd'),
        excludedDates: task.excludedDates // Mantieni le date escluse
      };
      return this.getNextCustomOccurrence(tempTask);
    }
    
    return nextOccurrence;
  }
  
  /**
   * Trova la prossima occorrenza bisettimanale
   */
  private getNextBiweeklyOccurrence(task: Task): Date | null {
    if (!task.weekdays || task.weekdays.length === 0 || !task.startDate) {
      return null;
    }
    
    const now = new Date();
    const startDate = parseISO(task.startDate);
    
    // Se siamo prima della data di inizio o dopo la data di fine, non ci sono occorrenze
    if ((startDate && isBefore(now, startDate)) || 
        (task.endDate && isAfter(now, parseISO(task.endDate)))) {
      return null;
    }
    
    // Calcola in quale settimana dell'intervallo bisettimanale siamo
    const diffInDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekInCycle = Math.floor(diffInDays / 7) % 2; // 0 per la prima settimana, 1 per la seconda
    
    // Se siamo nella settimana "off" del ciclo, aggiungiamo abbastanza giorni per arrivare alla prossima settimana "on"
    let daysToAdd = 0;
    if (weekInCycle === 1) {
      // Siamo nella seconda settimana, aggiungi i giorni per arrivare alla prossima settimana "on"
      daysToAdd = 7;
    }
    
    // Calcola il prossimo giorno nella settimana corrente o nella prossima settimana "on"
    const nextOccurrence = this.getNextWeekdayFromToday(task, daysToAdd);
    
    return nextOccurrence;
  }
  
  /**
   * Trova la prossima occorrenza mensile
   */
  private getNextMonthlyOccurrence(task: Task): Date | null {
    // Verifica parametri necessari
    if (!task.startDate) {
      return null;
    }
    
    const now = new Date();
    const startDate = parseISO(task.startDate);
    
    // Se siamo dopo la data di fine, non ci sono più occorrenze
    if (task.endDate && isAfter(now, parseISO(task.endDate))) {
      return null;
    }
    
    // Determina il giorno del mese da usare
    // Se è specificato monthDay, usa quello
    // Altrimenti usa il giorno del mese dalla data di inizio
    const dayOfMonth = task.monthDay || startDate.getDate();
    
    // Crea una data per il mese corrente con il giorno specificato
    let nextOccurrence = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    
    // Se questo giorno è già passato questo mese, spostati al mese prossimo
    if (nextOccurrence <= now) {
      nextOccurrence = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
    }
    
    // Gestisci casi come il 31 in mesi con meno giorni
    // Se il giorno non esiste nel mese, JS lo riporta al mese successivo
    // Per esempio, new Date(2023, 1, 31) diventa 3 marzo 2023 perché febbraio ha solo 28 giorni
    if (nextOccurrence.getDate() !== dayOfMonth) {
      // Se è successo, torna all'ultimo giorno del mese desiderato
      nextOccurrence = new Date(nextOccurrence.getFullYear(), nextOccurrence.getMonth(), 0);
    }
    
    // Verifica che la prossima ricorrenza sia entro la data di fine (se specificata)
    if (task.endDate && isAfter(nextOccurrence, parseISO(task.endDate))) {
      return null;
    }
    
    // Verifica che questa data non sia esclusa
    const nextOccurrenceStr = format(nextOccurrence, 'yyyy-MM-dd');
    if (task.excludedDates?.includes(nextOccurrenceStr)) {
      // Se la data è esclusa, calcola la ricorrenza del mese successivo
      const tempNextMonth = new Date(nextOccurrence);
      tempNextMonth.setMonth(tempNextMonth.getMonth() + 1);
      
      // Crea un oggetto task temporaneo con la data iniziale nel mese successivo
      const tempTask = {
        ...task,
        startDate: format(tempNextMonth, 'yyyy-MM-dd')
      };
      
      return this.getNextMonthlyOccurrence(tempTask);
    }
    
    return nextOccurrence;
  }
  
  /**
   * Trova la prossima occorrenza in base ai giorni della settimana
   */
  private getNextWeekdayOccurrence(task: Task): Date | null {
    if (!task.weekdays || task.weekdays.length === 0) {
      return null;
    }
    
    const now = new Date();
    
    // Data di inizio e fine
    const startDate = task.startDate ? parseISO(task.startDate) : null;
    const endDate = task.endDate ? parseISO(task.endDate) : null;
    
    // Se siamo prima della data di inizio o dopo la data di fine, non ci sono occorrenze
    if ((startDate && isBefore(now, startDate)) || 
        (endDate && isAfter(now, endDate))) {
      return null;
    }
    
    return this.getNextWeekdayFromToday(task, 0);
  }
  
  /**
   * Trova il prossimo giorno della settimana a partire da oggi + daysOffset
   */
  private getNextWeekdayFromToday(task: Task, daysOffset: number): Date | null {
    if (!task.weekdays || task.weekdays.length === 0) {
      return null;
    }
    
    const now = new Date();
    const baseDate = addDays(now, daysOffset);
    const today = baseDate.getDay(); // 0 = Domenica, 1 = Lunedì, ...
    
    const daysMap: {[key: string]: number} = {
      'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0
    };
    
    let daysToAdd = 7; // Default a una settimana
    let foundValidDay = false;
    
    // Trova il prossimo giorno della settimana
    task.weekdays.forEach(weekday => {
      const weekdayNum = daysMap[weekday];
      let daysUntilNextOccurrence = (weekdayNum - today + 7) % 7;
      
      // Se oggi è il giorno programmato, verificare l'ora
      if (daysUntilNextOccurrence === 0 && task.time) {
        const [hours, minutes] = task.time.split(':').map(Number);
        const taskTimeToday = new Date(baseDate);
        taskTimeToday.setHours(hours, minutes, 0);
        
        // Se l'ora è già passata, considera la prossima settimana
        if (taskTimeToday <= new Date()) {
          daysUntilNextOccurrence = 7;
        }
      }
      
      if (daysUntilNextOccurrence < daysToAdd) {
        daysToAdd = daysUntilNextOccurrence;
        foundValidDay = true;
      }
    });
    
    if (!foundValidDay) {
      return null;
    }
    
    // Calcola la data/ora esatta della prossima occorrenza
    const nextOccurrence = addDays(baseDate, daysToAdd);
    
    // Verifica che questa data non sia esclusa
    const nextOccurrenceStr = format(nextOccurrence, 'yyyy-MM-dd');
    if (task.excludedDates?.includes(nextOccurrenceStr)) {
      // Se la data è esclusa, prova con la successiva
      return this.getNextWeekdayFromToday(task, daysOffset + daysToAdd + 1);
    }
    
    // Verifica che sia entro la data di fine (se specificata)
    if (task.endDate && isAfter(nextOccurrence, parseISO(task.endDate))) {
      return null;
    }
    
    return nextOccurrence;
  }

  /**
   * Mostra una notifica per un task
   */
  private showNotification(task: Task): void {
    if (!this.notificationsEnabled) return;
    
    // Verifica se il task è già stato completato per la data corrente
    if (this.isTaskCompletedForToday(task)) {
      console.log(`Task "${task.title}" già completato per oggi, notifica saltata`);
      return;
    }
    
    const title = "Promemoria Impegno";
    
    // Crea il messaggio appropriato in base al tempo di anticipo
    let messageText = task.title;
    
    if (task.notifyInAdvance && task.notifyInAdvance > 0) {
      if (task.notifyTimeUnit === 'hours') {
        if (task.notifyInAdvance === 1) {
          messageText = `Tra 1 ora: ${task.title}`;
        } else {
          messageText = `Tra ${task.notifyInAdvance} ore: ${task.title}`;
        }
      } else {
        if (task.notifyInAdvance === 1) {
          messageText = `Tra 1 minuto: ${task.title}`;
        } else {
          messageText = `Tra ${task.notifyInAdvance} minuti: ${task.title}`;
        }
      }
    } else {
      // Default: 10 minuti
      messageText = `Tra 10 minuti: ${task.title}`;
    }
    
    const options = {
      body: messageText,
      icon: '/logo192.png',
      tag: `task-${task.id}-${new Date().toISOString().split('T')[0]}`, // Usa un tag unico per evitare duplicati
    };
    
    const notification = new Notification(title, options);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
  
  /**
   * Verifica se il task è stato completato per la data odierna
   */
  private isTaskCompletedForToday(task: Task): boolean {
    // Per task una tantum, usa il flag isCompleted
    if (task.type === 'oneTime') {
      return task.isCompleted;
    }
    
    // Per task ricorrenti, verifica le date completate
    if (!task.completedDates || task.completedDates.length === 0) {
      return false;
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    return task.completedDates.includes(today);
  }

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
}

export default NotificationService;