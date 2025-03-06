// components/counters/CounterItem.tsx
import React, { useState } from 'react';
import { Plus, Minus, Trash2, Target, BarChart2, Calendar, Calendar as CalendarIcon, RefreshCw, Award } from 'lucide-react';
import { Button } from "../ui/button";
import { Counter } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
  
  // Configurazione specifica per il tipo di contatore
  const getTypeConfig = () => {
    switch(counter.type) {
      case 'daily':
        return {
          icon: <Calendar className="h-full w-full" />,
          label: 'Giornaliero',
          color: {
            text: 'text-primary-500',
            bg: 'bg-primary-500',
            bgLight: 'bg-primary-50',
            border: 'border-primary-100',
            badgeBg: 'bg-primary-50',
            badgeText: 'text-primary-700'
          }
        };
      case 'weekly':
        return {
          icon: <RefreshCw className="h-full w-full" />,
          label: 'Settimanale',
          color: {
            text: 'text-secondary-500',
            bg: 'bg-secondary-500',
            bgLight: 'bg-secondary-50',
            border: 'border-secondary-100',
            badgeBg: 'bg-secondary-50',
            badgeText: 'text-secondary-700'
          }
        };
      case 'monthly':
        return {
          icon: <CalendarIcon className="h-full w-full" />,
          label: 'Mensile',
          color: {
            text: 'text-tertiary-500',
            bg: 'bg-tertiary-500',
            bgLight: 'bg-tertiary-50',
            border: 'border-tertiary-100',
            badgeBg: 'bg-tertiary-50',
            badgeText: 'text-tertiary-700'
          }
        };
      case 'cumulative':
        return {
          icon: <BarChart2 className="h-full w-full" />,
          label: 'Cumulativo',
          color: {
            text: 'text-amber-500',
            bg: 'bg-amber-500',
            bgLight: 'bg-amber-50',
            border: 'border-amber-100',
            badgeBg: 'bg-amber-50',
            badgeText: 'text-amber-700'
          }
        };
      default:
        return {
          icon: <Calendar className="h-full w-full" />,
          label: 'Contatore',
          color: {
            text: 'text-primary-500',
            bg: 'bg-primary-500',
            bgLight: 'bg-primary-50',
            border: 'border-primary-100',
            badgeBg: 'bg-primary-50',
            badgeText: 'text-primary-700'
          }
        };
    }
  };
  
  const typeConfig = getTypeConfig();
  
  // Calcola la percentuale di progresso
  const progressPercentage = counter.goal 
    ? Math.min(100, (counter.currentValue / counter.goal) * 100)
    : 0;
  
  // Colori per la barra di progresso
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'bg-green-500';
    if (progressPercentage >= 75) return 'bg-primary-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    if (progressPercentage >= 25) return 'bg-amber-500';
    return 'bg-gray-400';
  };
  
  // Animazione per il contatore che ha raggiunto l'obiettivo
  const goalReached = counter.goal && counter.currentValue >= counter.goal;
  
  return (
    <motion.div
      className={`card card-hover p-6 transition-all relative rounded-2xl ${typeConfig.color.border} shadow-md`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background gradient sottile */}
      <div className={`absolute inset-0 ${typeConfig.color.bgLight} rounded-2xl opacity-40`}></div>
      
      {/* Animazione quando si incrementa il valore */}
      <AnimatePresence>
        {expandedAnimation && (
          <motion.div 
            className={`absolute inset-0 ${typeConfig.color.bgLight} opacity-60`}
            initial={{ scale: 0, borderRadius: '50%' }}
            animate={{ scale: 2, borderRadius: '0%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
      
      {/* Badge per obiettivo raggiunto */}
      <AnimatePresence>
        {goalReached && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 8 }}
            className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-colored z-20"
          >
            <Award className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10">
        <div className="flex items-start">
          {/* Icona del contatore */}
          <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${typeConfig.color.bgLight} flex items-center justify-center p-3 mr-4 ${typeConfig.color.text}`}>
            {typeConfig.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-semibold text-base text-gray-800">{counter.name}</h3>
                
                {/* Tipo di contatore */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${typeConfig.color.badgeBg} ${typeConfig.color.badgeText}`}>
                  {typeConfig.label}
                </div>
              </div>
              
              {/* Pulsante elimina */}
              {!isReadOnly && !showDeleteConfirm && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  rounded="full"
                  className="text-gray-400 hover:text-tertiary-500 -mt-1 -mr-1"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Elimina contatore"
                  hasAnimation={true}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              {/* Conferma eliminazione */}
              {showDeleteConfirm && (
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    className="text-gray-500"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    rounded="full"
                    className="bg-red-500"
                    onClick={() => onDelete(counter.id)}
                  >
                    Elimina
                  </Button>
                </div>
              )}
            </div>
            
            {/* Descrizione */}
            {counter.description && (
              <p className="text-sm text-gray-600 mt-1.5 mb-2">{counter.description}</p>
            )}
          </div>
        </div>
        
        {/* Barra di progresso */}
        {counter.goal && (
          <div className="mt-4 mb-3">
            <div className="relative">
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <motion.div 
                  className={`${getProgressColor()} h-full rounded-full relative`} 
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {/* Effetto lucido sulla barra di progresso */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </motion.div>
              </div>
              
              {goalReached && (
                <motion.div 
                  className="absolute right-0 -top-6 text-green-600 text-xs font-semibold"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Obiettivo raggiunto!
                </motion.div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-xs font-medium text-gray-600">
                Progresso:
              </p>
              <p className="text-xs font-semibold text-gray-800">
                {counter.currentValue}/{counter.goal} ({Math.round(progressPercentage)}%)
              </p>
            </div>
          </div>
        )}
        
        {/* Controlli del contatore */}
        <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-700 font-medium">
            {counter.currentValue > 0 ? 'Valore corrente' : 'Inizia a contare!'}
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isReadOnly || counter.currentValue <= 0}
              onClick={handleDecrement}
              aria-label="Decrementa"
              className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm transition-all
                ${isReadOnly || counter.currentValue <= 0 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 hover:shadow'
                }
              `}
            >
              <Minus className={`h-5 w-5 ${isReadOnly || counter.currentValue <= 0 ? 'text-gray-400' : 'text-red-500'}`} />
            </motion.button>
            
            <div className="w-20 h-12 bg-white/95 rounded-xl border border-gray-200 flex items-center justify-center shadow-inner overflow-hidden">
              <motion.span
                key={counter.currentValue}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                className={`font-bold text-2xl ${goalReached ? 'text-green-600' : 'text-gray-800'}`}
              >
                {counter.currentValue}
              </motion.span>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isReadOnly}
              onClick={handleIncrement}
              aria-label="Incrementa"
              className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm transition-all
                ${isReadOnly 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'bg-white hover:bg-green-50 border border-gray-200 hover:border-green-200 hover:shadow'
                }
              `}
            >
              <Plus className={`h-5 w-5 ${isReadOnly ? 'text-gray-400' : 'text-green-500'}`} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CounterItem;