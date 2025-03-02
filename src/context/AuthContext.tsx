// src/context/AuthContext.tsx - Aggiornato con autenticazione Google e Firebase Cloud Messaging
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config';
import FirebaseMessagingService from '../services/FirebaseMessagingService';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isPushNotificationsEnabled: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPushNotificationsEnabled, setIsPushNotificationsEnabled] = useState(false);
  const fcmService = FirebaseMessagingService.getInstance();

  // Effetto per inizializzare Firebase Cloud Messaging
  useEffect(() => {
    const initializeFCM = async () => {
      await fcmService.initialize();
      
      // Verifica se le notifiche push sono già abilitate
      if (fcmService.arePushNotificationsEnabled()) {
        setIsPushNotificationsEnabled(true);
      }
    };
    
    initializeFCM();
  }, []);

  // Effetto per gestire l'autenticazione
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
      
      // Se l'utente si è autenticato e le notifiche push sono già abilitate,
      // assicuriamoci che il token sia registrato per questo utente
      if (user && fcmService.arePushNotificationsEnabled()) {
        fcmService.requestPermissionAndRegisterToken(user.uid)
          .then(enabled => {
            setIsPushNotificationsEnabled(enabled);
          })
          .catch(error => {
            console.error('Errore durante la registrazione automatica del token FCM:', error);
          });
      }
    });

    return unsubscribe;
  }, []);

  // Funzione per abilitare le notifiche push
  const enablePushNotifications = async (): Promise<boolean> => {
    if (!currentUser) {
      return false;
    }
    
    try {
      const enabled = await fcmService.requestPermissionAndRegisterToken(currentUser.uid);
      setIsPushNotificationsEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Errore durante l\'abilitazione delle notifiche push:', error);
      return false;
    }
  };
  
  // Funzione per disabilitare le notifiche push
  const disablePushNotifications = async (): Promise<void> => {
    if (!currentUser) {
      return;
    }
    
    try {
      await fcmService.unregisterToken(currentUser.uid);
      setIsPushNotificationsEnabled(false);
    } catch (error) {
      console.error('Errore durante la disabilitazione delle notifiche push:', error);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      
      // Opzionalmente, chiedi all'utente se vuole abilitare le notifiche push
      // subito dopo la registrazione
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (displayName: string) => {
    try {
      setError(null);
      if (currentUser) {
        await updateProfile(currentUser, { displayName });
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    isLoading,
    error,
    isPushNotificationsEnabled,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    enablePushNotifications,
    disablePushNotifications
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};