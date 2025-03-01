// components/layout/ThemeToggle.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Switch } from '../ui/switch';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center space-x-2">
      {showLabel && (
        <span className="text-sm font-medium">
          {isDark ? 'Tema scuro' : 'Tema chiaro'}
        </span>
      )}
      <div className="flex items-center" onClick={toggleTheme}>
        <Switch checked={isDark} onCheckedChange={toggleTheme} />
        <div className="ml-2">
          {isDark ? (
            <motion.div
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 30, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ rotate: 30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -30, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="h-4 w-4 text-amber-500" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;