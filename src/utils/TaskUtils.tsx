// src/utils/TaskUtils.tsx - Versione completa con tutte le funzionalità
import { format, differenceInDays, isLastDayOfMonth, getDate, parseISO } from 'date-fns';
import { Task } from '../types';

/**
 * Verifica se un task è programmato per una data specifica,
 * considerando tipo di ricorrenza, giorni della settimana e intervalli
 */
export function isTaskScheduledForDate(task: Task, date: Date): boolean {
  if (task.type !== 'routine') {
    return false; // Gestisce solo task ricorrenti
  }

  // Controlla se è escluso specificamente
  const dateStr = format(date, 'yyyy-MM-dd');
  if (task.excludedDates?.includes(dateStr)) {
    return false;
  }

  // Controlla se è al di fuori dell'intervallo di date
  if (task.startDate && dateStr < task.startDate) {
    return false;
  }
  if (task.endDate && dateStr > task.endDate) {
    return false;
  }

  // Gestione in base al tipo di ricorrenza
  if (task.recurrenceType === 'monthly') {
    return isMonthlyTaskScheduledForDate(task, date);
  } else if (task.recurrenceType === 'weekly' || !task.recurrenceType) {
    return isWeeklyTaskScheduledForDate(task, date);
  } else if (task.recurrenceType === 'biweekly') {
    return isBiweeklyTaskScheduledForDate(task, date);
  } else if (task.recurrenceType === 'custom' && task.recurrenceInterval) {
    return isCustomTaskScheduledForDate(task, date);
  }

  return false;
}

/**
 * Verifica se un task è stato completato per una data specifica
 * @param task Il task da verificare
 * @param date La data per cui verificare il completamento (oggetto Date o stringa formato yyyy-MM-dd)
 * @return True se il task è stato completato per la data specificata, false altrimenti
 */
export function isTaskCompletedForDate(task: Task, date: Date | string): boolean {
  // Per task una tantum, usa il flag isCompleted standard
  if (task.type === 'oneTime') {
    return task.isCompleted;
  }
  
  // Per le routine, verifica l'array completedDates
  if (!task.completedDates || task.completedDates.length === 0) {
    return false; // Nessuna data completata
  }
  
  // Converti la data in formato stringa se necessario
  const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
  
  // Verifica se la data è nell'elenco delle date completate
  return task.completedDates.includes(dateStr);
}

/**
 * Verifica se un task con ricorrenza settimanale è programmato per una data
 */
function isWeeklyTaskScheduledForDate(task: Task, date: Date): boolean {
  // Verifica se il giorno della settimana è pianificato
  const dayOfWeek = format(date, 'eee').toLowerCase();
  return task.weekdays?.includes(dayOfWeek) ?? false;
}

/**
 * Verifica se un task con ricorrenza bisettimanale è programmato per una data
 */
function isBiweeklyTaskScheduledForDate(task: Task, date: Date): boolean {
  // Prima controlla se il giorno della settimana è pianificato
  const dayOfWeek = format(date, 'eee').toLowerCase();
  if (!task.weekdays?.includes(dayOfWeek)) {
    return false;
  }

  // Poi verifica se siamo nella settimana "attiva" del ciclo bisettimanale
  if (!task.startDate) {
    return false;
  }

  const startDate = parseISO(task.startDate);
  const diffInDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekInCycle = Math.floor(diffInDays / 7) % 2; // 0 per la prima settimana, 1 per la seconda

  // È pianificato solo se siamo nella prima settimana del ciclo (settimana "attiva")
  return weekInCycle === 0;
}

/**
 * Verifica se un task con ricorrenza mensile è programmato per una data
 */
function isMonthlyTaskScheduledForDate(task: Task, date: Date): boolean {
  // Determina il giorno del mese da controllare
  let targetDayOfMonth;
  
  // Se è specificato monthDay, usa quello
  if (task.monthDay) {
    targetDayOfMonth = task.monthDay;
  } 
  // Altrimenti, utilizza il giorno dal startDate
  else if (task.startDate) {
    const startDate = parseISO(task.startDate);
    targetDayOfMonth = getDate(startDate);
  } else {
    return false;
  }
  
  const dayOfMonth = getDate(date);
  
  // Gestire caso speciale: l'ultimo giorno del mese
  if (targetDayOfMonth >= 28) {
    // Se il target è l'ultimo giorno del mese (o un giorno che non esiste in alcuni mesi)
    // e la data in questione è l'ultimo giorno del suo mese, considera come corrispondente
    const isTargetPotentiallyLastDay = targetDayOfMonth >= 28;
    const isDateLastDayOfMonth = isLastDayOfMonth(date);
    
    if (isTargetPotentiallyLastDay && isDateLastDayOfMonth) {
      // È l'ultimo giorno del mese - corrisponde
      return true;
    }
  }
  
  // Corrispondenza semplice del giorno del mese
  return dayOfMonth === targetDayOfMonth;
}

/**
 * Verifica se un task con ricorrenza personalizzata è programmato per una data
 */
function isCustomTaskScheduledForDate(task: Task, date: Date): boolean {
  if (!task.startDate || !task.recurrenceInterval) {
    return false;
  }
  
  const startDate = parseISO(task.startDate);
  
  // Calcola la differenza in base all'unità specificata
  let diff = 0;
  let unit = task.recurrenceUnit || 'days';
  
  if (unit === 'days') {
    diff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff % task.recurrenceInterval === 0;
  } 
  else if (unit === 'weeks') {
    diff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return diff % task.recurrenceInterval === 0 && 
           format(startDate, 'eee').toLowerCase() === format(date, 'eee').toLowerCase();
  } 
  else if (unit === 'months') {
    // Per mesi, verifica se il giorno del mese corrisponde
    if (date.getDate() !== startDate.getDate()) {
      // Gestione dell'ultimo giorno del mese quando il mese corrente ha meno giorni
      const isLastDayOfTargetMonth = isLastDayOfMonth(date);
      const isStartDateLastDay = isLastDayOfMonth(startDate);
      
      if (!(isLastDayOfTargetMonth && isStartDateLastDay)) {
        return false;
      }
    }
    
    // Calcola quanti mesi sono passati
    const diffYears = date.getFullYear() - startDate.getFullYear();
    const diffMonths = date.getMonth() - startDate.getMonth() + (diffYears * 12);
    
    return diffMonths % task.recurrenceInterval === 0;
  }
  
  return false;
}