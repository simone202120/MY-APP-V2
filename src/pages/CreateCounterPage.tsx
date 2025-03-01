// src/pages/CreateCounterPage.tsx
import React from 'react';
import { useApp } from '../context/AppContext';
import CounterForm from '../components/counters/CounterForm';

const CreateCounterPage = () => {
  const { addCounter } = useApp();
  
  const handleSubmit = async (counterData: any) => {
    await addCounter(counterData);
  };

  return <CounterForm onSubmit={handleSubmit} isDialog={false} />;
};

export default CreateCounterPage;