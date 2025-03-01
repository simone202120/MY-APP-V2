// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setIsLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError('Accesso fallito. Per favore controlla le tue credenziali.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsGoogleLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError('Accesso con Google fallito. Riprova più tardi.');
      console.error(err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full space-y-6 p-6 bg-white rounded-xl shadow-sm">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Accedi</h1>
        <p className="text-gray-500 mt-2">Continua la tua routine quotidiana</p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/reset-password" className="text-primary-600 hover:text-primary-500">
              Password dimenticata?
            </Link>
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Accesso in corso...' : 'Accedi'}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Oppure continua con</span>
        </div>
      </div>
      
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
            fill="#EA4335"
          />
        </svg>
        {isGoogleLoading ? 'Connessione in corso...' : 'Accedi con Google'}
      </Button>
      
      <div className="text-center text-sm">
        <span className="text-gray-500">Non hai un account? </span>
        <Link to="/signup" className="text-primary-600 hover:text-primary-500">
          Registrati
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;