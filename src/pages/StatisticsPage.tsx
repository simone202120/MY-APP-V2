// pages/StatisticsPage.tsx - Dashboard analitica completa
import React, { useMemo, useState, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar,
  Area, AreaChart, ReferenceLine
} from 'recharts';
import { useApp } from '../context/AppContext';
import { 
  CheckCircle2, Clock, Target, ChevronDown, ChevronUp, 
  Calendar, Flame, TrendingUp, BarChart2, PieChart as PieChartIcon,
  Activity, Lightbulb
} from 'lucide-react';
import { format, parseISO, startOfWeek, 
  endOfWeek, isWithinInterval, differenceInDays, addDays, 
  getDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isAfter, 
  isBefore, subDays, isSameDay
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

// Componenti specifici per le statistiche
import WeeklyHeatMap from '../components/statistics/WeeklyHeatMap';
import TrendAnalysis from '../components/statistics/TrendAnalysis';
import CounterTrends from '../components/statistics/CounterTrends';
import InsightsPanel from '../components/statistics/InsightsPanel';

// Tipi di periodo per la selezione temporale
type PeriodType = 'day' | 'week' | 'month' | 'year' | 'all';

const StatisticsPage = () => {
  const { tasks, counters, counterEntries } = useApp();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    timeline: false,
    behavior: false,
    counters: false,
    insights: false
  });
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');

  // Toggle espansione sezione
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Ottiene le date relative al periodo selezionato
  const periodDates = useMemo(() => {
    const today = new Date();
    
    switch (selectedPeriod) {
      case 'day':
        // Per giorno, usa la giornata attuale
        return { start: today, end: today };
      case 'week':
        return { start: startOfWeek(today, { locale: it }), end: endOfWeek(today, { locale: it }) };
      case 'month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'year':
        return { start: startOfYear(today), end: endOfYear(today) };
      default:
        return { start: new Date(0), end: today };
    }
  }, [selectedPeriod]);

  // Filtra le attività in base al periodo selezionato
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.type === 'oneTime' && task.date) {
        const taskDate = parseISO(task.date);
        return isWithinInterval(taskDate, periodDates);
      }
      
      // Per le routine, controlla se dovrebbero essere visualizzate in questo periodo
      if (task.type === 'routine') {
        // Se il task ha completedDates, controlla se alcune di esse rientrano nel periodo
        if (task.completedDates && task.completedDates.length > 0) {
          return task.completedDates.some(dateStr => {
            const date = parseISO(dateStr);
            return isWithinInterval(date, periodDates);
          });
        }
        
        // Altrimenti, includi il task se il suo periodo di validità si sovrappone al periodo selezionato
        if (task.startDate) {
          const taskStart = parseISO(task.startDate);
          const taskEnd = task.endDate ? parseISO(task.endDate) : new Date();
          
          return (
            (isAfter(taskStart, periodDates.start) && isBefore(taskStart, periodDates.end)) ||
            (isAfter(taskEnd, periodDates.start) && isBefore(taskEnd, periodDates.end)) ||
            (isBefore(taskStart, periodDates.start) && isAfter(taskEnd, periodDates.end))
          );
        }
      }
      
      // Includi di default
      return true;
    });
  }, [tasks, periodDates]);

  // Filtra le voci dei contatori in base al periodo selezionato
  const filteredCounterEntries = useMemo(() => {
    return counterEntries.filter(entry => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, periodDates);
    });
  }, [counterEntries, periodDates]);

  // Calcolo delle statistiche principali
  const taskStats = useMemo(() => {
    // Contatori base
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(task => {
      if (task.type === 'oneTime') {
        return task.isCompleted;
      }
      
      // Per le routine, controlla se hanno date completate nel periodo selezionato
      if (task.completedDates && task.completedDates.length > 0) {
        return task.completedDates.some(dateStr => {
          const date = parseISO(dateStr);
          return isWithinInterval(date, periodDates);
        });
      }
      
      return false;
    }).length;
    
    const routine = filteredTasks.filter(task => task.type === 'routine').length;
    const oneTime = filteredTasks.filter(task => task.type === 'oneTime').length;

    // Calcolo streaks (serie consecutive di giorni con task completati)
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Costruisci un set di date completate
    const completedDatesSet = new Set<string>();
    tasks.forEach(task => {
      if (task.completedDates) {
        task.completedDates.forEach(date => completedDatesSet.add(date));
      } else if (task.type === 'oneTime' && task.isCompleted && task.date) {
        completedDatesSet.add(task.date);
      }
    });
    
    // Conta la streak attuale andando all'indietro dal giorno corrente
    const today = new Date();
    let checkDate = today;
    let formatDate = format(checkDate, 'yyyy-MM-dd');
    
    while (completedDatesSet.has(formatDate)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
      formatDate = format(checkDate, 'yyyy-MM-dd');
    }
    
    // Trova la streak massima esaminando tutte le date di completamento
    let tempStreak = 0;
    const allDates = Array.from(completedDatesSet).sort();
    
    if (allDates.length > 0) {
      // Converti stringhe in date
      const sortedDates = allDates.map(dateStr => parseISO(dateStr))
                                 .sort((a, b) => a.getTime() - b.getTime());
      
      tempStreak = 1; // Inizia con 1 per la prima data
      let currentStrip = 1;
      
      // Controlla ogni giorno dopo il primo
      for (let i = 1; i < sortedDates.length; i++) {
        const currDate = sortedDates[i];
        const prevDate = sortedDates[i-1];
        
        // Se la data attuale è il giorno successivo alla precedente
        if (differenceInDays(currDate, prevDate) === 1) {
          currentStrip++;
        } else {
          // Reset se c'è un gap
          currentStrip = 1;
        }
        
        // Aggiorna la streak massima
        if (currentStrip > tempStreak) {
          tempStreak = currentStrip;
        }
      }
      
      maxStreak = tempStreak;
    }

    return {
      total,
      completed,
      completion: total ? Math.round((completed / total) * 100) : 0,
      routine,
      oneTime,
      currentStreak,
      maxStreak
    };
  }, [filteredTasks, periodDates, tasks]);

  // Calcolo dei dati per il grafico di distribuzione dei tipi di task
  const taskTypeData = useMemo(() => [
    { name: 'Routine', value: taskStats.routine },
    { name: 'Una tantum', value: taskStats.oneTime }
  ], [taskStats]);

  // Calcolo dei dati per il grafico del trend di completamento nel tempo
  const completionTrendData = useMemo(() => {
    const days = 14; // Mostra il trend degli ultimi 14 giorni
    const data = [];
    
    // Crea un set di date completate per lookup veloce
    const completedDatesMap = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.completedDates) {
        task.completedDates.forEach(date => {
          completedDatesMap.set(date, (completedDatesMap.get(date) || 0) + 1);
        });
      } else if (task.type === 'oneTime' && task.isCompleted && task.date) {
        completedDatesMap.set(task.date, (completedDatesMap.get(task.date) || 0) + 1);
      }
    });
    
    // Genera i dati per ogni giorno
    for (let i = days - 1; i >= 0; i--) {
      // Usa setDate invece di subDays
      const today = new Date();
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const tasksCompleted = completedDatesMap.get(dateStr) || 0;
      
      data.push({
        date: format(date, 'd MMM', { locale: it }),
        completati: tasksCompleted,
        dateObj: date, // Per ordinamento e filtro
      });
    }
    
    return data;
  }, [tasks]);

  // Dati per il confronto periodo su periodo
  const periodComparisonData = useMemo(() => {
    // Calcola i dati del periodo corrente
    const currentPeriodTotal = filteredTasks.length;
    const currentPeriodCompleted = taskStats.completed;
    
    // Determina il periodo precedente in base al tipo di periodo selezionato
    let previousPeriodStart: Date = new Date(0);
    let previousPeriodEnd: Date = new Date(0);
    
    switch (selectedPeriod) {
      case 'day':
        // Usa new Date e setDate invece di subDays
        previousPeriodStart = new Date(periodDates.start);
        previousPeriodStart.setDate(periodDates.start.getDate() - 1);
        previousPeriodEnd = new Date(periodDates.end);
        previousPeriodEnd.setDate(periodDates.end.getDate() - 1);
        break;
      case 'week':
        previousPeriodStart = new Date(periodDates.start);
        previousPeriodStart.setDate(periodDates.start.getDate() - 7);
        previousPeriodEnd = new Date(periodDates.end);
        previousPeriodEnd.setDate(periodDates.end.getDate() - 7);
        break;
      case 'month':
        // Approssimazione del mese precedente
        previousPeriodStart = new Date(periodDates.start);
        previousPeriodStart.setDate(periodDates.start.getDate() - 30);
        previousPeriodEnd = new Date(periodDates.end);
        previousPeriodEnd.setDate(periodDates.end.getDate() - 30);
        break;
      case 'year':
        // Approssimazione dell'anno precedente
        previousPeriodStart = new Date(periodDates.start);
        previousPeriodStart.setDate(periodDates.start.getDate() - 365);
        previousPeriodEnd = new Date(periodDates.end);
        previousPeriodEnd.setDate(periodDates.end.getDate() - 365);
        break;
      default:
        previousPeriodStart = new Date(0);
        previousPeriodEnd = new Date(0);
    }
    
    // Calcola le statistiche del periodo precedente
    const previousPeriodStats = tasks.reduce((stats, task) => {
      const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
      
      let isInPreviousPeriod = false;
      let isCompletedInPreviousPeriod = false;
      
      if (task.type === 'oneTime' && task.date) {
        const taskDate = parseISO(task.date);
        isInPreviousPeriod = isWithinInterval(taskDate, previousInterval);
        isCompletedInPreviousPeriod = isInPreviousPeriod && task.isCompleted;
      } else if (task.type === 'routine') {
        if (task.completedDates && task.completedDates.length > 0) {
          const hasCompletedDateInPeriod = task.completedDates.some(dateStr => {
            const date = parseISO(dateStr);
            return isWithinInterval(date, previousInterval);
          });
          
          if (hasCompletedDateInPeriod) {
            isInPreviousPeriod = true;
            isCompletedInPreviousPeriod = true;
          }
        }
        
        // Il task è nel periodo se il suo intervallo si sovrappone al periodo precedente
        if (task.startDate) {
          const taskStart = parseISO(task.startDate);
          const taskEnd = task.endDate ? parseISO(task.endDate) : new Date();
          
          isInPreviousPeriod = isInPreviousPeriod || (
            (isAfter(taskStart, previousInterval.start) && isBefore(taskStart, previousInterval.end)) ||
            (isAfter(taskEnd, previousInterval.start) && isBefore(taskEnd, previousInterval.end)) ||
            (isBefore(taskStart, previousInterval.start) && isAfter(taskEnd, previousInterval.end))
          );
        }
      }
      
      if (isInPreviousPeriod) {
        stats.total++;
      }
      
      if (isCompletedInPreviousPeriod) {
        stats.completed++;
      }
      
      return stats;
    }, { total: 0, completed: 0 });
    
    const previousPeriodCompletion = previousPeriodStats.total 
      ? Math.round((previousPeriodStats.completed / previousPeriodStats.total) * 100) 
      : 0;
    
    const currentPeriodCompletion = currentPeriodTotal 
      ? Math.round((currentPeriodCompleted / currentPeriodTotal) * 100) 
      : 0;
    
    const completionDelta = currentPeriodCompletion - previousPeriodCompletion;
    
    return {
      current: {
        total: currentPeriodTotal,
        completed: currentPeriodCompleted,
        completion: currentPeriodCompletion
      },
      previous: {
        total: previousPeriodStats.total,
        completed: previousPeriodStats.completed,
        completion: previousPeriodCompletion
      },
      delta: {
        total: currentPeriodTotal - previousPeriodStats.total,
        completed: currentPeriodCompleted - previousPeriodStats.completed,
        completion: completionDelta
      }
    };
  }, [filteredTasks, taskStats, tasks, selectedPeriod, periodDates]);

  // Renderers personalizzati per i grafici
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 rounded-lg shadow-md">
          <p className="font-medium">{data.name}</p>
          <p>{data.value} impegni ({((data.value / taskStats.total) * 100).toFixed(1)}%)</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center space-x-4 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center">
            <span 
              className="inline-block w-3 h-3 mr-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.value} ({entry.payload.value})
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Colori coerenti con lo schema colori dell'app
  const COLORS = ['#0d90e5', '#9776ed', '#e74694'];  // Primary blue, Secondary purple, Tertiary pink

  // Formato per periodo selezionato
  const getPeriodLabel = () => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'day':
        return format(today, "EEEE d MMMM", { locale: it });
      case 'week':
        const startOfWeekDate = startOfWeek(today, { locale: it });
        const endOfWeekDate = endOfWeek(today, { locale: it });
        return `${format(startOfWeekDate, "d", { locale: it })} - ${format(endOfWeekDate, "d MMMM", { locale: it })}`;
      case 'month':
        return format(today, "MMMM yyyy", { locale: it });
      case 'year':
        return format(today, "yyyy", { locale: it });
      default:
        return "Tutto il periodo";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Selettore periodo */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Statistiche</h1>
          <div className="flex space-x-2">
            <Button 
              variant={selectedPeriod === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('day')}
            >
              Giorno
            </Button>
            <Button 
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              Settimana
            </Button>
            <Button 
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Mese
            </Button>
            <Button 
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
            >
              Anno
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{getPeriodLabel()}</p>
      </div>

      {/* Sezione 1: Panoramica */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('overview')}
        >
          <div className="flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2 text-primary-500" />
            <h2 className="text-lg font-semibold">Panoramica Impegni</h2>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {expandedSections.overview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {expandedSections.overview && (
          <div className="p-4 border-t">
            {/* Card statistiche generali */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Impegni Totali</p>
                    <p className="text-2xl font-bold mt-1">{taskStats.total}</p>
                  </div>
                  <Target className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completati</p>
                    <p className="text-2xl font-bold mt-1">{taskStats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Streak Attuale</p>
                    <p className="text-2xl font-bold mt-1">{taskStats.currentStreak}</p>
                  </div>
                  <Flame className="h-8 w-8 text-tertiary-500" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Streak Massima</p>
                    <p className="text-2xl font-bold mt-1">{taskStats.maxStreak}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-secondary-500" />
                </div>
              </div>
            </div>

            {/* Grafico tasso di completamento */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tasso di Completamento</h3>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary-500" />
                  <p className="text-2xl font-bold">{taskStats.completion}%</p>
                </div>
              </div>
              <div className="mb-2 h-3 bg-gray-100 rounded-full">
                <div 
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${taskStats.completion}%` }}
                />
              </div>

              {/* Confronto con periodo precedente */}
              <div className="flex justify-between text-sm mt-4">
                <div>
                  <span className="text-gray-500">Periodo precedente: </span>
                  <span className="font-medium">{periodComparisonData.previous.completion}%</span>
                </div>
                <div className={`font-medium ${periodComparisonData.delta.completion >= 0 ? 'text-emerald-500' : 'text-tertiary-500'}`}>
                  {periodComparisonData.delta.completion > 0 && '+'}
                  {periodComparisonData.delta.completion}%
                </div>
              </div>
            </div>

            {/* Grafico distribuzione tipi di task */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Distribuzione Impegni</h3>
              {taskStats.total > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 text-gray-400">
                  <p>Nessun dato disponibile per il periodo selezionato</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sezione 2: Analisi Temporale */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('timeline')}
        >
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary-500" />
            <h2 className="text-lg font-semibold">Analisi Temporale</h2>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {expandedSections.timeline ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {expandedSections.timeline && (
          <div className="p-4 border-t">
            {/* Trend di completamento nel tempo */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
              <h3 className="text-lg font-semibold mb-4">Trend di Completamento</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={completionTrendData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value} impegni`, 'Completati']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completati" 
                      name="Completati"
                      stroke="#0d90e5" 
                      fill="#0d90e5" 
                      fillOpacity={0.1}
                    />
                    <ReferenceLine 
                      y={completionTrendData.reduce((sum, item) => sum + item.completati, 0) / completionTrendData.length} 
                      stroke="#9776ed" 
                      strokeDasharray="3 3"
                      label={{ value: 'Media', position: 'insideBottomRight', fill: '#9776ed', fontSize: 10 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heatmap settimanale */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Distribuzione Settimanale</h3>
              <WeeklyHeatMap tasks={tasks} />
            </div>
          </div>
        )}
      </div>

      {/* Sezione 3: Analisi Comportamentale */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('behavior')}
        >
          <div className="flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-primary-500" />
            <h2 className="text-lg font-semibold">Analisi Comportamento</h2>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {expandedSections.behavior ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {expandedSections.behavior && (
          <div className="p-4 border-t">
            <TrendAnalysis tasks={filteredTasks} allTasks={tasks} period={selectedPeriod} />
          </div>
        )}
      </div>

      {/* Sezione 4: Statistiche Contatori */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('counters')}
        >
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary-500" />
            <h2 className="text-lg font-semibold">Statistiche Contatori</h2>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {expandedSections.counters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {expandedSections.counters && (
          <div className="p-4 border-t">
            <CounterTrends 
              counters={counters} 
              counterEntries={filteredCounterEntries} 
              allCounterEntries={counterEntries}
              period={selectedPeriod}
            />
          </div>
        )}
      </div>

      {/* Sezione 5: Insights e Suggerimenti */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('insights')}
        >
          <div className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-primary-500" />
            <h2 className="text-lg font-semibold">Insights e Suggerimenti</h2>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {expandedSections.insights ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {expandedSections.insights && (
          <div className="p-4 border-t">
            <InsightsPanel 
              tasks={tasks} 
              counters={counters}
              counterEntries={counterEntries}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;