// src/components/statistics/InsightsPanel.tsx
import React, { useMemo } from 'react';
import { 
  format, parseISO, getDay, differenceInDays
} from 'date-fns';
import { Task, Counter, CounterEntry } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { 
  Lightbulb, Clock, Calendar, Trophy, AlertTriangle, TrendingUp, Zap, Coffee, Target
} from 'lucide-react';

interface InsightsPanelProps {
  tasks: Task[];
  counters: Counter[];
  counterEntries: CounterEntry[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  tasks, 
  counters, 
  counterEntries 
}) => {
  // Helper function per sottrarre giorni da una data
  const subDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(date.getDate() - days);
    return result;
  };
  
  // Calcola la streak corrente (giorni consecutivi con almeno un task completato)
  const calculateCurrentStreak = (taskList: Task[]): number => {
    // Costruisci un set di date completate
    const completedDates = new Set<string>();
    
    taskList.forEach(task => {
      if (task.type === 'oneTime' && task.isCompleted && task.date) {
        completedDates.add(task.date);
      } else if (task.type === 'routine' && task.completedDates) {
        task.completedDates.forEach(date => completedDates.add(date));
      }
    });
    
    // Controlla se oggi ha completamenti
    const today = format(new Date(), 'yyyy-MM-dd');
    let streakDays = completedDates.has(today) ? 1 : 0;
    
    // Se non ci sono completamenti oggi, la streak è 0
    if (streakDays === 0) return 0;
    
    // Altrimenti, conta indietro i giorni
    let checkDate = subDays(new Date(), 1);
    while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      streakDays++;
      checkDate = subDays(checkDate, 1);
    }
    
    return streakDays;
  };

  // Funzione per calcolare le statistiche di completamento per ora del giorno
  const calculateHourlyTaskCompletion = (tasks: Task[]) => {
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let totalWithTimeInfo = 0;
    
    tasks.forEach(task => {
      if (task.type === 'oneTime' && task.isCompleted && task.time) {
        const hour = parseInt(task.time.split(':')[0], 10);
        totalWithTimeInfo++;
        
        if (hour >= 6 && hour < 12) {
          morningCount++;
        } else if (hour >= 12 && hour < 18) {
          afternoonCount++;
        } else {
          eveningCount++; // 0-6 o 18-24
        }
      }
    });
    
    // Se non abbiamo abbastanza dati, usiamo distribuzioni stimate
    if (totalWithTimeInfo < 5) {
      // Cerca di stimare in base alle date di completamento
      tasks.forEach(task => {
        if (task.type === 'routine' && task.completedDates && task.completedDates.length > 0) {
          // Distribuzione approssimativa
          const completions = task.completedDates.length;
          morningCount += Math.round(completions * 0.4); // Stima: 40% al mattino
          afternoonCount += Math.round(completions * 0.3); // Stima: 30% pomeriggio
          eveningCount += Math.round(completions * 0.3); // Stima: 30% sera
          totalWithTimeInfo += completions;
        }
      });
    }
    
    // Calcola le percentuali
    const morningPercentage = totalWithTimeInfo > 0 ? Math.round((morningCount / totalWithTimeInfo) * 100) : 33;
    const afternoonPercentage = totalWithTimeInfo > 0 ? Math.round((afternoonCount / totalWithTimeInfo) * 100) : 33;
    const eveningPercentage = totalWithTimeInfo > 0 
      ? Math.round((eveningCount / totalWithTimeInfo) * 100) 
      : (100 - morningPercentage - afternoonPercentage); // Assicurati che sommi a 100%
    
    return { morningPercentage, afternoonPercentage, eveningPercentage, totalWithTimeInfo };
  };

  // Trova un contatore vicino al suo obiettivo
  const findNearGoalCounter = (counters: Counter[]) => {
    // Filtra contatori con obiettivo
    const countersWithGoals = counters.filter(counter => 
      counter.goal && counter.goal > counter.currentValue
    );
    
    // Calcola la percentuale di completamento
    const withCompletion = countersWithGoals.map(counter => ({
      ...counter,
      completionPercentage: (counter.currentValue / counter.goal!) * 100
    }));
    
    // Trova il contatore più vicino all'obiettivo (>70%)
    return withCompletion.find(counter => 
      counter.completionPercentage >= 70 && counter.completionPercentage < 100
    );
  };

  // Trova task mai completati
  const findNeverCompletedTasks = (tasks: Task[]) => {
    // Solo task con almeno 14 giorni di vita
    const olderTasks = tasks.filter(task => {
      if (!task.startDate) return false;
      
      const startDate = parseISO(task.startDate);
      const daysSinceStart = differenceInDays(new Date(), startDate);
      return daysSinceStart >= 14;
    });
    
    // Filtra quelli mai completati
    return olderTasks.filter(task => {
      if (task.type === 'oneTime') {
        return !task.isCompleted;
      } else if (task.type === 'routine') {
        return !task.completedDates || task.completedDates.length === 0;
      }
      return false;
    });
  };

  const insights = useMemo(() => {
    const insightsList: Array<{
      id: string; 
      title: string; 
      description: string; 
      icon: React.ReactNode;
      suggestion: string;
    }> = [];
    
    // Calcola la streak attuale
    const streakValue = calculateCurrentStreak(tasks);
    
    // 1. Trova il giorno della settimana più produttivo
    const weekdayCounts = Array(7).fill(0);
    let totalCompletedTasks = 0;
    
    tasks.forEach(task => {
      if (task.type === 'oneTime' && task.isCompleted && task.date) {
        const date = parseISO(task.date);
        const dayIndex = getDay(date);
        weekdayCounts[dayIndex]++;
        totalCompletedTasks++;
      } else if (task.type === 'routine' && task.completedDates && task.completedDates.length > 0) {
        task.completedDates.forEach(dateStr => {
          const date = parseISO(dateStr);
          const dayIndex = getDay(date);
          weekdayCounts[dayIndex]++;
          totalCompletedTasks++;
        });
      }
    });
    
    // Trova il giorno più produttivo
    let maxDayIndex = 0;
    let maxDayCount = 0;
    
    weekdayCounts.forEach((count, index) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        maxDayIndex = index;
      }
    });
    
    // Genera l'insight solo se abbiamo abbastanza dati
    if (totalCompletedTasks > 5 && maxDayCount > 0) {
      const weekdays = [
        'domenica', 'lunedì', 'martedì', 'mercoledì', 
        'giovedì', 'venerdì', 'sabato'
      ];
      
      const percentage = Math.round((maxDayCount / totalCompletedTasks) * 100);
      
      if (percentage > 20) { // Il giorno rappresenta una percentuale significativa
        insightsList.push({
          id: 'most-productive-day',
          title: `Il ${weekdays[maxDayIndex]} è il tuo giorno più produttivo`,
          description: `Completi il ${percentage}% dei tuoi impegni di ${weekdays[maxDayIndex]}.`,
          icon: <Calendar className="h-5 w-5 text-primary-500" />,
          suggestion: `Prova a pianificare i task più impegnativi di ${weekdays[maxDayIndex]}.`
        });
      }
    }
    
    // 2. Verifica se ci sono routine con basso tasso di completamento
    const routineTasks = tasks.filter(task => task.type === 'routine');
    const lowCompletionRoutines = routineTasks.filter(task => {
      if (!task.completedDates) return true;
      
      // Stima il tasso di completamento (approssimativo)
      if (task.startDate) {
        const startDate = parseISO(task.startDate);
        const today = new Date();
        const daysSinceStart = Math.max(1, differenceInDays(today, startDate));
        
        // Per task settimanali
        if (task.weekdays && task.weekdays.length > 0) {
          // Numero approssimativo di occorrenze attese
          const daysPerWeek = task.weekdays.length;
          const expectedOccurrences = Math.round(daysSinceStart * (daysPerWeek / 7));
          
          if (expectedOccurrences > 3 && task.completedDates.length / expectedOccurrences < 0.3) {
            return true;
          }
        } 
        // Per altri task ricorrenti
        else if (daysSinceStart > 14 && task.completedDates.length < 2) {
          return true;
        }
      }
      
      return false;
    });
    
    if (lowCompletionRoutines.length > 0) {
      // Prendi la prima per semplicità
      const exampleTask = lowCompletionRoutines[0];
      
      insightsList.push({
        id: 'low-completion-routine',
        title: 'Routine con basso completamento',
        description: `"${exampleTask.title}" e altre ${lowCompletionRoutines.length - 1} routine hanno un basso tasso di completamento.`,
        icon: <AlertTriangle className="h-5 w-5 text-tertiary-500" />,
        suggestion: 'Considera di ridurre la frequenza o modificare queste routine.'
      });
    }
    
    // 3. Contatori con trend significativi
    if (counterEntries.length > 10) {
      // Mappa i contatori per ID
      const counterMap = new Map<string, Counter>();
      counters.forEach(counter => counterMap.set(counter.id, counter));
      
      // Trova contatori con trend significativi
      const counterTrends = new Map<string, { 
        name: string, 
        trend: 'up' | 'down', 
        percentage: number 
      }>();
      
      // Raggruppa le voci per contatore
      const entriesByCounter = new Map<string, CounterEntry[]>();
      
      counterEntries.forEach(entry => {
        if (!entriesByCounter.has(entry.counterId)) {
          entriesByCounter.set(entry.counterId, []);
        }
        entriesByCounter.get(entry.counterId)?.push(entry);
      });
      
      // Analizza ogni contatore con abbastanza dati
      entriesByCounter.forEach((entries, counterId) => {
        if (entries.length < 5) return; // Richiedi almeno 5 punti dati
        
        // Ordina per data
        entries.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
        
        // Prendi gli ultimi 10 punti (o meno se non ne abbiamo abbastanza)
        const recentEntries = entries.slice(-10);
        
        if (recentEntries.length < 5) return;
        
        // Dividi a metà per confrontare
        const midPoint = Math.floor(recentEntries.length / 2);
        const firstHalf = recentEntries.slice(0, midPoint);
        const secondHalf = recentEntries.slice(midPoint);
        
        // Calcola le medie
        const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.value, 0) / secondHalf.length;
        
        // Calcola la variazione percentuale
        const percentChange = firstAvg === 0 
          ? 100 
          : Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
        
        // Registra trend significativi (>20% di cambiamento)
        if (Math.abs(percentChange) > 20) {
          const counterName = counterMap.get(counterId)?.name || 
                              entries[0].name || 
                              'Contatore';
          
          counterTrends.set(counterId, {
            name: counterName,
            trend: percentChange > 0 ? 'up' : 'down',
            percentage: Math.abs(percentChange)
          });
        }
      });
      
      // Aggiungi insights per i trend significativi
      if (counterTrends.size > 0) {
        // Prendi il trend più significativo
        let mostSignificantCounter = { id: '', data: { name: '', trend: 'up' as 'up' | 'down', percentage: 0 } };
        
        counterTrends.forEach((data, id) => {
          if (data.percentage > mostSignificantCounter.data.percentage) {
            mostSignificantCounter = { id, data: { ...data } };
          }
        });
        
        const { name, trend, percentage } = mostSignificantCounter.data;
        
        insightsList.push({
          id: 'significant-counter-trend',
          title: `"${name}" sta ${trend === 'up' ? 'aumentando' : 'diminuendo'}`,
          description: `Il contatore "${name}" ha ${trend === 'up' ? 'aumentato' : 'diminuito'} del ${percentage}% recentemente.`,
          icon: <TrendingUp className="h-5 w-5 text-primary-500" />,
          suggestion: trend === 'up' 
            ? 'Continua così! Stai facendo progressi significativi.' 
            : 'Potrebbe essere utile rivedere la tua strategia per questo obiettivo.'
        });
      }
    }
    
    // 4. Serie consecutive (streak) attuale
    if (streakValue > 3) {
      insightsList.push({
        id: 'current-streak',
        title: `Sei in serie da ${streakValue} giorni!`,
        description: `Hai completato almeno un impegno ogni giorno per ${streakValue} giorni consecutivi.`,
        icon: <Zap className="h-5 w-5 text-secondary-500" />,
        suggestion: 'Continua così per mantenere la tua serie attiva.'
      });
    }
    
    // 5. Consigli basati sulle ore del giorno
    const hourlyTaskCompletion = calculateHourlyTaskCompletion(tasks);
    
    if (hourlyTaskCompletion.morningPercentage > hourlyTaskCompletion.eveningPercentage + 20) {
      insightsList.push({
        id: 'morning-person',
        title: 'Sei più produttivo al mattino',
        description: `Completi il ${hourlyTaskCompletion.morningPercentage}% dei tuoi impegni nelle ore mattutine (6-12).`,
        icon: <Coffee className="h-5 w-5 text-tertiary-500" />,
        suggestion: 'Programma i task più impegnativi nelle prime ore del giorno.'
      });
    } else if (hourlyTaskCompletion.eveningPercentage > hourlyTaskCompletion.morningPercentage + 20) {
      insightsList.push({
        id: 'evening-person',
        title: 'Sei più produttivo la sera',
        description: `Completi il ${hourlyTaskCompletion.eveningPercentage}% dei tuoi impegni nelle ore serali (18-24).`,
        icon: <Clock className="h-5 w-5 text-secondary-500" />,
        suggestion: 'Riserva le attività che richiedono più concentrazione per la sera.'
      });
    }
    
    // 6. Suggerimento basato sul prossimo obiettivo raggiungibile
    const nearGoalCounter = findNearGoalCounter(counters);
    
    if (nearGoalCounter) {
      const remaining = nearGoalCounter.goal! - nearGoalCounter.currentValue;
      insightsList.push({
        id: 'near-goal',
        title: 'Obiettivo quasi raggiunto!',
        description: `Ti mancano solo ${remaining} per raggiungere il tuo obiettivo di ${nearGoalCounter.goal} per "${nearGoalCounter.name}".`,
        icon: <Target className="h-5 w-5 text-primary-500" />,
        suggestion: `Concentrati su questo contatore per raggiungere presto l'obiettivo.`
      });
    }
    
    // 7. Impegni che non completi mai
    const neglectedTasks = findNeverCompletedTasks(tasks);
    
    if (neglectedTasks.length > 0) {
      insightsList.push({
        id: 'neglected-tasks',
        title: 'Impegni trascurati',
        description: `Hai ${neglectedTasks.length} impegni che non hai mai completato.`,
        icon: <AlertTriangle className="h-5 w-5 text-tertiary-500" />,
        suggestion: 'Considera di semplificare o rimuovere questi impegni dal tuo elenco.'
      });
    }
    
    // Se non abbiamo trovato insight significativi, aggiungiamo un messaggio generico
    if (insightsList.length === 0) {
      insightsList.push({
        id: 'not-enough-data',
        title: 'Continua a tracciare le tue attività',
        description: 'Non abbiamo ancora abbastanza dati per generare insight significativi.',
        icon: <Lightbulb className="h-5 w-5 text-primary-500" />,
        suggestion: 'Continua a registrare i tuoi impegni e contatori per sbloccare insight personalizzati.'
      });
    }
    
    return insightsList;
  }, [tasks, counters, counterEntries, calculateCurrentStreak]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Lightbulb className="h-6 w-6 text-primary-500 mr-2" />
        <h3 className="text-lg font-semibold">Insights e suggerimenti</h3>
      </div>
      
      {/* Lista insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map(insight => (
          <Card key={insight.id} className="border border-gray-100">
            <CardHeader className="pb-2 flex flex-row items-center space-x-2">
              <div className="mr-2">{insight.icon}</div>
              <CardTitle className="text-base">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
              <div className="text-sm bg-gray-50 p-2 rounded-md text-gray-700 flex items-start">
                <Trophy className="h-4 w-4 mr-2 text-secondary-500 mt-0.5 flex-shrink-0" />
                <p>{insight.suggestion}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {insights.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          <p>Non ci sono ancora dati sufficienti per generare insights significativi.</p>
          <p className="text-sm mt-2">Continua a utilizzare l'app per sbloccare suggerimenti personalizzati.</p>
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500 mt-6">
        <p>
          Gli insights e i suggerimenti sono generati automaticamente in base ai tuoi dati. 
          Più utilizzi l'app, più accurati e personalizzati diventeranno questi suggerimenti.
        </p>
      </div>
    </div>
  );
};

export default InsightsPanel;