// src/pages/CreateCounterPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths } from 'date-fns';
import { Calendar, Target, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { PageTransition } from '../components/common/AnimatedComponents';
import { useLayoutContext } from '../context/LayoutContext';

const COUNTER_TYPES = [
  { id: 'daily', name: 'Giornaliero', description: 'Riparte da zero ogni giorno' },
  { id: 'weekly', name: 'Settimanale', description: 'Riparte da zero ogni settimana' },
  { id: 'monthly', name: 'Mensile', description: 'Riparte da zero ogni mese' },
  { id: 'cumulative', name: 'Cumulativo', description: 'Mantiene il valore nel tempo' },
];

const CreateCounterPage = () => {
  const navigate = useNavigate();
  const { addCounter, isLoading } = useApp();
  const { setShowFooter } = useLayoutContext();
  
  // Nascondiamo il footer quando la pagina si monta
  useEffect(() => {
    setShowFooter(false);
    // Lo mostriamo di nuovo quando la pagina viene smontata
    return () => setShowFooter(true);
  }, [setShowFooter]);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('daily');
  const [goal, setGoal] = useState<number | undefined>(undefined);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  
  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Handle form submission
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
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const counterData = {
      name,
      description: description.trim() || undefined,
      type: type as 'daily' | 'weekly' | 'monthly' | 'cumulative',
      goal: goal !== undefined ? goal : undefined,
      startDate: today,
      endDate: hasEndDate ? endDate : undefined,
    };
    
    try {
      await addCounter(counterData);
      setSuccessMessage('Contatore creato con successo!');
      
      // Reset form
      setName('');
      setDescription('');
      setType('daily');
      setGoal(undefined);
      setHasEndDate(false);
      setEndDate(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Errore durante la creazione del contatore:', error);
      setErrors({ form: 'Errore durante la creazione del contatore' });
    }
  };
  
  return (
    <PageTransition>
      <div className="max-w-md mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Crea nuovo contatore</h1>
            <p className="text-gray-600">Tieni traccia delle tue attività numeriche</p>
          </div>
        </div>
        
        {successMessage && (
          <motion.div 
            className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {successMessage}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="glass-effect shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Informazioni contatore</CardTitle>
              <CardDescription>
                Configura il tuo nuovo contatore
              </CardDescription>
            </CardHeader>
          
          <CardContent className="space-y-4">
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
              />
              {errors.name && (
                <p className="form-error">{errors.name}</p>
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
              <div className="grid grid-cols-1 gap-2">
                {COUNTER_TYPES.map((counterType) => (
                  <div 
                    key={counterType.id}
                    className={`option-button-large p-3 ${
                      type === counterType.id ? 'bg-primary-100 border-primary-500 text-primary-700' : ''
                    }`}
                    onClick={() => setType(counterType.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={type === counterType.id}
                        onChange={() => setType(counterType.id)}
                        className="mr-2"
                      />
                      <div>
                        <h3 className="text-gray-900 font-medium">{counterType.name}</h3>
                        <p className="text-xs text-gray-500">{counterType.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Obiettivo */}
            <div className="form-group">
              <label htmlFor="goal" className="form-label">
                Obiettivo (opzionale)
              </label>
              <div className="flex items-center">
                <Target className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  id="goal"
                  type="number"
                  value={goal === undefined ? '' : goal}
                  onChange={(e) => setGoal(e.target.value ? Number(e.target.value) : undefined)}
                  className={`form-input ${errors.goal ? 'border-red-500' : ''}`}
                  placeholder="Es. 8 bicchieri d'acqua"
                  min="1"
                />
              </div>
              {errors.goal ? (
                <p className="form-error">{errors.goal}</p>
              ) : (
                <p className="form-hint">
                  <Info className="inline w-3 h-3 mr-1" />
                  Imposta un valore target da raggiungere
                </p>
              )}
            </div>
            
            {/* Data di fine */}
            <div className="form-group">
              <div className="flex items-center mb-2">
                <input
                  id="hasEndDate"
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="hasEndDate" className="text-sm font-medium text-gray-700">
                  Imposta una data di fine
                </label>
              </div>
              
              {hasEndDate && (
                <div className="flex items-center mt-2">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              )}
              <p className="form-hint">
                <Info className="inline w-3 h-3 mr-1" />
                Se non specificato, il contatore sarà attivo a tempo indeterminato
              </p>
            </div>
            
            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Annulla
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creazione in corso...' : 'Crea contatore'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
    </PageTransition>
  );
};

export default CreateCounterPage;