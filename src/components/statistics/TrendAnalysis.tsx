// src/components/statistics/TrendAnalysis.tsx
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, 
  subDays, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Task } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Activity, Award, Calendar, Clock } from 'lucide-react';

interface TrendAnalysisProps {
  tasks: Task[];
  allTasks: Task[];
  period: 'day' | 'week' | 'month' | 'year' | 'all';
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ tasks, allTasks, period }) => {
  // Genera categorie di task
  const taskCategories = useMemo(() => {
    // Estrai categorie uniche dai titoli dei task (usa la prima parola come categoria)
    const categories = new Map<string, number>();
    
    tasks.forEach(task => {
      if (!task.title) return;
      
      // Usa la prima parola come categoria approssimativa
      const firstWord = task.title.split(' ')[0].toLowerCase();
      
      // Ignora parole troppo corte
      if (firstWord.length <= 2) return;
      
      // Incrementa il conteggio per questa categoria
      categories.set(firstWord, (categories.get(firstWord) || 0) + 1);
    });
    
    // Converti la mappa in un array di oggetti per Recharts
    return Array.from(categories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Prendi solo le prime 5 categorie
  }, [tasks]);

  // Calcola la distribuzione dei completamenti per fascia oraria
  const hourlyDistribution = useMemo(() => {
    // Dividi la giornata in fasce orarie
    const timeSlots = [
      { name: 'Mattina (6-12)', start: 6, end: 11, count: 0 },
      { name: 'Pomeriggio (12-18)', start: 12, end: 17, count: 0 },
      { name: 'Sera (18-24)', start: 18, end: 23, count: 0 },
      { name: 'Notte (0-6)', start: 0, end: 5, count: 0 }
    ];
    
    // Conta i task completati in ciascuna fascia oraria
    allTasks.forEach(task => {
      if (task.type === 'oneTime' && task.isCompleted && task.time) {
        const hour = parseInt(task.time.split(':')[0], 10);
        
        if (!isNaN(hour)) {
          const slot = timeSlots.find(slot => hour >= slot.start && hour <= slot.end);
          if (slot) {
            slot.count++;
          }
        }
      } else if (task.type === 'routine' && task.completedDates && task.completedDates.length > 0) {
        // Per le routine, possiamo solo fare stime approssimative in base alle date
        // Per semplicità, assumiamo una distribuzione uniforme
        const numCompletions = task.completedDates.length;
        
        // Distribuzione uniforme tra le fasce orarie
        timeSlots.forEach(slot => {
          // Distribuzione basata sulla probabilità
          slot.count += Math.round(numCompletions * (6 / 24)); // 6 ore per fascia
        });
      }
    });
    
    return timeSlots;
  }, [allTasks]);

  // Calcola tassi di completamento per diverse categorie di task
  const completionRates = useMemo(() => {
    // Calcola il tasso di completamento per task di routine vs una tantum
    const routineTasks = allTasks.filter(task => task.type === 'routine');
    const oneTimeTasks = allTasks.filter(task => task.type === 'oneTime');
    
    const routineCompletion = routineTasks.length > 0 
      ? routineTasks.filter(task => {
          // Un task di routine è considerato "completato" se ha almeno una data completata
          return task.completedDates && task.completedDates.length > 0;
        }).length / routineTasks.length 
      : 0;
    
    const oneTimeCompletion = oneTimeTasks.length > 0 
      ? oneTimeTasks.filter(task => task.isCompleted).length / oneTimeTasks.length 
      : 0;
    
    return [
      { name: 'Routine', rate: Math.round(routineCompletion * 100) },
      { name: 'Una tantum', rate: Math.round(oneTimeCompletion * 100) }
    ];
  }, [allTasks]);

  // Controlla se ci sono task con date o ore completi
  const hasTemporalData = useMemo(() => {
    return allTasks.some(task => 
      (task.type === 'oneTime' && task.time) || 
      (task.type === 'routine' && task.completedDates && task.completedDates.length > 0)
    );
  }, [allTasks]);

  // Calcola la performance settimanale per i giorni della settimana
  const weekdayPerformance = useMemo(() => {
    const weekdays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const counts = Array(7).fill(0);
    const totals = Array(7).fill(0);
    
    allTasks.forEach(task => {
      if (task.type === 'oneTime') {
        if (task.date) {
          const date = parseISO(task.date);
          const dayIndex = getDay(date);
          totals[dayIndex]++;
          if (task.isCompleted) {
            counts[dayIndex]++;
          }
        }
      } else if (task.type === 'routine') {
        // Per le routine con completedDates
        if (task.completedDates && task.completedDates.length > 0) {
          task.completedDates.forEach(dateStr => {
            const date = parseISO(dateStr);
            const dayIndex = getDay(date);
            counts[dayIndex]++;
          });
        }
        
        // Se ha weekdays specificati, aggiungi ai totali
        if (task.weekdays && task.weekdays.length > 0) {
          task.weekdays.forEach(day => {
            const dayIndex = weekdays.findIndex(d => 
              d.toLowerCase().startsWith(day.toLowerCase())
            );
            if (dayIndex >= 0) {
              totals[dayIndex]++;
            }
          });
        }
      }
    });
    
    // Calcola le percentuali di completamento
    return weekdays.map((day, index) => ({
      name: day.substr(0, 3),
      tasso: totals[index] ? Math.round((counts[index] / totals[index]) * 100) : 0,
      completati: counts[index]
    }));
  }, [allTasks]);

  // Trova il giorno più produttivo
  const bestPerformingDay = useMemo(() => {
    if (weekdayPerformance.length === 0) return null;
    
    return weekdayPerformance.reduce((best, current) => 
      current.tasso > best.tasso ? current : best
    );
  }, [weekdayPerformance]);

  // Trova la categoria più completata
  const topCategory = useMemo(() => {
    if (taskCategories.length === 0) return null;
    return taskCategories[0];
  }, [taskCategories]);

  // Trova la fascia oraria più produttiva
  const bestTimeSlot = useMemo(() => {
    if (hourlyDistribution.length === 0) return null;
    
    return hourlyDistribution.reduce((best, current) => 
      current.count > best.count ? current : best
    );
  }, [hourlyDistribution]);

  return (
    <div className="space-y-6">
      {/* Prima riga di card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categorie più completate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary-500" />
              Categorie più completate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taskCategories.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskCategories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value} impegni`, 'Frequenza']}
                      labelFormatter={(label) => `Categoria: ${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Frequenza" 
                      fill="#0d90e5" 
                      radius={[0, 4, 4, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Dati insufficienti per l'analisi</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuzione oraria */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-500" />
              Distribuzione oraria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasTemporalData ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hourlyDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {hourlyDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? '#0d90e5' : index === 1 ? '#9776ed' : index === 2 ? '#e74694' : '#6ee7b7'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} impegni`, 'Completati']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Dati temporali insufficienti</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seconda riga di card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tassi di completamento per tipo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary-500" />
              Tassi di completamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionRates}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    domain={[0, 100]} 
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Tasso di completamento']}
                  />
                  <Bar 
                    dataKey="rate" 
                    name="Tasso" 
                    fill="#9776ed" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance per giorno della settimana */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary-500" />
              Performance settimanale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekdayPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                  />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="tasso" 
                    name="Tasso di completamento"
                    stroke="#0d90e5" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#0d90e5", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="completati" 
                    name="Impegni completati"
                    stroke="#e74694" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#e74694", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Riassunto e insights */}
      <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
        <h3 className="font-medium mb-2">Riassunto comportamento</h3>
        <ul className="space-y-2 text-sm">
          {bestPerformingDay && (
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-1.5 mr-2"></span>
              {bestPerformingDay.tasso > 0 ? (
                <span>Il tuo giorno più produttivo è <b>{bestPerformingDay.name}</b> con un tasso di completamento del <b>{bestPerformingDay.tasso}%</b>.</span>
              ) : (
                <span>Non ci sono ancora dati sufficienti sulla produttività giornaliera.</span>
              )}
            </li>
          )}
          
          {topCategory && (
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-1.5 mr-2"></span>
              <span>Completi più frequentemente impegni legati a <b>{topCategory.name}</b> ({topCategory.count} volte).</span>
            </li>
          )}
          
          {bestTimeSlot && bestTimeSlot.count > 0 && (
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-1.5 mr-2"></span>
              <span>Sei più produttivo nella fascia <b>{bestTimeSlot.name}</b> con <b>{bestTimeSlot.count}</b> impegni completati.</span>
            </li>
          )}
          
          {completionRates.length > 0 && (
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mt-1.5 mr-2"></span>
              <span>
                Completi il <b>{completionRates[0].rate}%</b> delle attività di routine e il <b>{completionRates[1].rate}%</b> delle attività una tantum.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default TrendAnalysis;