// src/components/statistics/CounterTrends.tsx
import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, ReferenceLine, Legend
} from 'recharts';
import { format, parseISO, isAfter, isBefore, subDays, endOfDay, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Counter, CounterEntry } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { TrendingUp, ArrowDown, ArrowUp, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface CounterTrendsProps {
  counters: Counter[];
  counterEntries: CounterEntry[];
  allCounterEntries: CounterEntry[];
  period: 'day' | 'week' | 'month' | 'year' | 'all';
}

const CounterTrends: React.FC<CounterTrendsProps> = ({ 
  counters, 
  counterEntries,
  allCounterEntries,
  period 
}) => {
  const [expandedCounter, setExpandedCounter] = useState<string | null>(null);

  // Toggle espansione del contatore
  const toggleExpandCounter = (counterId: string) => {
    if (expandedCounter === counterId) {
      setExpandedCounter(null);
    } else {
      setExpandedCounter(counterId);
    }
  };

  // Funzione per calcolare le statistiche per un contatore
  const calculateCounterStats = (counterId: string) => {
    const entries = allCounterEntries.filter(entry => entry.counterId === counterId);
    
    if (entries.length === 0) {
      return { 
        average: 0, 
        max: 0, 
        min: 0, 
        median: 0, 
        total: 0, 
        trend: 'stable' as 'up' | 'down' | 'stable' 
      };
    }
    
    // Ordina per data
    entries.sort((a, b) => {
      return parseISO(b.date).getTime() - parseISO(a.date).getTime();
    });
    
    // Estrai solo i valori per i calcoli
    const values = entries.map(entry => entry.value);
    
    // Calcoli statistici
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    // Calcola la mediana
    const sortedValues = [...values].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedValues.length / 2);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
      : sortedValues[middleIndex];
    
    // Determina il trend (confrontando gli ultimi due valori se disponibili)
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (entries.length >= 2) {
      if (entries[0].value > entries[1].value) {
        trend = 'up';
      } else if (entries[0].value < entries[1].value) {
        trend = 'down';
      }
    }
    
    return { average, max, min, median, total, trend };
  };

  // Costruisce i dati del trend per un contatore
  const getCounterTrendData = (counterId: string) => {
    const entries = allCounterEntries.filter(entry => entry.counterId === counterId);
    
    if (entries.length === 0) return [];
    
    // Ordina per data (dalla più vecchia alla più recente per il grafico)
    entries.sort((a, b) => {
      return parseISO(a.date).getTime() - parseISO(b.date).getTime();
    });
    
    // Limita a massimo 30 punti dati per leggibilità
    const limitedEntries = entries.length > 30 
      ? entries.slice(entries.length - 30) 
      : entries;
    
    // Costruisci i dati per il grafico
    return limitedEntries.map(entry => ({
      date: format(parseISO(entry.date), 'd MMM', { locale: it }),
      value: entry.value,
      dateObj: parseISO(entry.date) // Per ordinamento e filtri
    }));
  };

  // Calcola le proiezioni future
  const getCounterProjection = (counterId: string) => {
    const entries = allCounterEntries.filter(entry => entry.counterId === counterId);
    
    if (entries.length < 5) return null; // Servono abbastanza dati per fare previsioni
    
    // Ordina per data
    entries.sort((a, b) => {
      return parseISO(a.date).getTime() - parseISO(b.date).getTime();
    });
    
    // Calcola la tendenza lineare semplice
    const n = entries.length;
    const dates = entries.map(entry => parseISO(entry.date).getTime());
    const values = entries.map(entry => entry.value);
    
    // Normalizza i valori per tempo (in giorni dal primo punto)
    const firstDate = dates[0];
    const normalizedDates = dates.map(date => (date - firstDate) / (1000 * 60 * 60 * 24));
    
    // Calcola i coefficienti della regressione lineare (y = mx + b)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += normalizedDates[i];
      sumY += values[i];
      sumXY += normalizedDates[i] * values[i];
      sumX2 += normalizedDates[i] * normalizedDates[i];
    }
    
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    
    // Genera proiezioni per 7 giorni futuri
    const projectionData = [];
    const lastDate = parseISO(entries[entries.length - 1].date);
    
    for (let i = 1; i <= 7; i++) {
      // Usa new Date e setDate per aggiungere giorni invece di addDays
      const futureDate = new Date(lastDate);
      futureDate.setDate(lastDate.getDate() + i);
      const daysFromStart = normalizedDates[normalizedDates.length - 1] + i;
      const projectedValue = m * daysFromStart + b;
      
      projectionData.push({
        date: format(futureDate, 'd MMM', { locale: it }),
        projection: Math.max(0, Math.round(projectedValue * 10) / 10), // Arrotonda a 1 decimale, non negativo
        dateObj: futureDate
      });
    }
    
    return {
      trend: m > 0 ? 'up' : m < 0 ? 'down' : 'stable',
      projectionData,
      dailyChange: m, // Variazione media giornaliera
      // Proiezione a 7 giorni
      weekProjection: Math.max(0, Math.round((values[values.length - 1] + 7 * m) * 10) / 10)
    };
  };

  // Confronto periodo corrente vs precedente
  const getCounterComparison = (counterId: string) => {
    // Determina la lunghezza del periodo attuale in giorni
    let periodLengthDays;
    switch (period) {
      case 'day': periodLengthDays = 1; break;
      case 'week': periodLengthDays = 7; break;
      case 'month': periodLengthDays = 30; break;
      case 'year': periodLengthDays = 365; break;
      default: periodLengthDays = 7; // Default a settimana
    }
    
    const today = new Date();
    const periodStart = subDays(today, periodLengthDays);
    const previousPeriodStart = subDays(periodStart, periodLengthDays);
    
    // Filtra le voci per il periodo corrente
    const currentPeriodEntries = allCounterEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return entry.counterId === counterId && 
        isAfter(entryDate, periodStart) && 
        isBefore(entryDate, endOfDay(today));
    });
    
    // Filtra le voci per il periodo precedente
    const previousPeriodEntries = allCounterEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return entry.counterId === counterId && 
        isAfter(entryDate, previousPeriodStart) && 
        isBefore(entryDate, startOfDay(periodStart));
    });
    
    // Calcola i totali per entrambi i periodi
    const currentTotal = currentPeriodEntries.reduce((sum, entry) => sum + entry.value, 0);
    const previousTotal = previousPeriodEntries.reduce((sum, entry) => sum + entry.value, 0);
    
    // Calcola la variazione percentuale
    const percentChange = previousTotal === 0 
      ? 100 // Se il periodo precedente era 0, considera come 100% di aumento
      : Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    
    return {
      current: currentTotal,
      previous: previousTotal,
      change: currentTotal - previousTotal,
      percentChange: percentChange
    };
  };

  // Memoizza i contatori con dati sufficienti per l'analisi
  const countersWithData = useMemo(() => {
    return counters.filter(counter => {
      const entries = allCounterEntries.filter(entry => entry.counterId === counter.id);
      return entries.length > 0;
    });
  }, [counters, allCounterEntries]);

  return (
    <div className="space-y-6">
      {/* Statistiche generali sui contatori */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contatori Attivi</p>
              <p className="text-2xl font-bold mt-1">{counters.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contatori Giornalieri</p>
              <p className="text-2xl font-bold mt-1">{counters.filter(c => c.type === 'daily').length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-secondary-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contatori Totali</p>
              <p className="text-2xl font-bold mt-1">{counters.filter(c => c.type === 'total').length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-tertiary-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Registrazioni</p>
              <p className="text-2xl font-bold mt-1">{counterEntries.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Sezione contatori con dettagli espandibili */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Analisi Contatori</h3>

        {countersWithData.length > 0 ? (
          countersWithData.map(counter => {
            const stats = calculateCounterStats(counter.id);
            const isExpanded = expandedCounter === counter.id;
            const comparison = getCounterComparison(counter.id);
            
            return (
              <div key={counter.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpandCounter(counter.id)}
                >
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{counter.name}</p>
                        <p className="text-sm text-gray-500">{counter.type === 'daily' ? 'Giornaliero' : 'Totale'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-primary-600">{counter.currentValue}</p>
                        <div className="flex items-center justify-end text-sm">
                          {comparison.percentChange > 0 ? (
                            <>
                              <ArrowUp className="h-3 w-3 text-emerald-500 mr-1" />
                              <span className="text-emerald-500">+{comparison.percentChange}%</span>
                            </>
                          ) : comparison.percentChange < 0 ? (
                            <>
                              <ArrowDown className="h-3 w-3 text-tertiary-500 mr-1" />
                              <span className="text-tertiary-500">{comparison.percentChange}%</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3 text-gray-500 mr-1" />
                              <span className="text-gray-500">Stabile</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap mt-2 gap-2">
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        Media: <span className="font-medium">{stats.average.toFixed(1)}</span>
                      </div>
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        Max: <span className="font-medium">{stats.max}</span>
                      </div>
                      <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                        Min: <span className="font-medium">{stats.min}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-1 ml-4">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
                
                {isExpanded && (
                  <div className="border-t p-4">
                    {/* Grafico del trend */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-2 text-gray-500">Trend nel tempo</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={getCounterTrendData(counter.id)}
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              allowDecimals={counter.type === 'daily'}
                            />
                            <Tooltip
                              formatter={(value: any) => [value, 'Valore']}
                              labelFormatter={(label) => `Data: ${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              name="Valore"
                              stroke="#0d90e5"
                              strokeWidth={2}
                              dot={{ r: 4, fill: "#0d90e5", stroke: "#ffffff", strokeWidth: 2 }}
                              activeDot={{ r: 6, fill: "#0d90e5", stroke: "#ffffff", strokeWidth: 2 }}
                            />
                            <ReferenceLine 
                              y={stats.average} 
                              stroke="#9776ed" 
                              strokeDasharray="3 3"
                              label={{ value: 'Media', fill: '#9776ed', fontSize: 10 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Statistiche dettagliate */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Media</p>
                        <p className="text-lg font-semibold">{stats.average.toFixed(1)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Mediana</p>
                        <p className="text-lg font-semibold">{stats.median.toFixed(1)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Minimo</p>
                        <p className="text-lg font-semibold">{stats.min}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Massimo</p>
                        <p className="text-lg font-semibold">{stats.max}</p>
                      </div>
                    </div>

                    {/* Proiezioni e confronti */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Proiezione */}
                      <div className="border border-gray-100 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2 text-gray-500">Proiezione a 7 giorni</h4>
                        {getCounterProjection(counter.id) ? (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-base">Tendenza:</span>
                              <div className="flex items-center">
                                {getCounterProjection(counter.id)?.trend === 'up' && (
                                  <>
                                    <ArrowUp className="h-4 w-4 text-emerald-500 mr-1" />
                                    <span className="text-emerald-500">In crescita</span>
                                  </>
                                )}
                                {getCounterProjection(counter.id)?.trend === 'down' && (
                                  <>
                                    <ArrowDown className="h-4 w-4 text-tertiary-500 mr-1" />
                                    <span className="text-tertiary-500">In calo</span>
                                  </>
                                )}
                                {getCounterProjection(counter.id)?.trend === 'stable' && (
                                  <>
                                    <ArrowRight className="h-4 w-4 text-gray-500 mr-1" />
                                    <span className="text-gray-500">Stabile</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-base">Variazione media:</span>
                              <span className="font-medium">
                                {getCounterProjection(counter.id)?.dailyChange.toFixed(2)} al giorno
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-base">Valore atteso fra 7 giorni:</span>
                              <span className="font-medium">
                                {getCounterProjection(counter.id)?.weekProjection}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-center">Dati insufficienti per la proiezione</p>
                        )}
                      </div>

                      {/* Confronto periodo */}
                      <div className="border border-gray-100 rounded-lg p-3">
                        <h4 className="text-sm font-medium mb-2 text-gray-500">Confronto con periodo precedente</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-base">Periodo attuale:</span>
                          <span className="font-medium">{comparison.current}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-base">Periodo precedente:</span>
                          <span className="font-medium">{comparison.previous}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-base">Variazione:</span>
                          <div className="flex items-center">
                            {comparison.change > 0 ? (
                              <>
                                <ArrowUp className="h-4 w-4 text-emerald-500 mr-1" />
                                <span className="text-emerald-500 font-medium">+{comparison.change} ({comparison.percentChange}%)</span>
                              </>
                            ) : comparison.change < 0 ? (
                              <>
                                <ArrowDown className="h-4 w-4 text-tertiary-500 mr-1" />
                                <span className="text-tertiary-500 font-medium">{comparison.change} ({comparison.percentChange}%)</span>
                              </>
                            ) : (
                              <>
                                <ArrowRight className="h-4 w-4 text-gray-500 mr-1" />
                                <span className="text-gray-500 font-medium">Nessuna variazione</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
            <p>Non ci sono ancora dati sufficienti per l'analisi dei contatori.</p>
            <p className="text-sm mt-2">Continua a tracciare i tuoi contatori per visualizzare le statistiche.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterTrends;