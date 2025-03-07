// pages/CalendarPage.tsx (modificato per la gestione delle ricorrenze)
import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO
} from 'date-fns';
import it from 'date-fns/locale/it';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "../components/ui/button";
import TaskItem from '../components/tasks/TaskItem';
import CounterItem from '../components/counters/CounterItem';
import { useApp } from '../context/AppContext';
import { isTaskScheduledForDate } from '../utils/TaskUtils'; // Importa la nuova utility

const CalendarPage = () => {
  const { 
    tasks, 
    counters,
    toggleTaskComplete, 
    deleteTask,
    deleteRoutineOccurrence,
    incrementCounter,
    decrementCounter,
    deleteCounter
  } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const monthDays = getDaysInMonth(currentDate);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isSelectedDateToday = isToday(selectedDate);

  // Filtra gli impegni per la data selezionata - MODIFICATO per usare la nuova utility
  const selectedDateTasks = tasks.filter(task => {
    if (task.type === 'oneTime') {
      return task.date === selectedDateStr;
    }
    if (task.type === 'routine') {
      return isTaskScheduledForDate(task, selectedDate);
    }
    return false;
  });

  // Funzione per controllare se un contatore è attivo per la data selezionata
  const isCounterActiveForDate = (counter: any, date: Date) => {
    // Controlla la data di inizio
    if (!counter.startDate) return false;
    
    try {
      const startDate = parseISO(counter.startDate);
      
      // Controlla range di validità
      if (counter.endDate) {
        const endDate = parseISO(counter.endDate);
        if (!isWithinInterval(date, { start: startDate, end: endDate })) {
          return false;
        }
      } else {
        // Se non c'è data di fine, controlla solo se è dopo la data di inizio
        if (date < startDate) return false;
      }
      
      // Per i contatori giornalieri, sempre valido entro il range
      if (counter.type === 'daily') return true;
      
      // Per i contatori settimanali, controlla se è lo stesso giorno della settimana
      if (counter.type === 'weekly') {
        const startDay = startDate.getDay(); // 0 = domenica, 1 = lunedì, ...
        const currentDay = date.getDay();
        return startDay === currentDay;
      }
      
      // Per i contatori mensili, controlla se è lo stesso giorno del mese
      if (counter.type === 'monthly') {
        const startDayOfMonth = startDate.getDate(); // 1-31
        const currentDayOfMonth = date.getDate();
        return startDayOfMonth === currentDayOfMonth;
      }
      
      // Per i contatori cumulativi, sempre validi entro il range
      return true;
    } catch (error) {
      console.error("Errore nel parsing delle date:", error);
      return false;
    }
  };

  // Filtra i contatori attivi per la data selezionata
  const selectedDateCounters = counters.filter((counter: any) => 
    isCounterActiveForDate(counter, selectedDate)
  ).map((counter: any) => {
    // Per i giorni futuri o passati, modifica il valore del contatore a 0
    if (!isSelectedDateToday) {
      return { ...counter, displayValue: 0 };
    }
    // Per oggi, usa il valore corrente
    return { ...counter, displayValue: counter.currentValue };
  });

  // MODIFICATO per usare la nuova utility
  const hasTasksOnDate = (date: Date) => {
    return tasks.some(task => {
      if (task.type === 'oneTime') {
        const dateStr = format(date, 'yyyy-MM-dd');
        return task.date === dateStr;
      }
      if (task.type === 'routine') {
        return isTaskScheduledForDate(task, date);
      }
      return false;
    });
  };

  const hasCountersOnDate = (date: Date) => {
    return counters.some((counter: any) => isCounterActiveForDate(counter, date));
  };

  // Verificiamo se il giorno selezionato ha eventi o contatori
  const hasContentForSelectedDate = selectedDateTasks.length > 0 || selectedDateCounters.length > 0;

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Giorni della settimana */}
        <div className="grid grid-cols-7 mb-2">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Griglia dei giorni */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const hasEvents = hasTasksOnDate(day);
            const hasCounters = hasCountersOnDate(day);
            const isDayToday = isToday(day);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square p-1 relative flex flex-col items-center justify-center
                  rounded-lg transition-colors
                  ${!isCurrentMonth && 'text-gray-400'}
                  ${isSelected ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-50'}
                  ${isDayToday && !isSelected && 'border-2 border-primary-500'}
                `}
              >
                <span className={`
                  text-sm font-medium
                  ${isSelected && 'font-bold'}
                `}>
                  {format(day, 'd')}
                </span>
                <div className="flex space-x-1 mt-1">
                  {hasEvents && (
                    <span className={`
                      w-1.5 h-1.5 rounded-full
                      ${isSelected ? 'bg-primary-600' : 'bg-primary-400'}
                    `} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenuto per la data selezionata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {format(selectedDate, 'd MMMM yyyy', { locale: it })}
        </h2>

        {/* Mostra messaggio se non ci sono né impegni né contatori */}
        {!hasContentForSelectedDate && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nessun impegno o contatore per questa data</p>
          </div>
        )}

        {/* Sezione degli impegni */}
        {selectedDateTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Impegni</h3>
            <div className="space-y-3">
              {selectedDateTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={toggleTaskComplete}
                  onDelete={deleteTask}
                  onDeleteSingleOccurrence={deleteRoutineOccurrence}
                  currentDate={selectedDateStr}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Sezione dei contatori giornalieri */}
        {selectedDateCounters.length > 0 && (
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">Contatori</h3>
            <div className="space-y-3">
              {selectedDateCounters.map((counter: any) => (
                <CounterItem
                  key={counter.id}
                  counter={{
                    ...counter,
                    currentValue: counter.displayValue !== undefined ? counter.displayValue : counter.currentValue
                  }}
                  onIncrement={isSelectedDateToday ? incrementCounter : () => {}}
                  onDecrement={isSelectedDateToday ? decrementCounter : () => {}}
                  onDelete={isSelectedDateToday ? deleteCounter : () => {}}
                  isReadOnly={!isSelectedDateToday}
                />
              ))}
              {!isSelectedDateToday && (
                <p className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded-lg">
                  {selectedDate > new Date() 
                    ? "I contatori per i giorni futuri partiranno da zero" 
                    : "I contatori possono essere modificati solo per la data odierna"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;