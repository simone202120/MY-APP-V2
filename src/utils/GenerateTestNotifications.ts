// src/utils/GenerateTestNotifications.ts
import NotificationEntriesService from '../services/NotificationEntriesService';
import { Timestamp } from 'firebase/firestore';

/**
 * Utility per generare notifiche di test
 */
class GenerateTestNotifications {
  private static notificationService = NotificationEntriesService.getInstance();
  
  /**
   * Genera un insieme di notifiche di test per un utente
   * Utile per testare l'interfaccia delle notifiche
   * @param userId ID dell'utente per cui generare le notifiche
   * @param count Numero di notifiche da generare (default: 10)
   */
  public static async generateRandomNotifications(userId: string, count: number = 10): Promise<void> {
    const taskIds = ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'];
    const counterIds = ['counter-1', 'counter-2', 'counter-3', 'counter-4', 'counter-5'];
    
    const taskTitles = [
      'Task completato', 
      'Promemoria task', 
      'Task scaduto', 
      'Modifica al task', 
      'Nuovo task assegnato'
    ];
    
    const counterTitles = [
      'Obiettivo raggiunto!', 
      'Sei a metà dell\'obiettivo', 
      'Nuovo record!', 
      'Contatore aggiornato', 
      'Promemoria contatore'
    ];
    
    const systemTitles = [
      'Benvenuto in MyRoutine', 
      'Nuova funzionalità disponibile', 
      'Aggiornamento app', 
      'Promemoria impostazioni', 
      'Verifica account'
    ];
    
    const taskMessages = [
      'Hai completato il task "Fare la spesa" con successo.',
      'Il task "Telefonare al dottore" è in scadenza oggi.',
      'Il task "Pagare bolletta" è scaduto ieri.',
      'Il task "Riunione settimanale" è stato spostato a domani.',
      'Ti è stato assegnato un nuovo task "Preparare presentazione".'
    ];
    
    const counterMessages = [
      'Hai raggiunto l\'obiettivo di 10 bicchieri d\'acqua oggi!',
      'Sei a metà dell\'obiettivo giornaliero di passi.',
      'Nuovo record personale: 15 giorni consecutivi di meditazione!',
      'Il contatore "Calorie" è stato aggiornato.',
      'Ricordati di aggiornare il contatore "Attività fisica" oggi.'
    ];
    
    const systemMessages = [
      'Benvenuto in MyRoutine! Esplora tutte le funzionalità disponibili.',
      'Nuova funzionalità: ora puoi monitorare le tue abitudini con i grafici avanzati.',
      'L\'app è stata aggiornata alla versione 2.0 con nuove funzionalità.',
      'Ricordati di verificare le tue impostazioni di notifica.',
      'Per favore verifica il tuo indirizzo email per sbloccare tutte le funzionalità.'
    ];
    
    // Ottieni la data corrente e crea timestamp passati
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      // Determina casualmente il tipo di notifica
      const notificationType = Math.random() < 0.33 
        ? 'task' 
        : Math.random() < 0.66 
          ? 'counter' 
          : 'system';
      
      // Crea un timestamp casuale tra oggi e 30 giorni fa
      const daysAgo = Math.floor(Math.random() * 30);
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - daysAgo);
      const timestamp = Timestamp.fromDate(pastDate);
      
      // Stato di lettura casuale (più probabile che le notifiche vecchie siano lette)
      const read = daysAgo > 7 ? Math.random() < 0.8 : Math.random() < 0.3;
      
      // Genera i dati della notifica in base al tipo
      let title = '';
      let message = '';
      let relatedId: string | undefined;
      
      if (notificationType === 'task') {
        const randomIndex = Math.floor(Math.random() * taskTitles.length);
        title = taskTitles[randomIndex];
        message = taskMessages[randomIndex];
        relatedId = taskIds[Math.floor(Math.random() * taskIds.length)];
      } 
      else if (notificationType === 'counter') {
        const randomIndex = Math.floor(Math.random() * counterTitles.length);
        title = counterTitles[randomIndex];
        message = counterMessages[randomIndex];
        relatedId = counterIds[Math.floor(Math.random() * counterIds.length)];
      }
      else {
        const randomIndex = Math.floor(Math.random() * systemTitles.length);
        title = systemTitles[randomIndex];
        message = systemMessages[randomIndex];
      }
      
      // Crea direttamente il documento della notifica con il timestamp personalizzato
      await this.notificationService.createNotificationWithCustomTimestamp(
        userId,
        title,
        message,
        notificationType,
        timestamp,
        read,
        relatedId
      );
    }
  }
  
  /**
   * Genera notifiche di esempio per ogni tipo (task, counter, system)
   * @param userId ID dell'utente per cui generare le notifiche
   */
  public static async generateExampleNotifications(userId: string): Promise<void> {
    // Notifiche di sistema
    await this.notificationService.createSystemNotification(
      userId,
      'Benvenuto in MyRoutine',
      'Grazie per aver installato MyRoutine. Esplora tutte le funzionalità disponibili!'
    );
    
    await this.notificationService.createSystemNotification(
      userId,
      'Nuova funzionalità disponibile',
      'Ora puoi gestire le tue notifiche in modo più efficiente. Prova le nuove opzioni!'
    );
    
    // Notifiche di task
    await this.notificationService.createTaskNotification(
      userId,
      'Task completato',
      'Hai completato il task "Meditazione mattutina" con successo.',
      'task-1'
    );
    
    await this.notificationService.createTaskNotification(
      userId,
      'Promemoria task',
      'Non dimenticare di completare il task "Fare la spesa" entro oggi.',
      'task-2'
    );
    
    // Notifiche di contatore
    await this.notificationService.createCounterNotification(
      userId,
      'Obiettivo raggiunto!',
      'Hai raggiunto l\'obiettivo di 10 bicchieri d\'acqua oggi!',
      'counter-1'
    );
    
    await this.notificationService.createCounterNotification(
      userId,
      'Nuovo record!',
      'Hai stabilito un nuovo record: 7 giorni consecutivi di allenamento!',
      'counter-2'
    );
  }
}

export default GenerateTestNotifications;