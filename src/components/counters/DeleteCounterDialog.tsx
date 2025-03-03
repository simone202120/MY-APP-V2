// components/counters/DeleteCounterDialog.tsx
import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Trash2, Trash } from 'lucide-react';

interface DeleteCounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (deleteAll?: boolean) => void;
  counterName: string;
  counterHasMultiple?: boolean;
}

const DeleteCounterDialog: React.FC<DeleteCounterDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  counterName,
  counterHasMultiple = false
}) => {
  const [showDeleteAllOption, setShowDeleteAllOption] = useState(false);
  
  if (!isOpen) return null;

  // Estrai il nome base (senza data) per mostrarlo nell'opzione di eliminazione di tutti
  const baseName = counterName.includes('(') 
    ? counterName.split('(')[0].trim() 
    : counterName;

  const handleSingleDelete = () => {
    onDelete(false);
  };

  const handleDeleteAll = () => {
    onDelete(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Elimina contatore
        </h2>
        
        <p className="text-gray-600 mb-6">
          Sei sicuro di voler eliminare il contatore "{counterName}"? 
          {counterName.includes("giornaliero") && (
            <span> La cronologia di questo contatore non verrà eliminata.</span>
          )}
        </p>
        
        {counterHasMultiple && (
          <div className="bg-amber-50 p-3 rounded-lg mb-4 border border-amber-200">
            <p className="text-amber-800 text-sm">
              Questo contatore fa parte di una serie. Puoi scegliere di eliminare solo questa istanza o tutti i contatori con lo stesso nome.
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Button
            variant="default"
            className="w-full flex items-center justify-center"
            onClick={handleSingleDelete}
          >
            <Trash className="h-4 w-4 mr-2" />
            Elimina questo contatore
          </Button>
          
          {counterHasMultiple && (
            <Button
              variant="destructive"
              className="w-full flex items-center justify-center"
              onClick={handleDeleteAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina tutti i contatori "{baseName}"
            </Button>
          )}
          
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Annulla
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCounterDialog;