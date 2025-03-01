// pages/SettingsPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Trash2, RefreshCw, LogOut, User, Lock } from 'lucide-react';

const SettingsPage = () => {
  const { resetDailyCounters, tasks, counters, resetAllData, isLoading } = useApp();
  const { currentUser, logout, updateUserProfile } = useAuth();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const handleDeleteAll = async () => {
    if (showConfirmDelete) {
      await resetAllData();
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdateError('');
      setUpdateSuccess('');
      
      if (displayName.trim() === '') {
        return setUpdateError('Il nome non può essere vuoto');
      }
      
      await updateUserProfile(displayName);
      setUpdateSuccess('Profilo aggiornato con successo');
      setIsEditing(false);
    } catch (error) {
      setUpdateError('Impossibile aggiornare il profilo');
      console.error("Update profile failed", error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Caricamento...</div>;
  }

  return (
    <div className="pb-20 pt-16">
      <h1 className="text-2xl font-bold mb-6">Impostazioni</h1>

      {/* Profilo utente */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Profilo Utente</h2>
        
        {updateError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}
        
        {updateSuccess && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{updateSuccess}</AlertDescription>
          </Alert>
        )}
        
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">Salva</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(currentUser?.displayName || '');
                }}
              >
                Annulla
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p>{currentUser?.email}</p>
              </div>
              <User className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p>{currentUser?.displayName || 'Non impostato'}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
              >
                Modifica
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Statistiche generali */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Statistiche</h2>
        <div className="space-y-2">
          <p>Impegni totali: {tasks.length}</p>
          <p>Contatori attivi: {counters.length}</p>
          <p>Account creato: {currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('it-IT') : 'N/A'}</p>
        </div>
      </div>

      {/* Azioni */}
      <div className="space-y-4">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <Button
            variant="ghost"
            className="w-full p-4 flex items-center justify-between text-left"
            onClick={() => resetDailyCounters()}
          >
            <div>
              <p className="font-medium">Reset Contatori Giornalieri</p>
              <p className="text-sm text-gray-500">
                Azzera tutti i contatori giornalieri
              </p>
            </div>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <Button
            variant="ghost"
            className={`w-full p-4 flex items-center justify-between text-left ${
              showConfirmDelete ? 'bg-red-50' : ''
            }`}
            onClick={handleDeleteAll}
          >
            <div>
              <p className="font-medium text-red-600">
                {showConfirmDelete ? 'Conferma eliminazione' : 'Elimina tutti i dati'}
              </p>
              <p className="text-sm text-red-400">
                {showConfirmDelete 
                  ? 'Clicca di nuovo per confermare' 
                  : 'Rimuovi tutti gli impegni e i contatori'}
              </p>
            </div>
            <Trash2 className="h-5 w-5 text-red-600" />
          </Button>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <Button
            variant="ghost"
            className="w-full p-4 flex items-center justify-between text-left"
            onClick={handleLogout}
          >
            <div>
              <p className="font-medium">Esci</p>
              <p className="text-sm text-gray-500">
                Disconnetti questo account
              </p>
            </div>
            <LogOut className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>MyRoutine v1.0.0</p>
        <p className="mt-1">Sviluppato con ❤️</p>
      </div>
    </div>
  );
};

export default SettingsPage;