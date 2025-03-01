// src/components/counters/CounterHistory.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import it from 'date-fns/locale/it';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';
import { CounterEntry } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Calendar } from 'lucide-react';

interface CounterHistoryProps {
  counterId: string;
  counterName: string;
}

const CounterHistory: React.FC<CounterHistoryProps> = ({ counterId, counterName }) => {
  const { getCounterHistory } = useApp();
  const [history, setHistory] = useState<CounterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    max: 0,
    total: 0,
    trend: 'stable' as 'up' | 'down' | 'stable'
  });

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const entries = await getCounterHistory(counterId);
        
        // Ordina le voci per data (dalla più recente alla più vecchia)
        entries.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setHistory(entries);
        
        // Calcola le statistiche
        if (entries.length > 0) {
          const values = entries.map(e => e.value);
          const average = values.reduce((sum, val) => sum + val, 0) / values.length;
          const max = Math.max(...values);
          const total = values.reduce((sum, val) => sum + val, 0);
          
          // Determina il trend (confronta gli ultimi due valori se disponibili)
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (entries.length >= 2) {
            if (entries[0].value > entries[1].value) {
              trend = 'up';
            } else if (entries[0].value < entries[1].value) {
              trend = 'down';
            }
          }
          
          setStats({ average, max, total, trend });
        }
      } catch (error) {
        console.error("Errore nel recuperare la cronologia del contatore:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [counterId, getCounterHistory]);

  // Prepara i dati per il grafico
  const chartData = [...history]
    .reverse() // Inverti per mostrare i dati in ordine cronologico
    .map(entry => ({
      date: format(new Date(entry.date), 'd MMM', { locale: it }),
      value: entry.value
    }));

  if (isLoading) {
    return <div className="p-4 text-center">Caricamento...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Nessuna cronologia disponibile per questo contatore</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{counterName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Media</p>
            <p className="text-xl font-semibold">{stats.average.toFixed(1)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Massimo</p>
            <p className="text-xl font-semibold">{stats.max}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Trend</p>
            <div className="flex items-center">
              <p className="text-xl font-semibold">
                {stats.trend === 'up' && <ArrowUpRight className="h-5 w-5 text-emerald-500" />}
                {stats.trend === 'down' && <ArrowDownRight className="h-5 w-5 text-tertiary-500" />}
                {stats.trend === 'stable' && <ArrowRight className="h-5 w-5 text-gray-500" />}
              </p>
            </div>
          </div>
        </div>
        
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0d90e5" 
                strokeWidth={2}
                dot={{ r: 4, fill: "#0d90e5", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#0d90e5", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium">Ultimi dati:</p>
          {history.slice(0, 5).map((entry, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">
                  {format(new Date(entry.date), 'EEEE d MMMM yyyy', { locale: it })}
                </span>
              </div>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CounterHistory;