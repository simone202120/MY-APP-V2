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
import { Task, Counter, TaskType, CounterType, CounterEntry, Notification } from '../types';
import { format, isToday, startOfDay } from 'date-fns';
import NotificationService from '../services/NotificationService';
import NotificationEntriesService from '../services/NotificationEntriesService';
import { CounterEntriesService } from '../services/CounterEntriesService';

interface AppContextType {
  tasks: Task[];
  counters: Counter[];
  counterEntries: CounterEntry[];
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'isCompleted' | 'completedDates'>) => Promise<void>;
  toggleTaskComplete: (taskId: string, specificDate?: string) => Promise<void>;
  addCounter: (counter: Omit<Counter, 'id' | 'currentValue'>) => Promise<void>;
  incrementCounter: (counterId: string) => Promise<void>;
  decrementCounter: (counterId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteCounter: (counterId: string) => Promise<void>;
  resetDailyCounters: () => Promise<void>;
  resetAllData: () => Promise<void>;
  resetAllCounters: () => Promise<void>;
  deleteRoutineOccurrence: (taskId: string, date: string) => Promise<void>;
  getCounterHistory: (counterId: string) => Promise<CounterEntry[]>;
  // Aggiunte per il sistema di notifiche in-app
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
  const [counterEntries, setCounterEntries] = useState<CounterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Inizializza i servizi di notifiche
  const notificationService = NotificationService.getInstance();
  const appNotificationService = NotificationEntriesService.getInstance();

  // Salva i contatori giornalieri attuali nel database
  const saveCounterEntries = async () => {
    if (!currentUser) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Filtra solo i contatori giornalieri attivi
    const dailyCounters = counters.filter(
      counter => counter.type === 'daily' &&
      counter.startDate <= today &&
      (!counter.endDate || counter.endDate >= today)
    );
    
    // Salva il valore corrente di ogni contatore come voce storica
    for (const counter of dailyCounters) {
      try {
        // Verifica se esiste già una voce per questo contatore specifico per oggi
        const hasEntry = await CounterEntriesService.hasEntriesForDate(today, currentUser.uid, counter.id);
        
        // Evita di salvare più volte lo stesso contatore per lo stesso giorno
        if (!hasEntry) {
          await addDoc(collection(db, 'counterEntries'), {
            counterId: counter.id,
            userId: currentUser.uid,
            date: today,
            value: counter.currentValue,
            name: counter.name,
            timestamp: Timestamp.now()
          });
          console.log(`Salvato contatore ${counter.name} con valore ${counter.currentValue} per il giorno ${today}`);
        } else {
          console.log(`Contatore ${counter.name} già salvato per la data ${today}`);
        }
      } catch (error) {
        console.error(`Errore nel salvare la voce storica per il contatore ${counter.id}:`, error);
      }
    }
    
    // Aggiorna lo stato locale con le nuove voci
    const updatedEntries = await CounterEntriesService.getAllCounterEntries(currentUser.uid);
    setCounterEntries(updatedEntries);
  };

  // Reset dei contatori giornalieri a zero
  const resetDailyCounters = async () => {
    if (!currentUser) return;
  
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Seleziona solo i contatori giornalieri attivi per oggi
    const dailyCounters = counters.filter(
      counter => counter.type === 'daily' &&
      counter.startDate <= today &&
      (!counter.endDate || counter.endDate >= today)
    );
  
    // Prima salva lo stato attuale dei contatori per il giorno precedente (ieri)
    const yesterday = format(
      new Date(new Date().setDate(new Date().getDate() - 1)),
      'yyyy-MM-dd'
    );
    
    // Per ogni contatore, prima di azzerarlo, salva il suo valore come voce storica per ieri
    for (const counter of dailyCounters) {
      // Verifica se questo contatore era attivo ieri
      if (counter.startDate <= yesterday && (!counter.endDate || counter.endDate >= yesterday)) {
        // Verifica se non esiste già un'entry per questo contatore specifico per ieri
        const hasEntry = await CounterEntriesService.hasEntriesForDate(yesterday, currentUser.uid, counter.id);
        if (!hasEntry) {
          try {
            await addDoc(collection(db, 'counterEntries'), {
              counterId: counter.id,
              userId: currentUser.uid,
              date: yesterday,
              value: counter.currentValue,
              name: counter.name,
              timestamp: Timestamp.now()
            });
            console.log(`Salvato contatore ${counter.name} con valore ${counter.currentValue} per ieri (${yesterday})`);
          } catch (error) {
            console.error(`Errore nel salvare la voce storica per il contatore ${counter.id}:`, error);
          }
        }
      }
      
      // Azzera questo contatore per il nuovo giorno
      const counterRef = doc(db, 'counters', counter.id);
      await updateDoc(counterRef, { currentValue: 0 });
    }
  };

  // Fetch user data from Firestore
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setCounters([]);
      setCounterEntries([]);
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
      setCounters(countersData);
    });
    
    // Recupera le voci storiche dei contatori
    const fetchCounterEntries = async () => {
      try {
        const entries = await CounterEntriesService.getAllCounterEntries(currentUser.uid);
        setCounterEntries(entries);
      } catch (error) {
        console.error("Errore nel recuperare le voci storiche dei contatori:", error);
      }
    };
    
    fetchCounterEntries();

    // Check if daily counters need to be reset
    const checkAndResetCounters = async () => {
      // Recupera le impostazioni utente per sapere quando è stato fatto l'ultimo reset
      const lastResetDoc = await getDocs(
        query(collection(db, 'userSettings'), where('userId', '==', currentUser.uid))
      );
      
      const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
      
      if (!lastResetDoc.empty) {
        const userSettings = lastResetDoc.docs[0].data();
        const lastReset = userSettings.lastCounterReset;
        
        if (lastReset !== today) {
          // Prima, verifica se abbiamo già salvato i contatori per l'ultimo giorno
          // Oggi è un nuovo giorno rispetto all'ultimo reset
          // I valori attuali dei contatori sono per il giorno precedente (ieri)
          // quindi prima li salviamo, poi li resettiamo per il nuovo giorno
          
          // Usa direttamente il metodo resetDailyCounters che ora include il salvataggio dello stato precedente
          await resetDailyCounters();
          await updateDoc(lastResetDoc.docs[0].ref, { lastCounterReset: today });
          console.log(`Reset completato: contatori azzerati per il nuovo giorno ${today}`);
        }
      } else {
        // Create settings document if it doesn't exist
        await addDoc(collection(db, 'userSettings'), {
          userId: currentUser.uid,
          lastCounterReset: today
        });
      }
    };
    
    checkAndResetCounters();
    
    // Imposta un timer per verificare il reset dei contatori alla mezzanotte
    const setMidnightCheck = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const timeToMidnight = midnight.getTime() - now.getTime();
      
      console.log(`Prossimo reset programmato tra ${Math.floor(timeToMidnight / 60000)} minuti`);
      
      setTimeout(() => {
        console.log("È mezzanotte: controllo se i contatori devono essere resettati");
        checkAndResetCounters();
        setMidnightCheck(); // Reimpostazione per il giorno successivo
      }, timeToMidnight);
    };
    
    setMidnightCheck();
    
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

  const addCounter = async (counterData: Omit<Counter, 'id' | 'currentValue'>) => {
    if (!currentUser) return;
  
    // Per tutti i contatori, semplicemente aggiungiamo un singolo contatore che verrà gestito
    // correttamente con il salvataggio delle statistiche giornaliere e reset a fine giornata
    const newCounter = {
      ...counterData,
      currentValue: 0,
      userId: currentUser.uid,
      createdAt: new Date(),
    };
  
    await addDoc(collection(db, 'counters'), newCounter);
  };

  const incrementCounter = async (counterId: string) => {
    if (!currentUser) return;
    
    const counterToIncrement = counters.find(counter => counter.id === counterId);
    if (!counterToIncrement) return;
    
    const newValue = counterToIncrement.currentValue + 1;
    const counterRef = doc(db, 'counters', counterId);
    await updateDoc(counterRef, {
      currentValue: newValue
    });

    // Verifica se è stato raggiunto l'obiettivo
    if (counterToIncrement.goal && newValue >= counterToIncrement.goal) {
      // Crea una notifica per l'obiettivo raggiunto
      await appNotificationService.createCounterNotification(
        currentUser.uid,
        'Obiettivo raggiunto!',
        `Hai raggiunto l'obiettivo di ${counterToIncrement.goal} per "${counterToIncrement.name}"`,
        counterId
      );
    }
  };

  const decrementCounter = async (counterId: string) => {
    if (!currentUser) return;
    
    const counterToDecrement = counters.find(counter => counter.id === counterId);
    if (!counterToDecrement || counterToDecrement.currentValue <= 0) return;
    
    const counterRef = doc(db, 'counters', counterId);
    await updateDoc(counterRef, {
      currentValue: counterToDecrement.currentValue - 1
    });
  };

  const deleteCounter = async (counterId: string) => {
    if (!currentUser) return;
    
    const counterRef = doc(db, 'counters', counterId);
    await deleteDoc(counterRef);
  };

  const resetAllData = async () => {
    if (!currentUser) return;
    
    // Cancella tutte le notifiche
    notificationService.clearAllNotifications();
    
    // Delete all tasks
    for (const task of tasks) {
      await deleteDoc(doc(db, 'tasks', task.id));
    }
    
    // Delete all counters
    for (const counter of counters) {
      await deleteDoc(doc(db, 'counters', counter.id));
    }
  };
  
  const resetAllCounters = async () => {
    if (!currentUser) return;
    
    // Delete all counters
    for (const counter of counters) {
      await deleteDoc(doc(db, 'counters', counter.id));
    }
    
    try {
      // Crea una notifica per informare l'utente
      // Passiamo una stringa vuota per il relatedId opzionale
      await appNotificationService.createSystemNotification(
        currentUser.uid,
        'Contatori eliminati',
        'Tutti i contatori sono stati eliminati con successo'
      );
    } catch (error) {
      console.error('Errore nella creazione della notifica:', error);
    }
  };
  
  const getCounterHistory = async (counterId: string): Promise<CounterEntry[]> => {
    if (!currentUser) return [];
    
    return await CounterEntriesService.getCounterEntriesById(counterId, currentUser.uid);
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
    counterEntries,
    isLoading,
    addTask,
    toggleTaskComplete,
    addCounter,
    incrementCounter,
    decrementCounter,
    deleteTask,
    deleteCounter,
    resetDailyCounters,
    resetAllData,
    resetAllCounters,
    deleteRoutineOccurrence,
    getCounterHistory,
    // Nuovi metodi per le notifiche
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