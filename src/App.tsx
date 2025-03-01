// App.tsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import CreateTaskPage from './pages/CreateTaskPage'; // Aggiungi questa import
import CreateCounterPage from './pages/CreateCounterPage'; // Aggiungi questa import
import { LoginForm, SignupForm, ResetPasswordForm } from './components/auth';
import { LayoutProvider } from './context/LayoutContext';


// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Routes that are accessible only when not logged in
interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (currentUser) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/calendar" 
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stats" 
          element={
            <ProtectedRoute>
              <StatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        {/* Aggiungi le nuove rotte */}
        <Route 
          path="/create-task" 
          element={
            <ProtectedRoute>
              <CreateTaskPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-counter" 
          element={
            <ProtectedRoute>
              <CreateCounterPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <LayoutProvider> {/* Aggiungi questo provider */}
          <Router>
            <Routes>
              <Route 
                path="/login" 
                element={
                  <PublicOnlyRoute>
                    <LoginForm />
                  </PublicOnlyRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <PublicOnlyRoute>
                    <SignupForm />
                  </PublicOnlyRoute>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <PublicOnlyRoute>
                    <ResetPasswordForm />
                  </PublicOnlyRoute>
                } 
              />
              <Route 
                path="/*" 
                element={
                  <Layout>
                    <AnimatedRoutes />
                  </Layout>
                } 
              />
            </Routes>
          </Router>
        </LayoutProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;