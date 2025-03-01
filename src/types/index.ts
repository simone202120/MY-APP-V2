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
}

// Tipi per i contatori
export type CounterType = 'daily' | 'total';

export interface Counter {
  id: string;
  name: string;
  type: CounterType;
  currentValue: number;
  startDate: string;
  endDate?: string;
  duration: 'day' | 'custom';
  goal?: number; // Obiettivo numerico opzionale per il contatore
}

// Voci storiche per i contatori
export interface CounterEntry {
  id: string;
  counterId: string;
  userId: string;
  date: string;
  value: number;
  name?: string;
  timestamp?: any; // Timestamp di Firestore
}