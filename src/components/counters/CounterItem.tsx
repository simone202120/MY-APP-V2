// components/counters/CounterItem.tsx
import React, { useState } from 'react';
import { Plus, Minus, Trash2, Target, BarChart2, Calendar, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from "../ui/button";
import { Counter } from '../../types';
import { motion } from 'framer-motion';

interface CounterItemProps {
  counter: Counter;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

const CounterItem: React.FC<CounterItemProps> = ({ 
  counter, 
  onIncrement, 
  onDecrement, 
  onDelete,
  isReadOnly = false
}) => {
  const [expandedAnimation, setExpandedAnimation] = useState(false);
  
  const handleIncrement = () => {
    if (!isReadOnly) {
      setExpandedAnimation(true);
      onIncrement(counter.id);
      setTimeout(() => setExpandedAnimation(false), 300);
    }
  };
  
  const handleDecrement = () => {
    if (!isReadOnly && counter.currentValue > 0) {
      onDecrement(counter.id);
    }
  };
  
  const getTypeIcon = () => {
    switch(counter.type) {
      case 'daily':
        return <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary-500" />;
      case 'weekly':
        return <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-secondary-500" />;
      case 'monthly':
        return <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-tertiary-500" />;
      case 'cumulative':
        return <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-amber-500" />;
      default:
        return <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary-500" />;
    }
  };
  
  const getTypeLabel = () => {
    switch(counter.type) {
      case 'daily':
        return 'Giornaliero';
      case 'weekly':
        return 'Settimanale';
      case 'monthly':
        return 'Mensile';
      case 'cumulative':
        return 'Cumulativo';
      default:
        return '';
    }
  };
  
  const progressPercentage = counter.goal 
    ? Math.min(100, (counter.currentValue / counter.goal) * 100)
    : 0;
  
  return (
    <motion.div
      className="card backdrop-blur-sm p-5 transition-all relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      {/* Background gradient */}
      <div className="absolute -inset-1 bg-gradient-to-r from-secondary-100/30 via-primary-100/20 to-secondary-100/30 blur-xl opacity-50"></div>
      
      {/* Animazione quando si incrementa il valore */}
      {expandedAnimation && (
        <motion.div 
          className="absolute inset-0 bg-primary-50 opacity-30" 
          initial={{ scale: 0 }}
          animate={{ scale: 2 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-base text-gray-800">{counter.name}</h3>
            
            {/* Descrizione */}
            {counter.description && (
              <p className="text-sm text-gray-600 mt-1">{counter.description}</p>
            )}
            
            {/* Tipo di contatore e altri metadati */}
            <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-x-4 gap-y-2">
              <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                {getTypeIcon()}
                <span>{getTypeLabel()}</span>
              </div>
              
              {counter.goal && (
                <div className="flex items-center px-2 py-1 bg-white/60 rounded-full shadow-sm">
                  <Target className="h-3.5 w-3.5 mr-1.5 text-primary-500" />
                  <span>Obiettivo: {counter.goal}</span>
                </div>
              )}
            </div>
            
            {/* Barra di progresso */}
            {counter.goal && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-primary-500 h-2 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {counter.currentValue}/{counter.goal} ({Math.round(progressPercentage)}%)
                </p>
              </div>
            )}
          </div>
          
          {/* Pulsante elimina */}
          {!isReadOnly && (
            <Button
              variant="glass"
              size="icon-sm"
              rounded="full"
              className="text-gray-400 hover:text-tertiary-500 -mt-1 -mr-1"
              onClick={() => onDelete(counter.id)}
              aria-label="Elimina contatore"
              hasAnimation={true}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
          
        {/* Controlli del contatore */}
        <div className="flex items-center justify-end mt-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isReadOnly || counter.currentValue <= 0}
            onClick={handleDecrement}
            aria-label="Decrementa"
            className="bg-white/70"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="w-16 h-10 bg-white/70 rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
            <span className="font-bold text-xl text-gray-800">
              {counter.currentValue}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={isReadOnly}
            onClick={handleIncrement}
            aria-label="Incrementa"
            className="bg-white/70"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CounterItem;