// components/counters/DeleteCounterDialog.tsx
import React from 'react';
import { Button } from "../ui/button";

interface DeleteCounterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  counterName: string;
}

const DeleteCounterDialog: React.FC<DeleteCounterDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  counterName
}) => {
  if (!isOpen) return null;

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
        
        <div className="flex flex-col space-y-2">
          <Button
            variant="default"
            className="w-full"
            onClick={onDelete}
          >
            Elimina
          </Button>
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