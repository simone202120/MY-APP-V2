// pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from "../components/ui/button";
import TaskItem from '../components/tasks/TaskItem';
import CounterItem from '../components/counters/CounterItem';
import { useApp } from '../context/AppContext';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { isTaskScheduledForDate, isTaskCompletedForDate } from '../utils/TaskUtils';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
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
  
  // Stato per le sezioni collassabili
  const [expandedSections, setExpandedSections] = useState({
    tasks: true,
    counters: true
  });
  
  // Stato per tenere traccia dell'ultimo task completato per mostrare un feedback
  const [lastCompleted, setLastCompleted] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDate = new Date();
  
  // Filtra i contatori attivi per oggi
  const todayCounters = counters.filter(counter => {
    // Per i contatori cumulativi, controlla solo che siano attivi
    if (counter.type === 'cumulative') {
      // Se non ha startDate è sempre attivo
      if (!counter.startDate) return true;
      
      try {
        const startDate = parseISO(counter.startDate);
        const endDate = counter.endDate ? parseISO(counter.endDate) : null;
        
        // Verifica se la data corrente è dopo la data di inizio
        const isAfterStart = currentDate >= startDate;
        
        // Se c'è una data di fine, verifica che la data corrente sia prima
        const isBeforeEnd = endDate ? currentDate <= endDate : true;
        
        return isAfterStart && isBeforeEnd;
      } catch (error) {
        console.error("Errore nella validazione delle date del contatore:", error);
        return false;
      }
    }
    
    // Per i contatori periodici (daily, weekly, monthly)
    if (counter.type === 'daily' || counter.type === 'weekly' || counter.type === 'monthly') {
      // Se non ha startDate è sempre attivo
      if (!counter.startDate) return true;
      
      try {
        const startDate = parseISO(counter.startDate);
        const endDate = counter.endDate ? parseISO(counter.endDate) : null;
        
        // Verifica se la data corrente è nell'intervallo
        if (endDate) {
          return isWithinInterval(currentDate, { start: startDate, end: endDate });
        } else {
          return currentDate >= startDate;
        }
      } catch (error) {
        console.error("Errore nella validazione delle date del contatore:", error);
        return false;
      }
    }
    
    return false;
  });

  // Modificata la logica di filtraggio per utilizzare l'utility
  const todayTasks = tasks.filter(task => {
    if (task.type === 'oneTime') {
      return task.date === today;
    }
    if (task.type === 'routine') {
      return isTaskScheduledForDate(task, currentDate);
    }
    return false;
  });
  
  // Ordina i task: prima quelli non completati, poi quelli completati
  const sortedTasks = [...todayTasks].sort((a, b) => {
    const aCompleted = a.type === 'oneTime' ? a.isCompleted : isTaskCompletedForDate(a, today);
    const bCompleted = b.type === 'oneTime' ? b.isCompleted : isTaskCompletedForDate(b, today);
    return Number(aCompleted) - Number(bCompleted);
  });

  // Aggiornato per usare isTaskCompletedForDate
  const completedTodayTasks = todayTasks.filter(task => {
    if (task.type === 'oneTime') {
      return task.isCompleted;
    }
    return isTaskCompletedForDate(task, today);
  });
  
  const completionPercentage = todayTasks.length > 0 
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) 
    : 0;
    
  // Funzione wrapper per toggle task con feedback
  const handleToggleTask = (taskId: string, date?: string) => {
    toggleTaskComplete(taskId, date);
    setLastCompleted(taskId);
    
    // Rimuovi la notifica dopo 2 secondi
    setTimeout(() => {
      setLastCompleted(null);
    }, 2000);
  };
  
  // Funzione per tornare all'inizio quando si completa un task
  useEffect(() => {
    if (lastCompleted) {
      // Torna all'inizio della pagina con uno scroll fluido
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [lastCompleted]);
  
  // Toggle per le sezioni espandibili
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Notification Toast per feedback completamento */}
      <AnimatePresence>
        {lastCompleted && (
          <motion.div 
            className="fixed top-4 left-4 right-4 z-50 bg-green-50 border border-green-200 p-3 rounded-lg shadow-lg flex items-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <CheckCircle className="text-green-500 mr-2 h-5 w-5" />
            <p className="text-green-800 text-sm font-medium">Impegno completato!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Summary - Sempre visibile */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Il tuo progresso</h2>
            <p className="text-sm text-gray-500">
              {format(new Date(), 'EEEE d MMMM', { locale: it })}
            </p>
          </div>
          <div className="h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center">
            <div className="relative">
              <svg className="h-12 w-12">
                <circle
                  className="text-gray-200"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="24"
                  cy="24"
                />
                <circle
                  className="text-primary-500"
                  strokeWidth="5"
                  strokeDasharray={125}
                  strokeDashoffset={125 - (125 * completionPercentage) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="24"
                  cy="24"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Il pulsante Quick Action FAB è stato rimosso */}
      </div>

      {/* Contatori Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('counters')}
        >
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">I tuoi contatori attivi</h2>
            <span className="ml-2 text-sm bg-secondary-50 text-secondary-700 px-2 py-0.5 rounded-full">
              {todayCounters.length}
            </span>
          </div>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="text-gray-500 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/create-counter');
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-gray-500">
              {expandedSections.counters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {expandedSections.counters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="p-4 space-y-3">
                {todayCounters.length > 0 ? (
                  todayCounters.map(counter => (
                    <CounterItem
                      key={counter.id}
                      counter={counter}
                      onIncrement={incrementCounter}
                      onDecrement={decrementCounter}
                      onDelete={deleteCounter}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">Nessun contatore attivo</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate('/create-counter')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi contatore
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tasks Section - Con intestazione collassabile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer" 
          onClick={() => toggleSection('tasks')}
        >
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">I tuoi impegni oggi</h2>
            <span className="ml-2 text-sm bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
              {completedTodayTasks.length}/{todayTasks.length}
            </span>
          </div>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="text-gray-500 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/create-task');
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-gray-500">
              {expandedSections.tasks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {expandedSections.tasks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="p-4 space-y-3">
                {sortedTasks.length > 0 ? (
                  sortedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onComplete={handleToggleTask}
                      onDelete={deleteTask}
                      onDeleteSingleOccurrence={deleteRoutineOccurrence}
                      currentDate={today}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">Nessun impegno per oggi</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate('/create-task')}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi impegno
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default HomePage;