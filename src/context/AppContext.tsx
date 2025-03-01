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
import { Task, Counter, TaskType, CounterType, CounterEntry } from '../types';
import { format, isToday, startOfDay } from 'date-fns';
import NotificationService from '../services/NotificationService';
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
  deleteRoutineOccurrence: (taskId: string, date: string) => Promise<void>;
  getCounterHistory: (counterId: string) => Promise<CounterEntry[]>;
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
  
  // Inizializza il servizio di notifiche
  const notificationService = NotificationService.getInstance();

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
    
    // Verifica l'esistenza di voci per questi contatori per la data odierna
    const existingEntries = counterEntries.filter(entry => 
      entry.date === today && 
      dailyCounters.some(counter => counter.id === entry.counterId)
    );
    
    // Mappa dei contatori per ID per verifiche rapide
    const existingCounterMap = new Map();
    existingEntries.forEach(entry => existingCounterMap.set(entry.counterId, true));
    
    // Salva il valore corrente di ogni contatore come voce storica
    for (const counter of dailyCounters) {
      try {
        // Evita di salvare più volte lo stesso contatore per lo stesso giorno
        if (!existingCounterMap.has(counter.id)) {
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
    
    // Seleziona solo i contatori giornalieri attivi
    const dailyCounters = counters.filter(
      counter => counter.type === 'daily' &&
      counter.startDate <= today &&
      (!counter.endDate || counter.endDate >= today)
    );
  
    // Azzera ogni contatore
    for (const counter of dailyCounters) {
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
          const yesterday = format(
            new Date(new Date().setDate(new Date().getDate() - 1)),
            'yyyy-MM-dd'
          );
          
          console.log(`Verifico se è necessario salvare i contatori per ${yesterday} prima del reset`);
          
          // Verifica se tutti i contatori giornalieri hanno già voci per ieri
          const dailyCounters = counters.filter(
            counter => counter.type === 'daily' && 
            counter.startDate <= yesterday &&
            (!counter.endDate || counter.endDate >= yesterday)
          );
          
          // Ottieni le voci salvate per ieri
          const yesterdayEntries = await CounterEntriesService.getEntriesByDate(yesterday, currentUser.uid);
          
          // Identifica i contatori che non hanno voci per ieri
          const missingCounterIds = dailyCounters
            .filter(counter => !yesterdayEntries.some(entry => entry.counterId === counter.id))
            .map(counter => counter.id);
          
          if (missingCounterIds.length > 0) {
            // Abbiamo contatori che non sono stati salvati per ieri
            console.log(`Salvataggio contatori mancanti (${missingCounterIds.length}) per ${yesterday} prima del reset`);
            
            // Salva i contatori mancanti con la data di ieri
            for (const counter of dailyCounters) {
              if (missingCounterIds.includes(counter.id)) {
                await addDoc(collection(db, 'counterEntries'), {
                  counterId: counter.id,
                  userId: currentUser.uid,
                  date: yesterday, // Usa la data di ieri
                  value: counter.currentValue, // Salva il valore corrente come valore di ieri
                  name: counter.name,
                  timestamp: Timestamp.now()
                });
                console.log(`Salvato contatore ${counter.name} con valore ${counter.currentValue} per il giorno ${yesterday}`);
              }
            }
          }
          
          // Poi resettare i contatori per il nuovo giorno
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
    
    const counterRef = doc(db, 'counters', counterId);
    await updateDoc(counterRef, {
      currentValue: counterToIncrement.currentValue + 1
    });
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
  
  const getCounterHistory = async (counterId: string): Promise<CounterEntry[]> => {
    if (!currentUser) return [];
    
    return await CounterEntriesService.getCounterEntriesById(counterId, currentUser.uid);
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
    deleteRoutineOccurrence,
    getCounterHistory
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};