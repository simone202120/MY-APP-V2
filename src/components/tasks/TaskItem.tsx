// components/tasks/TaskItem.tsx - Aggiornato per supportare il completamento di singole occorrenze
import React, { useState } from 'react';
import { Check, Clock, Trash2, ChevronDown, ChevronUp, CalendarDays, RotateCcw, Bell } from 'lucide-react';
import { Button } from "../ui/button";
import { Task } from '../../types';
import DeleteTaskDialog from './DeleteTaskDialog';
import { isTaskCompletedForDate } from '../../utils/TaskUtils';
import { format } from 'date-fns';
import it from 'date-fns/locale/it';
import { motion } from 'framer-motion';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string, date?: string) => void;
  onDelete: (id: string) => void;
  onDeleteSingleOccurrence: (taskId: string, date: string) => void;
  currentDate: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onComplete, 
  onDelete,
  onDeleteSingleOccurrence,
  currentDate 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isCompletingAnimation, setIsCompletingAnimation] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteSingle = () => {
    if (task.type === 'routine') {
      onDeleteSingleOccurrence(task.id, currentDate);
    } else {
      onDelete(task.id);
    }
    setShowDeleteDialog(false);
  };

  const handleDeleteAll = () => {
    onDelete(task.id);
    setShowDeleteDialog(false);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Determina se il task è completato per la data corrente
  const isCompleted = task.type === 'oneTime' 
    ? task.isCompleted 
    : isTaskCompletedForDate(task, currentDate);

  // Verifica se c'è una descrizione e se dovremmo mostrare il pulsante per espanderla
  const hasDescription = task.description && task.description.trim().length > 0;

  const handleComplete = () => {
    // Animazione completamento
    if (!isCompleted) {
      setIsCompletingAnimation(true);
      setTimeout(() => {
        setIsCompletingAnimation(false);
      }, 700);
    }
    
    if (task.type === 'routine') {
      // Per le routine, passa anche la data corrente
      onComplete(task.id, currentDate);
    } else {
      // Per eventi una tantum, mantieni il comportamento esistente
      onComplete(task.id);
    }
  };

  // Formatta la data in formato leggibile
  const getFormattedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'd MMMM', { locale: it });
    } catch (e) {
      return dateStr;
    }
  };

  // Determina se è una ricorrenza
  const isRecurring = task.type === 'routine';
  
  // Determina il testo della ricorrenza
  const getRecurrenceText = () => {
    if (task.recurrenceType === 'weekly') {
      return 'Ogni settimana';
    } else if (task.recurrenceType === 'biweekly') {
      return 'Ogni 2 settimane';
    } else if (task.recurrenceType === 'monthly') {
      return 'Ogni mese';
    } else if (task.recurrenceType === 'custom' && task.recurrenceInterval) {
      return `Ogni ${task.recurrenceInterval} giorni`;
    }
    return '';
  };

  return (
    <>
      <motion.div 
        className={`
          card backdrop-blur-sm p-5 transition-all relative overflow-hidden
          ${isCompleted ? 'bg-background-light/90' : 'bg-background-card/90'}
          ${isCompletingAnimation ? 'border-primary-300 bg-primary-50/80' : ''}
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
      >
        {/* Background gradient */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/30 via-secondary-100/20 to-primary-100/30 blur-xl opacity-50"></div>
        
        <div className="flex items-start relative z-10">
          {/* Checkbox come cerchio */}
          <div className="mr-4 mt-1">
            <motion.button
              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors shadow-sm
                ${isCompleted 
                  ? 'bg-primary-500 border-primary-500' 
                  : 'bg-white border-gray-300 hover:border-primary-400'
                }
              `}
              onClick={handleComplete}
              aria-label={isCompleted ? "Segna come non completato" : "Segna come completato"}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
            >
              {isCompleted && <Check className="h-4 w-4 text-white" />}
            </motion.button>
          </div>
          
          {/* Contenuto principale */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 
                  className={`font-medium text-base ${
                    isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'
                  }`}
                >
                  {task.title}
                </h3>
                
                {/* Dettagli orario e frequenza in una riga */}
                <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-x-4 gap-y-2">
                  {task.time && (
                    <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-primary-500" />
                      <span>{task.time}</span>
                    </div>
                  )}
                  
                  {/* Data per task non ricorrenti */}
                  {!isRecurring && task.date && (
                    <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-secondary-500" />
                      <span>{getFormattedDate(task.date)}</span>
                    </div>
                  )}
                  
                  {/* Ricorrenza per task ricorrenti */}
                  {isRecurring && (
                    <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-tertiary-500" />
                      <span>{getRecurrenceText()}</span>
                    </div>
                  )}
                  
                  {/* Notifiche */}
                  {task.notifyBefore && (
                    <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                      <Bell className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      <span>{task.notifyInAdvance} {task.notifyTimeUnit === 'minutes' ? 'min' : 'ore'} prima</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pulsante elimina */}
              <Button
                variant="glass"
                size="icon-sm"
                rounded="full"
                className="text-gray-400 hover:text-tertiary-500 -mt-1 -mr-1"
                onClick={handleDelete}
                aria-label="Elimina impegno"
                hasAnimation={true}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Descrizione espandibile */}
            {hasDescription && (
              <div className="mt-4">
                <button 
                  className="flex items-center text-xs text-primary-600 hover:text-primary-700 focus:outline-none bg-white/70 py-1.5 px-3 rounded-full shadow-sm"
                  onClick={toggleExpand}
                  aria-expanded={expanded}
                  aria-controls={`description-${task.id}`}
                >
                  <span className="mr-1">
                    {expanded ? 'Nascondi dettagli' : 'Mostra dettagli'}
                  </span>
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                
                {expanded && (
                  <motion.div 
                    id={`description-${task.id}`}
                    className="text-sm text-gray-700 mt-3 p-3.5 glass-effect rounded-xl"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {task.description}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <DeleteTaskDialog
        isOpen={showDeleteDialog}
        isRoutine={task.type === 'routine'}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteSingle={handleDeleteSingle}
        onDeleteAll={handleDeleteAll}
      />
    </>
  );
};

export default TaskItem;