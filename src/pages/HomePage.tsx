// pages/HomePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from "../components/ui/button";
import TaskItem from '../components/tasks/TaskItem';
import CounterItem from '../components/counters/CounterItem';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { isTaskScheduledForDate, isTaskCompletedForDate } from '../utils/TaskUtils';

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

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDate = new Date();

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

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Il tuo progresso</h2>
            <p className="text-sm text-gray-500">
              {format(new Date(), 'EEEE d MMMM', { locale: it })}
            </p>
          </div>
          <div className="h-12 w-12 bg-primary-50 rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary-500" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completamento</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div 
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          className="flex items-center justify-center gap-2 h-auto py-3"
          onClick={() => navigate('/create-task')}
        >
          <Plus className="h-5 w-5" />
          <span>Impegno</span>
        </Button>
        <Button 
          className="flex items-center justify-center gap-2 h-auto py-3"
          onClick={() => navigate('/create-counter')}
        >
          <Plus className="h-5 w-5" />
          <span>Contatore</span>
        </Button>
      </div>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">I tuoi impegni oggi</h2>
          <span className="text-sm text-gray-500">
            {completedTodayTasks.length}/{todayTasks.length}
          </span>
        </div>
        <div className="space-y-3">
          {todayTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={toggleTaskComplete}
              onDelete={deleteTask}
              onDeleteSingleOccurrence={deleteRoutineOccurrence}
              currentDate={today}
            />
          ))}
          {todayTasks.length === 0 && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500">Nessun impegno per oggi</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => navigate('/create-task')}
              >
                Aggiungi il tuo primo impegno
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Counters Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Contatori Giornalieri</h2>
        <div className="space-y-3">
          {counters
            .filter(counter => counter.type === 'daily')
            .map(counter => (
              <CounterItem
                key={counter.id}
                counter={counter}
                onIncrement={incrementCounter}
                onDecrement={decrementCounter}
                onDelete={deleteCounter}
              />
            ))}
          {counters.filter(c => c.type === 'daily').length === 0 && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500">Nessun contatore giornaliero</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => navigate('/create-counter')}
              >
                Aggiungi il tuo primo contatore
              </Button>
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold">Contatori Totali</h2>
        <div className="space-y-3">
          {counters
            .filter(counter => counter.type === 'total')
            .map(counter => (
              <CounterItem
                key={counter.id}
                counter={counter}
                onIncrement={incrementCounter}
                onDecrement={decrementCounter}
                onDelete={deleteCounter}
              />
            ))}
          {counters.filter(c => c.type === 'total').length === 0 && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500">Nessun contatore totale</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => navigate('/create-counter')}
              >
                Aggiungi il tuo primo contatore
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;