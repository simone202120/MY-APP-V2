// components/tasks/DeleteTaskDialog.tsx
import React from 'react';
import { Button } from "../ui/button";

interface DeleteTaskDialogProps {
  isOpen: boolean;
  isRoutine: boolean;
  onClose: () => void;
  onDeleteSingle: () => void;
  onDeleteAll: () => void;
}

const DeleteTaskDialog: React.FC<DeleteTaskDialogProps> = ({
  isOpen,
  isRoutine,
  onClose,
  onDeleteSingle,
  onDeleteAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Elimina impegno
        </h2>
        
        {isRoutine ? (
          <>
            <p className="text-gray-600 mb-6">
              Vuoi eliminare solo questo evento o tutta la routine?
            </p>
            <div className="flex flex-col space-y-2">
              <Button
                variant="default"
                className="w-full"
                onClick={onDeleteSingle}
              >
                Elimina solo questo evento
              </Button>
              <Button
                variant="default"
                className="w-full"
                onClick={onDeleteAll}
              >
                Elimina tutta la routine
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Annulla
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo impegno?
            </p>
            <div className="flex flex-col space-y-2">
              <Button
                variant="default"
                className="w-full"
                onClick={onDeleteSingle}
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
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteTaskDialog;