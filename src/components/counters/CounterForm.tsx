// components/counters/CounterForm.tsx - Componente unificato per creare contatori
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CalendarDays, Target, AlertCircle, Info, RefreshCw, BarChart2, X } from 'lucide-react';
import { Button } from "../ui/button";
import { format, addMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition } from '../common/AnimatedComponents';
import { useLayoutContext } from '../../context/LayoutContext';

const COUNTER_TYPES = [
  { id: 'daily', name: 'Giornaliero', description: 'Riparte da zero ogni giorno' },
  { id: 'weekly', name: 'Settimanale', description: 'Riparte da zero ogni settimana' },
  { id: 'monthly', name: 'Mensile', description: 'Riparte da zero ogni mese' },
  { id: 'cumulative', name: 'Cumulativo', description: 'Mantiene il valore nel tempo' },
];

interface CounterFormProps {
  // Props comuni
  onSubmit: (counter: {
    name: string;
    description?: string;
    type: 'daily' | 'weekly' | 'monthly' | 'cumulative';
    goal?: number;
    startDate: string;
    endDate?: string;
  }) => void;
  isLoading?: boolean;
  
  // Props per modalità dialog
  isDialog?: boolean;
  onClose?: () => void;
}

const CounterForm: React.FC<CounterFormProps> = ({ 
  onSubmit, 
  isLoading = false,
  isDialog = false, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { setShowFooter } = useLayoutContext();
  
  // Nascondiamo il footer quando la pagina si monta
  useEffect(() => {
    if (!isDialog) {
      setShowFooter(false);
      // Lo mostriamo di nuovo quando la pagina viene smontata
      return () => setShowFooter(true);
    }
  }, [isDialog, setShowFooter]);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('daily');
  const [goal, setGoal] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  
  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }
    
    if (goal !== undefined && goal <= 0) {
      newErrors.goal = 'L\'obiettivo deve essere maggiore di zero';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Prepare data
    const counterData = {
      name,
      description: description.trim() || undefined,
      type: type as 'daily' | 'weekly' | 'monthly' | 'cumulative',
      goal: goal !== undefined ? goal : undefined,
      startDate: startDate,
      endDate: hasEndDate ? endDate : undefined,
    };
    
    onSubmit(counterData);
    
    // In modalità pagina, torniamo indietro dopo il submit
    if (!isDialog && !onClose) {
      // Reset del form solo se non c'è redirect (per vedere il messaggio di successo)
      setName('');
      setDescription('');
      setType('daily');
      setGoal(undefined);
      setHasEndDate(false);
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
      
      setSuccessMessage('Contatore creato con successo!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };
  
  const handleCancel = () => {
    if (isDialog && onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Renderizzazione in modalità dialog
  if (isDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-xl font-bold text-gray-900">Nuovo Contatore</h2>
            <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="overflow-y-auto flex-1 p-6">
            <form id="counterDialogForm" onSubmit={handleSubmit} className="space-y-6">
              {/* Nome contatore */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Nome contatore *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Es. Bicchieri d'acqua"
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              
              {/* Descrizione */}
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Descrizione (opzionale)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                  rows={2}
                  placeholder="Es. Tieni traccia dell'acqua che bevi quotidianamente"
                />
              </div>
              
              {/* Tipo contatore */}
              <div className="form-group">
                <label className="form-label">
                  Tipo di contatore *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {COUNTER_TYPES.map((counterType) => {
                    // Definisci icone e colori in base al tipo
                    let icon;
                    let bgColor = '';
                    let borderColor = '';
                    
                    if (counterType.id === 'daily') {
                      icon = <Calendar className="h-5 w-5 text-primary-500" />;
                      bgColor = 'bg-primary-50';
                      borderColor = 'border-primary-200';
                    } else if (counterType.id === 'weekly') {
                      icon = <RefreshCw className="h-5 w-5 text-secondary-500" />;
                      bgColor = 'bg-secondary-50';
                      borderColor = 'border-secondary-200';
                    } else if (counterType.id === 'monthly') {
                      icon = <CalendarDays className="h-5 w-5 text-tertiary-500" />;
                      bgColor = 'bg-tertiary-50';
                      borderColor = 'border-tertiary-200';
                    } else if (counterType.id === 'cumulative') {
                      icon = <BarChart2 className="h-5 w-5 text-amber-500" />;
                      bgColor = 'bg-amber-50';
                      borderColor = 'border-amber-200';
                    }
                    
                    return (
                      <motion.div 
                        key={counterType.id}
                        className={`p-3 rounded-xl border ${type === counterType.id ? 
                          `${bgColor} ${borderColor} shadow-sm` : 
                          'border-gray-200 hover:bg-gray-50'
                        } cursor-pointer transition-all`}
                        onClick={() => setType(counterType.id)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            type === counterType.id ? 'bg-white' : 'bg-gray-50'
                          }`}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-gray-900 font-medium">{counterType.name}</h3>
                            <p className="text-xs text-gray-500">{counterType.description}</p>
                          </div>
                          <input
                            type="radio"
                            checked={type === counterType.id}
                            onChange={() => setType(counterType.id)}
                            className="mr-1"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* Obiettivo */}
              <div className="form-group">
                <label htmlFor="goal" className="form-label">
                  Obiettivo (opzionale)
                </label>
                <div className="flex relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Target className="w-5 h-5 text-primary-500" />
                  </div>
                  <input
                    id="goal"
                    type="number"
                    value={goal === undefined ? '' : goal}
                    onChange={(e) => setGoal(e.target.value ? Number(e.target.value) : undefined)}
                    className={`form-input pl-10 ${errors.goal ? 'border-red-500' : 'border-gray-300'} bg-white shadow-sm rounded-xl`}
                    placeholder="Es. 8 bicchieri d'acqua"
                    min="1"
                  />
                </div>
                {errors.goal ? (
                  <p className="text-sm text-red-500 mt-1">{errors.goal}</p>
                ) : (
                  <motion.p 
                    className="form-hint flex items-center mt-2 text-gray-500 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Info className="inline w-4 h-4 mr-1.5 text-primary-400" />
                    Imposta un valore target da raggiungere
                  </motion.p>
                )}
              </div>
              
              {/* Data di inizio */}
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Data di inizio
                </label>
                <div className="flex relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="w-5 h-5 text-primary-500" />
                  </div>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input pl-10 border-gray-300 bg-white shadow-sm rounded-xl w-full"
                  />
                </div>
                <motion.p 
                  className="form-hint flex items-center mt-2 text-gray-500 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Info className="inline w-4 h-4 mr-1.5 text-primary-400" />
                  Data da cui il contatore sarà attivo
                </motion.p>
              </div>
              
              {/* Data di fine */}
              <div className="form-group">
                <div className="flex items-center mb-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <input
                    id="hasEndDate"
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="mr-3 h-5 w-5 accent-primary-500"
                  />
                  <label htmlFor="hasEndDate" className="text-sm font-medium text-gray-700">
                    Imposta una data di fine
                  </label>
                </div>
                
                {hasEndDate && (
                  <motion.div 
                    className="flex relative mt-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <CalendarDays className="w-5 h-5 text-secondary-500" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input pl-10 border-gray-300 bg-white shadow-sm rounded-xl w-full"
                      min={startDate}
                    />
                  </motion.div>
                )}
                <motion.p 
                  className="form-hint flex items-center mt-2 text-gray-500 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Info className="inline w-4 h-4 mr-1.5 text-primary-400" />
                  Se non specificato, il contatore sarà attivo a tempo indeterminato
                </motion.p>
              </div>
              
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}
            </form>
          </div>
          
          <div className="border-t p-5 bg-gray-50 rounded-b-xl">
            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleCancel}
                className="px-6 py-3 text-base"
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                form="counterDialogForm"
                isLoading={isLoading}
                className="px-6 py-3 text-base"
              >
                {isLoading ? 'Creazione in corso...' : 'Crea contatore'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizzazione in modalità pagina
  return (
    <PageTransition>
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-4 border-b bg-white z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel} 
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold text-gray-900">Nuovo Contatore</h2>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="overflow-y-auto flex-1 pb-20">
          <div className="container max-w-md mx-auto p-4">
            {successMessage && (
              <motion.div 
                className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {successMessage}
              </motion.div>
            )}
            
            <form id="counterPageForm" onSubmit={handleSubmit} className="space-y-6">
              {/* Nome contatore */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome contatore *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Es. Bicchieri d'acqua"
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              
              {/* Descrizione */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={2}
                  placeholder="Es. Tieni traccia dell'acqua che bevi quotidianamente"
                />
              </div>
              
              {/* Tipo contatore */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo di contatore *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {COUNTER_TYPES.map((counterType) => {
                    // Definisci icone e colori in base al tipo
                    let icon;
                    let bgColor = '';
                    let borderColor = '';
                    
                    if (counterType.id === 'daily') {
                      icon = <Calendar className="h-5 w-5 text-primary-500" />;
                      bgColor = 'bg-primary-50';
                      borderColor = 'border-primary-200';
                    } else if (counterType.id === 'weekly') {
                      icon = <RefreshCw className="h-5 w-5 text-secondary-500" />;
                      bgColor = 'bg-secondary-50';
                      borderColor = 'border-secondary-200';
                    } else if (counterType.id === 'monthly') {
                      icon = <CalendarDays className="h-5 w-5 text-tertiary-500" />;
                      bgColor = 'bg-tertiary-50';
                      borderColor = 'border-tertiary-200';
                    } else if (counterType.id === 'cumulative') {
                      icon = <BarChart2 className="h-5 w-5 text-amber-500" />;
                      bgColor = 'bg-amber-50';
                      borderColor = 'border-amber-200';
                    }
                    
                    return (
                      <motion.div 
                        key={counterType.id}
                        className={`p-3 rounded-xl border ${type === counterType.id ? 
                          `${bgColor} ${borderColor} shadow-sm` : 
                          'border-gray-200 hover:bg-gray-50'
                        } cursor-pointer transition-all`}
                        onClick={() => setType(counterType.id)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            type === counterType.id ? 'bg-white' : 'bg-gray-50'
                          }`}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-gray-900 font-medium">{counterType.name}</h3>
                            <p className="text-xs text-gray-500">{counterType.description}</p>
                          </div>
                          <input
                            type="radio"
                            checked={type === counterType.id}
                            onChange={() => setType(counterType.id)}
                            className="mr-1"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* Obiettivo */}
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
                  Obiettivo (opzionale)
                </label>
                <div className="flex relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Target className="w-5 h-5 text-primary-500" />
                  </div>
                  <input
                    id="goal"
                    type="number"
                    value={goal === undefined ? '' : goal}
                    onChange={(e) => setGoal(e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${errors.goal ? 'border-red-500' : ''}`}
                    placeholder="Es. 8 bicchieri d'acqua"
                    min="1"
                  />
                </div>
                {errors.goal ? (
                  <p className="text-sm text-red-500 mt-1">{errors.goal}</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <Info className="inline w-4 h-4 mr-1.5 text-primary-400" />
                    Imposta un valore target da raggiungere
                  </p>
                )}
              </div>
              
              {/* Data di inizio */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data di inizio
                </label>
                <div className="flex relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="w-5 h-5 text-primary-500" />
                  </div>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <Info className="inline w-4 h-4 mr-1.5 text-primary-400" />
                  Data da cui il contatore sarà attivo
                </p>
              </div>
              
              {/* Data di fine */}
              <div>
                <div className="flex items-center mb-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <input
                    id="hasEndDate"
                    type="checkbox"
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="mr-3 h-5 w-5 accent-primary-500"
                  />
                  <label htmlFor="hasEndDate" className="text-sm font-medium text-gray-700">
                    Imposta una data di fine
                  </label>
                </div>
                
                {hasEndDate && (
                  <motion.div 
                    className="flex relative mt-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <CalendarDays className="w-5 h-5 text-secondary-500" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      min={startDate}
                    />
                  </motion.div>
                )}
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <Info className="inline w-4 h-4 mr-1.5 text-primary-400" />
                  Se non specificato, il contatore sarà attivo a tempo indeterminato
                </p>
              </div>
              
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}
            </form>
          </div>
        </div>
        
        {/* Footer - Sticky */}
        <div className="sticky bottom-0 left-0 right-0 border-t p-4 bg-white">
          <div className="container max-w-md mx-auto flex justify-between space-x-3">
            <Button 
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 h-12 text-base"
            >
              Annulla
            </Button>
            <Button 
              type="submit"
              form="counterPageForm"
              isLoading={isLoading}
              className="px-6 py-2 h-12 text-base"
            >
              {isLoading ? 'Creazione in corso...' : 'Crea contatore'}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default CounterForm;