// src/pages/CreateCounterPage.tsx
import React from 'react';
import { useApp } from '../context/AppContext';
import CounterForm from '../components/counters/CounterForm';

const CreateCounterPage = () => {
  const { addCounter, isLoading } = useApp();

  const handleSubmit = async (counterData: any) => {
    try {
      await addCounter(counterData);
    } catch (error: any) {
      console.error('Errore durante la creazione del contatore:', error);
      throw error;
    }
  };

  return <CounterForm onSubmit={handleSubmit} isLoading={isLoading} isDialog={false} />;
};

export default CreateCounterPage;