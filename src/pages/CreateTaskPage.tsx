// src/pages/CreateTaskPage.tsx
import React from 'react';
import { useApp } from '../context/AppContext';
import TaskForm from '../components/tasks/TaskForm';

const CreateTaskPage = () => {
  const { addTask } = useApp();
  
  const handleSubmit = async (task: any) => {
    await addTask(task);
  };

  return <TaskForm onSubmit={handleSubmit} isDialog={false} />;
};

export default CreateTaskPage;