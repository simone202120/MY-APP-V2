// src/context/AppContext.tsx - Aggiornato per supportare il completamento di singole occorrenze
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { Task, Notification, Counter, CounterEntry } from '../types';
import { format, isToday, startOfDay, parseISO } from 'date-fns';
import NotificationService from '../services/NotificationService';
import NotificationEntriesService from '../services/NotificationEntriesService';

interface AppContextType {
  tasks: Task[];
  counters: Counter[];
  isLoading: boolean;
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'isCompleted' | 'completedDates'>) => Promise<void>;
  toggleTaskComplete: (taskId: string, specificDate?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteRoutineOccurrence: (taskId: string, date: string) => Promise<void>;
  // Counter operations
  addCounter: (counter: Omit<Counter, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentValue'>) => Promise<void>;
  updateCounter: (counterId: string, value: number) => Promise<void>;
  incrementCounter: (counterId: string) => Promise<void>;
  decrementCounter: (counterId: string) => Promise<void>;
  deleteCounter: (counterId: string) => Promise<void>;
  resetDailyCounters: () => Promise<void>;
  resetAllCounters: () => Promise<void>;
  // Data operations
  resetAllData: () => Promise<void>;
  // Notification operations
  createSystemNotification: (title: string, message: string) => Promise<string | null>;
  createTaskNotification: (title: string, message: string, taskId: string) => Promise<string | null>;
  createCounterNotification: (title: string, message: string, counterId: string) => Promise<string | null>;
  getUnreadNotificationsCount: () => Promise<number>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Inizializza i servizi di notifiche
  const notificationService = NotificationService.getInstance();
  const appNotificationService = NotificationEntriesService.getInstance();

  // Fetch user data from Firestore
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setCounters([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to tasks collection
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      setTasks(tasksData);
      
      // Aggiorna il servizio di notifiche con i nuovi task
      notificationService.updateTasks(tasksData);
    });
    
    // Subscribe to counters collection
    const countersQuery = query(
      collection(db, 'counters'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeCounters = onSnapshot(countersQuery, (snapshot) => {
      const countersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Counter));
      
      // Verifica se i contatori periodici (daily, weekly, monthly) necessitano di reset
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Verifica e aggiorna i contatori che necessitano di reset
      const updatedCounters = countersData.map(counter => {
        if (counter.type === 'cumulative') {
          // I contatori cumulativi non si resettano
          return counter;
        }
        
        const lastReset = counter.lastResetDate || counter.startDate || todayStr;
        let needsReset = false;
        
        if (counter.type === 'daily') {
          // Verifica se l'ultima data di reset è diversa da oggi
          needsReset = lastReset !== todayStr;
        } 
        else if (counter.type === 'weekly') {
          // Ottiene il numero della settimana dell'anno
          const lastResetDate = parseISO(lastReset);
          const lastResetWeek = getWeekNumber(lastResetDate);
          const currentWeek = getWeekNumber(today);
          
          // Verifica se siamo in una settimana diversa
          needsReset = lastResetWeek !== currentWeek;
        } 
        else if (counter.type === 'monthly') {
          // Ottiene il mese corrente
          const lastResetDate = parseISO(lastReset);
          const lastResetMonth = lastResetDate.getMonth();
          const currentMonth = today.getMonth();
          
          // Verifica se siamo in un mese diverso
          needsReset = lastResetMonth !== currentMonth || 
                      lastResetDate.getFullYear() !== today.getFullYear();
        }
        
        if (needsReset) {
          // Aggiorna il contatore nel database
          const counterRef = doc(db, 'counters', counter.id);
          updateDoc(counterRef, {
            currentValue: 0,
            lastResetDate: todayStr,
            updatedAt: Timestamp.now()
          });
          
          // Ritorna il contatore aggiornato per l'interfaccia
          return {
            ...counter,
            currentValue: 0,
            lastResetDate: todayStr
          };
        }
        
        return counter;
      });
      
      setCounters(updatedCounters);
    });
    
    // Funzione per calcolare il numero della settimana dell'anno
    const getWeekNumber = (date: Date) => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };
    
    // Richiedi permesso per le notifiche
    const requestNotificationPermission = async () => {
      await notificationService.requestPermission();
    };
    
    requestNotificationPermission();
    
    setIsLoading(false);
    
    return () => {
      unsubscribeTasks();
      unsubscribeCounters();
      notificationService.clearAllNotifications();
    };
  }, [currentUser]);

  const addTask = async (taskData: Omit<Task, 'id' | 'isCompleted' | 'completedDates'>) => {
    if (!currentUser) return;
    
    // Crea una copia dei dati e rimuovi tutti i campi undefined
    const cleanedData: Record<string, any> = {};
    
    // Aggiungi solo i campi che hanno un valore definito
    Object.entries(taskData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });
    
    const newTask = {
      ...cleanedData,
      isCompleted: false, // Mantenuto per compatibilità
      completedDates: [], // Inizializza l'array delle date completate
      userId: currentUser.uid,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'tasks'), newTask);
  };

  const toggleTaskComplete = async (taskId: string, specificDate?: string) => {
    if (!currentUser) return;
    
    const taskToToggle = tasks.find(task => task.id === taskId);
    if (!taskToToggle) return;
    
    const taskRef = doc(db, 'tasks', taskId);
    
    // Gestione diversa in base al tipo di task
    if (taskToToggle.type === 'oneTime') {
      // Per eventi una tantum, usa semplicemente il flag isCompleted come prima
      const newIsCompleted = !taskToToggle.isCompleted;
      
      await updateDoc(taskRef, {
        isCompleted: newIsCompleted
      });
      
      // Se il task è stato completato, cancella le sue notifiche
      if (newIsCompleted && taskToToggle.notifyBefore) {
        notificationService.clearTaskNotification(taskId);
        
        // Crea una notifica in-app per il completamento del task
        await appNotificationService.createTaskNotification(
          currentUser.uid,
          'Task completato',
          `Hai completato "${taskToToggle.title}"`,
          taskId
        );
      }
    } 
    else if (taskToToggle.type === 'routine' && specificDate) {
      // Per le routine, gestisci il completamento per la data specifica
      const completedDates = taskToToggle.completedDates || [];
      
      // Verifica se questa data è già stata marcata come completata
      const isAlreadyCompleted = completedDates.includes(specificDate);
      
      if (isAlreadyCompleted) {
        // Rimuovi la data dall'elenco delle date completate
        await updateDoc(taskRef, {
          completedDates: arrayRemove(specificDate)
        });
      } else {
        // Aggiungi la data all'elenco delle date completate
        await updateDoc(taskRef, {
          completedDates: arrayUnion(specificDate)
        });
        
        // Crea una notifica in-app per il completamento del task
        await appNotificationService.createTaskNotification(
          currentUser.uid,
          'Routine completata',
          `Hai completato "${taskToToggle.title}" per oggi`,
          taskId
        );
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;
    
    // Rimuovi le notifiche per questo task
    notificationService.clearTaskNotification(taskId);
    
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
  };

  const deleteRoutineOccurrence = async (taskId: string, date: string) => {
    if (!currentUser) return;
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate || taskToUpdate.type !== 'routine') return;
    
    const excludedDates = taskToUpdate.excludedDates || [];
    
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      excludedDates: arrayUnion(date)
    });
  };

  const resetAllData = async () => {
    if (!currentUser) return;
    
    // Cancella tutte le notifiche
    notificationService.clearAllNotifications();
    
    // Delete all tasks
    for (const task of tasks) {
      await deleteDoc(doc(db, 'tasks', task.id));
    }
  };

  // Implementazione metodi per le notifiche in-app
  const createSystemNotification = async (title: string, message: string): Promise<string | null> => {
    if (!currentUser) return null;
    try {
      return await appNotificationService.createSystemNotification(
        currentUser.uid,
        title,
        message
      );
    } catch (error) {
      console.error('Errore durante la creazione della notifica di sistema:', error);
      return null;
    }
  };

  const createTaskNotification = async (title: string, message: string, taskId: string): Promise<string | null> => {
    if (!currentUser) return null;
    try {
      return await appNotificationService.createTaskNotification(
        currentUser.uid,
        title,
        message,
        taskId
      );
    } catch (error) {
      console.error('Errore durante la creazione della notifica di task:', error);
      return null;
    }
  };

  const createCounterNotification = async (title: string, message: string, counterId: string): Promise<string | null> => {
    if (!currentUser) return null;
    try {
      return await appNotificationService.createCounterNotification(
        currentUser.uid,
        title,
        message,
        counterId
      );
    } catch (error) {
      console.error('Errore durante la creazione della notifica di contatore:', error);
      return null;
    }
  };

  // Counter operations
  const addCounter = async (counterData: Omit<Counter, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentValue' | 'lastResetDate'>) => {
    if (!currentUser) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const newCounter = {
      ...counterData,
      userId: currentUser.uid,
      currentValue: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastResetDate: today
    };
    
    await addDoc(collection(db, 'counters'), newCounter);
  };

  const updateCounter = async (counterId: string, value: number) => {
    if (!currentUser) return;
    
    const counterRef = doc(db, 'counters', counterId);
    await updateDoc(counterRef, {
      currentValue: value,
      updatedAt: Timestamp.now()
    });
  };

  const incrementCounter = async (counterId: string) => {
    if (!currentUser) return;
    
    const counter = counters.find(c => c.id === counterId);
    if (!counter) return;
    
    await updateCounter(counterId, counter.currentValue + 1);
  };

  const decrementCounter = async (counterId: string) => {
    if (!currentUser) return;
    
    const counter = counters.find(c => c.id === counterId);
    if (!counter || counter.currentValue <= 0) return;
    
    await updateCounter(counterId, counter.currentValue - 1);
  };

  const deleteCounter = async (counterId: string) => {
    if (!currentUser) return;
    
    const counterRef = doc(db, 'counters', counterId);
    await deleteDoc(counterRef);
  };

  const resetDailyCounters = async () => {
    if (!currentUser) return;
    
    const dailyCounters = counters.filter(counter => counter.type === 'daily');
    
    // Reset each daily counter to 0
    for (const counter of dailyCounters) {
      await updateCounter(counter.id, 0);
    }
  };

  const resetAllCounters = async () => {
    if (!currentUser) return;
    
    // Reset all counters to 0
    for (const counter of counters) {
      await updateCounter(counter.id, 0);
    }
  };

  const getUnreadNotificationsCount = async (): Promise<number> => {
    if (!currentUser) return 0;
    try {
      return await appNotificationService.getUnreadCount(currentUser.uid);
    } catch (error) {
      console.error('Errore durante il recupero del conteggio delle notifiche non lette:', error);
      return 0;
    }
  };

  const value = {
    tasks,
    counters,
    isLoading,
    // Task operations
    addTask,
    toggleTaskComplete,
    deleteTask,
    deleteRoutineOccurrence,
    // Counter operations
    addCounter,
    updateCounter,
    incrementCounter,
    decrementCounter,
    deleteCounter,
    resetDailyCounters,
    resetAllCounters,
    // Data operations
    resetAllData,
    // Notification operations
    createSystemNotification,
    createTaskNotification,
    createCounterNotification,
    getUnreadNotificationsCount
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};