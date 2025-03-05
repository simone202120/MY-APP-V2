// src/types/index.ts - Aggiunto supporto per il completamento di singole occorrenze
// Aggiungi o modifica queste definizioni nel file

// Tipi per gli impegni
export type TaskType = 'routine' | 'oneTime';

// Tipi di cadenza per le routine
export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

// Tipi di unità di tempo per ricorrenze personalizzate
export type TimeUnit = 'days' | 'weeks' | 'months';

// Tipi di unità di tempo per le notifiche
export type NotificationTimeUnit = 'minutes' | 'hours';

// Tipi di notifiche in-app
export type NotificationType = 'task' | 'system' | 'counter';

// Estendi l'interfaccia Task se necessario
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  date?: string;
  time?: string;
  weekdays?: string[];
  monthDay?: number; // Giorno del mese (1-31)
  startDate?: string;
  endDate?: string;
  isCompleted: boolean; // Mantenuto per compatibilità con eventi una tantum
  completedDates?: string[]; // NUOVO: Array di date (formato yyyy-MM-dd) in cui il task è stato completato
  frequency?: string;
  excludedDates?: string[]; // Date in cui il task è stato escluso
  notifyBefore?: boolean;
  notifyInAdvance?: number; // Quanti minuti/ore prima dell'evento
  notifyTimeUnit?: NotificationTimeUnit; // 'minutes' o 'hours'
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  recurrenceUnit?: TimeUnit; // Proprietà per l'interfaccia locale del form
  collectFeedback?: boolean; // Se abilitato, mostra emoji per raccogliere feedback nel completamento
}

// Interfaccia per i contatori
export interface Counter {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'cumulative'; // Tipo di contatore
  startDate?: string; // Data di inizio (formato yyyy-MM-dd)
  endDate?: string; // Data di fine (formato yyyy-MM-dd)
  currentValue: number; // Valore corrente
  displayValue?: number; // Valore da mostrare (per uso UI)
  goal?: number; // Obiettivo da raggiungere
  createdAt: any; // Timestamp di Firestore
  updatedAt: any; // Timestamp di Firestore
  lastResetDate?: string; // Ultima data di reset (formato yyyy-MM-dd)
}

// Interfaccia per le voci dei contatori
export interface CounterEntry {
  id: string;
  counterId: string;
  userId: string;
  name?: string; // Nome del contatore al momento dell'inserimento
  value: number; // Valore registrato
  date: string; // Data dell'inserimento (formato yyyy-MM-dd)
  timestamp: any; // Timestamp di Firestore
  note?: string; // Nota opzionale
}

// Interfaccia per le notifiche in-app
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: any; // Timestamp di Firestore
  read: boolean;
  type: NotificationType;
  relatedId?: string; // ID dell'oggetto correlato (task, counter, etc)
}