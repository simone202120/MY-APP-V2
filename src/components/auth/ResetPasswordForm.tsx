// src/components/auth/ResetPasswordForm.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";

const ResetPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setMessage('');
      setIsLoading(true);
      await resetPassword(email);
      setMessage('Controlla la tua email per le istruzioni di reset.');
    } catch (err: any) {
      setError('Impossibile inviare email di reset. Verifica che l\'email sia corretta.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full space-y-6 p-6 bg-white rounded-xl shadow-sm">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-gray-500 mt-2">Ti invieremo un link per reimpostare la password</p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {message && (
        <Alert variant="success">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Invio in corso...' : 'Invia Link di Reset'}
        </Button>
        
        <div className="text-center text-sm">
          <Link to="/login" className="text-primary-600 hover:text-primary-500">
            Torna al Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;