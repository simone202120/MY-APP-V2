// components/counters/CounterItem.tsx
import React, { useState } from 'react';
import { Plus, Minus, Trash2, CalendarRange, Repeat, Target, Award } from 'lucide-react';
import { Button } from "../ui/button";
import { Counter } from '../../types';
import DeleteCounterDialog from './DeleteCounterDialog';
import { format } from 'date-fns';
import it from 'date-fns/locale/it';
import { motion } from 'framer-motion';

interface CounterItemProps {
  counter: Counter;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDelete: (id: string) => void;
}

const CounterItem: React.FC<CounterItemProps> = ({ 
  counter, 
  onIncrement, 
  onDecrement,
  onDelete
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isIncrementAnimation, setIsIncrementAnimation] = useState(false);
  const [isDecrementAnimation, setIsDecrementAnimation] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete(counter.id);
    setShowDeleteDialog(false);
  };

  const handleIncrement = () => {
    onIncrement(counter.id);
    setIsIncrementAnimation(true);
    setTimeout(() => setIsIncrementAnimation(false), 500);
  };

  const handleDecrement = () => {
    if (counter.currentValue > 0) {
      onDecrement(counter.id);
      setIsDecrementAnimation(true);
      setTimeout(() => setIsDecrementAnimation(false), 500);
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

  // Determina il periodo del contatore
  const getPeriodText = () => {
    if (!counter.startDate) return '';
    
    if (counter.duration === 'day') {
      return 'Giornaliero';
    }
    
    let text = 'Dal ' + getFormattedDate(counter.startDate);
    if (counter.endDate) {
      text += ' al ' + getFormattedDate(counter.endDate);
    }
    return text;
  };

  // Calcola la percentuale rispetto all'obiettivo (se esiste)
  const progressPercentage = counter.goal 
    ? Math.min(100, (counter.currentValue / counter.goal) * 100) 
    : 0;

  // Determina se l'obiettivo è stato raggiunto
  const goalReached = counter.goal && counter.currentValue >= counter.goal;

  return (
    <>
      <motion.div 
        className="card backdrop-blur-sm p-5 transition-all relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
      >
        {/* Background gradient */}
        <div className="absolute -inset-1 bg-gradient-to-r from-secondary-100/30 via-primary-100/20 to-secondary-100/30 blur-xl opacity-50"></div>
        
        <div className="relative z-10">
          {/* Intestazione e pulsante elimina */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-gray-900">{counter.name}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                  <Repeat className="h-3.5 w-3.5 mr-1.5 text-primary-500" />
                  <span className="text-xs">{counter.type === 'daily' ? 'Giornaliero' : 'Totale'}</span>
                </div>
                
                {counter.startDate && (
                  <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                    <CalendarRange className="h-3.5 w-3.5 mr-1.5 text-secondary-500" />
                    <span className="text-xs">{getPeriodText()}</span>
                  </div>
                )}
                
                {counter.goal !== undefined && (
                  <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                    <Target className="h-3.5 w-3.5 mr-1.5 text-tertiary-500" />
                    <span className="text-xs">Obiettivo: {counter.goal}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="glass"
              size="icon-sm"
              rounded="full"
              className="text-gray-400 hover:text-tertiary-500"
              onClick={handleDelete}
              aria-label="Elimina contatore"
              hasAnimation={true}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Controlli contatore */}
          <div className="mt-4 flex items-center justify-between">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="glass"
                size="icon"
                rounded="full"
                className="border-2 border-secondary-200"
                onClick={handleDecrement}
                disabled={counter.currentValue === 0}
                aria-label="Diminuisci contatore"
              >
                <Minus className="h-5 w-5 text-secondary-600" />
              </Button>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center"
              animate={{ 
                scale: isIncrementAnimation ? 1.2 : (isDecrementAnimation ? 0.9 : 1)
              }}
              transition={{ type: "spring", stiffness: 500, damping: 10 }}
            >
              <div className="bg-gradient-to-r from-primary-100 to-secondary-100 px-6 py-3 rounded-2xl shadow-card">
                <span className="font-display font-semibold text-3xl text-gray-800">
                  {counter.currentValue}
                </span>
              </div>
              
              {/* Progress bar */}
              {counter.goal !== undefined && (
                <div className="w-full mt-3">
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${
                        goalReached 
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                          : 'bg-gradient-to-r from-primary-400 to-secondary-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  
                  {goalReached && (
                    <motion.div 
                      className="mt-2 text-xs text-emerald-600 font-medium flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Award className="h-3.5 w-3.5 mr-1" />
                      Obiettivo raggiunto!
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
            
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="glass"
                size="icon"
                rounded="full"
                className="border-2 border-primary-200"
                onClick={handleIncrement}
                aria-label="Aumenta contatore"
              >
                <Plus className="h-5 w-5 text-primary-600" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <DeleteCounterDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDelete={confirmDelete}
        counterName={counter.name}
      />
    </>
  );
};

export default CounterItem;