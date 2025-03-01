// src/components/statistics/WeeklyHeatMap.tsx
import React, { useMemo } from 'react';
import { format, parseISO, getDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { Task } from '../../types';

interface WeeklyHeatMapProps {
  tasks: Task[];
}

const WeeklyHeatMap: React.FC<WeeklyHeatMapProps> = ({ tasks }) => {
  // Genera dati per la heatmap che mostra quando vengono completati più task
  const heatmapData = useMemo(() => {
    // Crea un oggetto per contare i task completati per ciascun giorno della settimana
    const weekdayCounts = Array(7).fill(0);
    const hourCounts = Array(24).fill(0);
    
    // Conta il numero di task completati per ogni giorno della settimana
    tasks.forEach(task => {
      if (task.type === 'oneTime' && task.isCompleted && task.date) {
        const date = parseISO(task.date);
        const dayIndex = getDay(date);
        weekdayCounts[dayIndex]++;
        
        // Se il task ha un orario, conteggia anche quello
        if (task.time) {
          const hour = parseInt(task.time.split(':')[0], 10);
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hourCounts[hour]++;
          }
        }
      } else if (task.type === 'routine' && task.completedDates && task.completedDates.length > 0) {
        task.completedDates.forEach(dateStr => {
          const date = parseISO(dateStr);
          const dayIndex = getDay(date);
          weekdayCounts[dayIndex]++;
        });
      }
    });
    
    // Trova il valore massimo per la normalizzazione
    const maxCount = Math.max(...weekdayCounts);
    
    // Crea array con i nomi dei giorni in italiano
    const weekdays = [
      'Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 
      'Giovedì', 'Venerdì', 'Sabato'
    ];
    
    // Struttura dati per la heatmap
    return {
      weekdayCounts,
      weekdays,
      maxCount,
      hourCounts
    };
  }, [tasks]);

  // Funzione per determinare l'intensità del colore basata sul conteggio
  const getColorIntensity = (count: number, max: number) => {
    if (max === 0) return 'bg-gray-100';
    const intensity = Math.min(Math.round((count / max) * 5), 5);
    
    switch (intensity) {
      case 0: return 'bg-blue-50';
      case 1: return 'bg-blue-100';
      case 2: return 'bg-blue-200';
      case 3: return 'bg-blue-300';
      case 4: return 'bg-blue-400';
      case 5: return 'bg-blue-500';
      default: return 'bg-blue-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Distribuzione giornaliera */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-gray-500">Attività completate per giorno</h4>
        <div className="grid grid-cols-7 gap-2">
          {heatmapData.weekdays.map((day, idx) => (
            <div key={day} className="text-center">
              <div className={`h-16 rounded-md ${getColorIntensity(heatmapData.weekdayCounts[idx], heatmapData.maxCount)} flex items-center justify-center`}>
                <span className="font-bold text-lg text-gray-700">{heatmapData.weekdayCounts[idx]}</span>
              </div>
              <div className="mt-1 text-xs font-medium">{day.substring(0, 3)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend delle ore */}
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2 text-gray-500">Distribuzione per ora del giorno</h4>
        <div className="h-32 flex items-end gap-1">
          {heatmapData.hourCounts.map((count, hour) => {
            const maxHourCount = Math.max(...heatmapData.hourCounts);
            const height = maxHourCount > 0 ? Math.max((count / maxHourCount) * 100, 5) : 5;
            
            return (
              <div key={hour} className="relative flex-1 flex flex-col items-center">
                <div 
                  className={`w-full ${count > 0 ? 'bg-primary-400' : 'bg-gray-200'} rounded-t-sm`} 
                  style={{ height: `${height}%` }}
                >
                </div>
                {hour % 3 === 0 && (
                  <div className="absolute -bottom-6 text-xs font-medium text-gray-500">
                    {hour}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-6"></div>
      </div>
      
      {/* Legenda e spiegazione */}
      <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
        <p>
          I grafici mostrano quando completi più impegni durante la settimana e in quali ore del giorno.
          I colori più intensi indicano i momenti in cui sei più produttivo.
        </p>
      </div>
    </div>
  );
};

export default WeeklyHeatMap;