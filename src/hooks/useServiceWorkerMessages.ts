// src/hooks/useServiceWorkerMessages.ts
import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Hook per gestire i messaggi dal service worker, in particolare per le azioni di notifica
 */
export function useServiceWorkerMessages() {
  const { 
    toggleTaskComplete, 
    deleteTask, 
    deleteRoutineOccurrence,
    tasks,
    counters
  } = useApp();

  /**
   * Gestisce il completamento di un task
   */
  const handleCompleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error(`Task non trovato con ID: ${taskId}`);
      return;
    }
    
    // Per i task una tantum, è semplice
    if (task.type === 'oneTime') {
      console.log(`Completamento task una tantum: ${taskId}`);
      toggleTaskComplete(taskId);
      return;
    }
    
    // Per i task ricorrenti, usiamo la data odierna
    const today = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    console.log(`Completamento task ricorrente: ${taskId} per la data ${today}`);
    toggleTaskComplete(taskId, today);
  }, [tasks, toggleTaskComplete]);

  /**
   * Gestisce il posticipo di un task
   */
  const handleSnoozeTask = useCallback((taskId: string, minutes: number = 15) => {
    // In una vera implementazione, dovresti:
    // 1. Trovare il task
    // 2. Calcolare la nuova ora di notifica (ora attuale + minuti di posticipo)
    // 3. Aggiornare il task nel database o programmarne uno nuovo
    
    console.log(`Posticipo task: ${taskId} di ${minutes} minuti`);
    
    // Per ora, mostriamo solo un messaggio di conferma
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Task posticipato', {
        body: `Ti avviseremo di nuovo tra ${minutes} minuti`,
        icon: '/logo192.png'
      });
    }
  }, []);

  /**
   * Gestisce il feedback per un task
   */
  const handleTaskFeedback = useCallback((taskId: string, feedback: string) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.error(`Task non trovato con ID: ${taskId}`);
      return;
    }
    
    console.log(`Feedback ricevuto per il task ${taskId}: ${feedback}`);
    
    // In una vera implementazione, dovresti salvare il feedback nel database
    // Per ora, mostriamo solo un messaggio di conferma
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Feedback ricevuto', {
        body: `Grazie per il tuo feedback!`,
        icon: '/logo192.png'
      });
    }
  }, [tasks]);

  /**
   * Gestisce tutti i messaggi dal service worker
   */
  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    console.log('Messaggio dal service worker:', event.data);
    
    const { action, taskId, feedback, minutes } = event.data;
    
    if (action === 'complete-task' && taskId) {
      handleCompleteTask(taskId);
    }
    
    if (action === 'snooze-task' && taskId) {
      handleSnoozeTask(taskId, minutes || 15);
    }
    
    if (action === 'feedback' && taskId && feedback) {
      handleTaskFeedback(taskId, feedback);
    }
  }, [handleCompleteTask, handleSnoozeTask, handleTaskFeedback]);

  // Configura l'ascoltatore di eventi all'avvio e lo rimuove alla pulizia
  useEffect(() => {
    // All'avvio, verifica se esiste un'azione in pendenza
    const pendingAction = localStorage.getItem('pendingAction');
    if (pendingAction) {
      try {
        const action = JSON.parse(pendingAction);
        handleServiceWorkerMessage(new MessageEvent('message', { data: action }));
      } catch (error) {
        console.error('Errore durante l\'elaborazione dell\'azione in pendenza:', error);
      } finally {
        localStorage.removeItem('pendingAction');
      }
    }
    
    // Aggiungi l'ascoltatore per i messaggi del service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    return () => {
      // Rimuovi l'ascoltatore quando il componente viene smontato
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [handleServiceWorkerMessage]);

  return null; // Questo hook non restituisce nulla, gestisce solo effetti collaterali
}