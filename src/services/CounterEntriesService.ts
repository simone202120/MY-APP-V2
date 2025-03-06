// services/CounterEntriesService.ts
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CounterEntry, Counter } from '../types';
import { format } from 'date-fns';

class CounterEntriesService {
  private static instance: CounterEntriesService;
  
  private constructor() {}
  
  public static getInstance(): CounterEntriesService {
    if (!CounterEntriesService.instance) {
      CounterEntriesService.instance = new CounterEntriesService();
    }
    return CounterEntriesService.instance;
  }
  
  /**
   * Salva i dati di un contatore prima del reset
   * @param counterId ID del contatore
   * @param userId ID dell'utente
   * @param name Nome del contatore (opzionale)
   * @param value Valore corrente del contatore
   * @param note Nota opzionale
   * @returns Promise<string> ID dell'entry creato
   */
  public async saveCounterEntry(
    counter: Counter,
    note?: string
  ): Promise<string> {
    try {
      // Oggi in formato yyyy-MM-dd
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Crea il documento per l'entry del contatore
      const counterEntry: Omit<CounterEntry, 'id'> = {
        counterId: counter.id,
        userId: counter.userId,
        name: counter.name,
        value: counter.currentValue,
        date: today,
        timestamp: Timestamp.now(),
        note: note || undefined
      };
      
      // Salva l'entry in Firestore
      const docRef = await addDoc(collection(db, 'counterEntries'), counterEntry);
      
      console.log('Valore contatore salvato:', counter.name, counter.currentValue);
      
      return docRef.id;
    } catch (error) {
      console.error('Errore durante il salvataggio del valore del contatore:', error);
      throw error;
    }
  }
  
  /**
   * Ottiene tutte le entries per un contatore specifico
   * @param counterId ID del contatore
   * @param userId ID dell'utente
   * @returns Promise<CounterEntry[]> Array di entries
   */
  public async getEntriesForCounter(counterId: string, userId: string): Promise<CounterEntry[]> {
    try {
      // Query per ottenere le entries del contatore, ordinate per data (più recenti prima)
      const entriesQuery = query(
        collection(db, 'counterEntries'),
        where('counterId', '==', counterId),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const entriesSnapshot = await getDocs(entriesQuery);
      
      // Converti i documenti in oggetti CounterEntry
      const entries = entriesSnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        } as CounterEntry;
      });
      
      return entries;
    } catch (error) {
      console.error('Errore durante il recupero delle entries del contatore:', error);
      throw error;
    }
  }
  
  /**
   * Ottiene tutte le entries per un range di date
   * @param userId ID dell'utente
   * @param startDate Data di inizio (yyyy-MM-dd)
   * @param endDate Data di fine (yyyy-MM-dd)
   * @returns Promise<CounterEntry[]> Array di entries
   */
  public async getEntriesForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CounterEntry[]> {
    try {
      // Query per ottenere le entries in un range di date
      const entriesQuery = query(
        collection(db, 'counterEntries'),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      
      const entriesSnapshot = await getDocs(entriesQuery);
      
      // Converti i documenti in oggetti CounterEntry
      const entries = entriesSnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data()
        } as CounterEntry;
      });
      
      return entries;
    } catch (error) {
      console.error('Errore durante il recupero delle entries per range di date:', error);
      throw error;
    }
  }
}

export default CounterEntriesService;