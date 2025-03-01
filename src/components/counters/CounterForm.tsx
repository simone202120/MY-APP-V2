// components/counters/CounterForm.tsx
import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from "../ui/button";
import { CounterType } from '../../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../common/AnimatedComponents';
import { useLayoutContext } from '../../context/LayoutContext';

// Tipo per le props del form del contatore (modalità dialog o page)
interface CounterFormProps {
  // Props comuni
  onSubmit: (counter: {
    name: string;
    type: CounterType;
    startDate: string;
    endDate?: string;
    duration: 'day' | 'custom';
  }) => void;
  
  // Props per modalità dialog
  isDialog?: boolean;
  onClose?: () => void;
}

const CounterForm: React.FC<CounterFormProps> = ({ 
  onSubmit, 
  isDialog = false, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { setShowFooter } = useLayoutContext();
  
  // Nascondiamo il footer quando la pagina si monta (solo in modalità pagina)
  useEffect(() => {
    if (!isDialog) {
      setShowFooter(false);
      // Lo mostriamo di nuovo quando la pagina viene smontata
      return () => setShowFooter(true);
    }
  }, [isDialog, setShowFooter]);
  
  const [counterData, setCounterData] = useState({
    name: '',
    type: 'daily' as CounterType,
    duration: 'day' as 'day' | 'custom',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(counterData);
    
    // In modalità pagina, torniamo indietro dopo il submit
    if (!isDialog && !onClose) {
      navigate(-1);
    }
  };

  const handleCancel = () => {
    if (isDialog && onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Contenuto del form (per entrambe le modalità)
  const formContent = (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome
        </label>
        <input
          type="text"
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          value={counterData.name}
          onChange={(e) => setCounterData({...counterData, name: e.target.value})}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          value={counterData.type}
          onChange={(e) => setCounterData({
            ...counterData, 
            type: e.target.value as CounterType
          })}
        >
          <option value="daily">Giornaliero</option>
          <option value="total">Totale</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Durata
        </label>
        <select
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          value={counterData.duration}
          onChange={(e) =>
            setCounterData({ ...counterData, duration: e.target.value as 'day' | 'custom' })
          }
        >
          <option value="day">Solo per oggi</option>
          <option value="custom">Personalizzata</option>
        </select>
      </div>
      {counterData.duration === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data di fine
          </label>
          <input
            type="date"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={counterData.endDate}
            onChange={(e) => setCounterData({ ...counterData, endDate: e.target.value })}
            min={counterData.startDate}
          />
        </div>
      )}
    </>
  );

  // Renderizzazione in modalità dialog
  if (isDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-lg">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Nuovo Contatore</h2>
            <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <form id="counterForm" onSubmit={handleSubmit} className="p-4 space-y-4">
            {formContent}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" type="button" onClick={handleCancel}>
                Annulla
              </Button>
              <Button type="submit">
                Salva
              </Button>
            </div>
          </form>
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
            <form id="counterPageForm" onSubmit={handleSubmit} className="space-y-6">
              {formContent}
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
              className="px-6 py-2 h-12 text-base"
            >
              Salva
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default CounterForm;