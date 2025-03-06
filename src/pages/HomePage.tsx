// pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, ChevronUp, CheckCircle, Target } from 'lucide-react';
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
    <div className="space-y-8 pb-24">
      {/* Notification Toast per feedback completamento */}
      <AnimatePresence>
        {lastCompleted && (
          <motion.div 
            className="fixed top-6 inset-x-0 z-50 flex justify-center"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 12 }}
          >
            <div className="bg-green-50 border border-green-200 p-3 px-5 rounded-full shadow-xl flex items-center max-w-xs mx-auto">
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <CheckCircle className="text-green-600 h-4 w-4" />
              </div>
              <p className="text-green-800 text-sm font-medium">Impegno completato!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header con animazione */}
      <motion.div 
        className="card p-6 rounded-2xl bg-gradient-card shadow-md relative overflow-hidden border border-gray-100/70"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Background blob decorations */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-gradient-accent-soft rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-secondary-100/30 rounded-full opacity-50 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-2xl font-display font-bold gradient-text">
                Buon {format(new Date(), 'EEEE', { locale: it })}!
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {format(new Date(), 'd MMMM yyyy', { locale: it })}
              </p>
            </div>
            
            <div className="h-14 w-14 relative">
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gray-50">
                <svg className="h-12 w-12">
                  <circle
                    className="text-gray-100"
                    strokeWidth="5"
                    stroke="currentColor"
                    fill="transparent"
                    r="20"
                    cx="24"
                    cy="24"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: 125 }}
                    animate={{ strokeDashoffset: 125 - (125 * completionPercentage) / 100 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="text-primary-500"
                    strokeWidth="5"
                    strokeDasharray={125}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="20"
                    cx="24"
                    cy="24"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-800">
                    {completionPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistiche per oggi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center mr-3">
                  <CheckCircle className="h-4 w-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Impegni</p>
                  <p className="font-medium text-gray-900">{completedTodayTasks.length}/{todayTasks.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-secondary-50 flex items-center justify-center mr-3">
                  <Target className="h-4 w-4 text-secondary-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Contatori</p>
                  <p className="font-medium text-gray-900">{todayCounters.length} attivi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contatori Section */}
      <motion.div 
        className="card card-hover shadow-card rounded-2xl overflow-hidden border border-gray-200/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div 
          className="p-5 flex justify-between items-center cursor-pointer bg-gradient-to-r from-white to-secondary-50/20" 
          onClick={() => toggleSection('counters')}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center mr-3 shadow-sm">
              <Target className="h-5 w-5 text-secondary-600" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-gray-800">I tuoi contatori</h2>
              <p className="text-sm text-gray-500">Tieni traccia delle tue attività quotidiane</p>
            </div>
            <div className="ml-3 badge badge-secondary flex items-center">
              <span>{todayCounters.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm hover:shadow border border-gray-200 text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/create-counter');
              }}
            >
              <Plus className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm hover:shadow border border-gray-200 text-gray-500"
            >
              {expandedSections.counters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
        
        <AnimatePresence>
          {expandedSections.counters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="p-5 space-y-4">
                {todayCounters.length > 0 ? (
                  todayCounters.map((counter, index) => (
                    <motion.div
                      key={counter.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <CounterItem
                        counter={counter}
                        onIncrement={incrementCounter}
                        onDecrement={decrementCounter}
                        onDelete={deleteCounter}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Target className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-2">Nessun contatore attivo</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Crea contatori per tenere traccia delle tue attività quotidiane</p>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button 
                        variant="default"
                        className="bg-gradient-accent shadow-colored rounded-xl"
                        onClick={() => navigate('/create-counter')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi contatore
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tasks Section */}
      <motion.div 
        className="card card-hover shadow-card rounded-2xl overflow-hidden border border-gray-200/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div 
          className="p-5 flex justify-between items-center cursor-pointer bg-gradient-to-r from-white to-primary-50/20" 
          onClick={() => toggleSection('tasks')}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mr-3 shadow-sm">
              <CheckCircle className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-gray-800">I tuoi impegni oggi</h2>
              <p className="text-sm text-gray-500">Le attività della tua giornata</p>
            </div>
            <div className="ml-3 badge badge-primary flex items-center">
              <span>{completedTodayTasks.length}/{todayTasks.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm hover:shadow border border-gray-200 text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/create-task');
              }}
            >
              <Plus className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm hover:shadow border border-gray-200 text-gray-500"
            >
              {expandedSections.tasks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
        
        <AnimatePresence>
          {expandedSections.tasks && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="p-5 space-y-4">
                {sortedTasks.length > 0 ? (
                  sortedTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <TaskItem
                        task={task}
                        onComplete={handleToggleTask}
                        onDelete={deleteTask}
                        onDeleteSingleOccurrence={deleteRoutineOccurrence}
                        currentDate={today}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-2">Nessun impegno per oggi</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">Sembra che tu abbia del tempo libero oggi!</p>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button 
                        variant="default"
                        className="bg-gradient-accent shadow-colored rounded-xl"
                        onClick={() => navigate('/create-task')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi impegno
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
};

export default HomePage;