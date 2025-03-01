// src/services/CounterEntriesService.ts - Versione ottimizzata
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  limit,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Counter, CounterEntry } from '../types';
import { format } from 'date-fns';

export class CounterEntriesService {
  /**
   * Salva i valori correnti dei contatori giornalieri come voci storiche
   * @param counters Lista dei contatori giornalieri
   * @param userId ID dell'utente
   */
  static async saveCounterEntries(counters: Counter[], userId: string): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Filtra solo i contatori giornalieri attivi
    const dailyCounters = counters.filter(
      (counter) =>
        counter.type === 'daily' &&
        counter.startDate <= today &&
        (!counter.endDate || counter.endDate >= today)
    );
    
    // Prima, verifica se esistono già voci per oggi (evita duplicati)
    const entriesExist = await this.hasEntriesForDate(today, userId);
    if (entriesExist) {
      console.log(`Voci per la data ${today} già presenti, salto il salvataggio`);
      return;
    }
    
    // Salva ogni contatore come voce storica
    const savePromises = dailyCounters.map(counter => 
      addDoc(collection(db, 'counterEntries'), {
        counterId: counter.id,
        userId: userId,
        date: today,
        value: counter.currentValue,
        name: counter.name,
        timestamp: Timestamp.now()
      })
    );
    
    try {
      await Promise.all(savePromises);
      console.log(`Salvati ${savePromises.length} contatori per il giorno ${today}`);
    } catch (error) {
      console.error("Errore durante il salvataggio delle voci storiche:", error);
    }
  }

  /**
   * Recupera le voci storiche per tutti i contatori di un utente
   * @param userId ID dell'utente
   */
  static async getAllCounterEntries(userId: string): Promise<CounterEntry[]> {
    try {
      const entriesQuery = query(
        collection(db, 'counterEntries'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(100) // Limita il numero di risultati per performance
      );
      
      const snapshot = await getDocs(entriesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CounterEntry));
    } catch (error) {
      console.error('Errore nel recuperare le voci storiche dei contatori:', error);
      return [];
    }
  }

  /**
   * Recupera le voci storiche per un contatore specifico
   * @param counterId ID del contatore
   * @param userId ID dell'utente
   */
  static async getCounterEntriesById(counterId: string, userId: string): Promise<CounterEntry[]> {
    try {
      const entriesQuery = query(
        collection(db, 'counterEntries'),
        where('counterId', '==', counterId),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(entriesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CounterEntry));
    } catch (error) {
      console.error(`Errore nel recuperare le voci storiche per il contatore ${counterId}:`, error);
      return [];
    }
  }
  
  /**
   * Recupera le voci storiche per una data specifica
   * @param date Data da verificare (formato yyyy-MM-dd)
   * @param userId ID dell'utente
   */
  static async getEntriesByDate(date: string, userId: string): Promise<CounterEntry[]> {
    try {
      const entriesQuery = query(
        collection(db, 'counterEntries'),
        where('userId', '==', userId),
        where('date', '==', date)
      );
      
      const snapshot = await getDocs(entriesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CounterEntry));
    } catch (error) {
      console.error(`Errore nel recuperare le voci storiche per la data ${date}:`, error);
      return [];
    }
  }
  
  /**
   * Verifica se esistono voci storiche per una data specifica
   * @param date Data da verificare (formato yyyy-MM-dd)
   * @param userId ID dell'utente
   */
  static async hasEntriesForDate(date: string, userId: string): Promise<boolean> {
    try {
      const entriesQuery = query(
        collection(db, 'counterEntries'),
        where('userId', '==', userId),
        where('date', '==', date),
        limit(1) // Solo per verificare se esistono
      );
      
      const snapshot = await getDocs(entriesQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error(`Errore nel verificare le voci storiche per la data ${date}:`, error);
      return false;
    }
  }
}