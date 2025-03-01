// components/tasks/TaskForm.tsx - Componente unificato con supporto migliorato per ricorrenza
import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, ArrowLeft } from 'lucide-react';
import { Button } from "../ui/button";
import { TaskType, RecurrenceType, NotificationTimeUnit, TimeUnit } from '../../types';
import { addWeeks, addMonths, addYears, format, getDate } from 'date-fns';
import NotificationService from '../../services/NotificationService';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../common/AnimatedComponents';
import { useLayoutContext } from '../../context/LayoutContext';

const WEEKDAYS = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mer' },
  { id: 'thu', label: 'Gio' },
  { id: 'fri', label: 'Ven' },
  { id: 'sat', label: 'Sab' },
  { id: 'sun', label: 'Dom' }
];

// Generare un array di numeri da 1 a 31 per selezione del giorno del mese
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => ({ 
  id: (i + 1).toString(), 
  label: (i + 1).toString() 
}));

const DURATION_TYPES = [
  { id: 'custom', label: 'Personalizzata' },
  { id: 'oneWeek', label: '1 Settimana' },
  { id: 'twoWeek', label: '2 Settimane' },
  { id: 'threeWeek', label: '3 Settimane' },
  { id: 'oneMonth', label: '1 Mese' },
  { id: 'twoMonth', label: '2 Mesi' },
  { id: 'threeMonths', label: '3 Mesi' },
  { id: 'sixMonths', label: '6 Mesi' },
  { id: 'oneYear', label: '1 Anno' }
];

const RECURRENCE_TYPES = [
  { value: 'weekly', label: 'Ogni settimana' },
  { value: 'biweekly', label: 'Ogni 2 settimane' },
  { value: 'monthly', label: 'Ogni mese' },
  { value: 'custom', label: 'Personalizzata' }
];

const RECURRENCE_UNITS = [
  { value: 'days', label: 'giorni' },
  { value: 'weeks', label: 'settimane' },
  { value: 'months', label: 'mesi' }
];

// Opzioni per l'anticipo della notifica
const NOTIFICATION_TIME_OPTIONS = [
  { value: 5, label: '5 minuti prima' },
  { value: 10, label: '10 minuti prima' },
  { value: 15, label: '15 minuti prima' },
  { value: 30, label: '30 minuti prima' },
  { value: 60, label: '1 ora prima' },
  { value: 120, label: '2 ore prima' },
  { value: 1440, label: '1 giorno prima' },
  { value: -1, label: 'Personalizzato' }
];

// Unità di tempo per le notifiche personalizzate
const NOTIFICATION_TIME_UNITS = [
  { value: 'minutes', label: 'minuti' },
  { value: 'hours', label: 'ore' }
];

interface TaskFormProps {
  // Props comuni
  onSubmit: (task: {
    title: string;
    description?: string;
    type: TaskType;
    time?: string;
    date?: string;
    weekdays?: string[];
    monthDay?: number;
    startDate?: string;
    endDate?: string;
    notifyBefore?: boolean;
    notifyInAdvance?: number;
    notifyTimeUnit?: NotificationTimeUnit;
    recurrenceType?: RecurrenceType;
    recurrenceInterval?: number;
    recurrenceUnit?: TimeUnit;
  }) => void;
  
  // Props per modalità dialog
  isDialog?: boolean;
  onClose?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ 
  onSubmit, 
  isDialog = false, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { setShowFooter } = useLayoutContext();
  
  // Nascondiamo il footer quando la pagina si monta (solo in modalità pagina)
  useEffect(() => {
    if (!isDialog) {
      setShowFooter(false);
      // Lo mostriamo di nuovo quando la pagina viene smontata
      return () => setShowFooter(true);
    }
  }, [isDialog, setShowFooter]);
  
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    type: 'routine' as TaskType,
    time: '',
    date: '',
    weekdays: [] as string[],
    monthDay: getDate(new Date()), // Giorno corrente del mese
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    durationType: 'custom',
    notifyBefore: false,
    notifyOption: 10, // Default: 10 minuti prima
    notifyInAdvance: 10, // Valore effettivo in minuti o ore
    notifyTimeUnit: 'minutes' as NotificationTimeUnit,
    customNotifyTime: '', // Per input personalizzato
    recurrenceType: 'weekly' as RecurrenceType,
    recurrenceInterval: 1,
    recurrenceUnit: 'weeks' as TimeUnit,
    // Usato per tenere traccia delle interazioni con il form
    interactionState: {
      hasChangedRecurrenceUnit: false
    }
  });
  
  const [notificationsAvailable, setNotificationsAvailable] = useState(false);
  const [showCustomNotifyTime, setShowCustomNotifyTime] = useState(false);
  
  // Quando si seleziona una data d'inizio, imposta anche il giorno del mese
  useEffect(() => {
    if (taskData.startDate) {
      const startDateObj = new Date(taskData.startDate);
      const dayOfMonth = getDate(startDateObj);
      setTaskData(prev => ({
        ...prev,
        monthDay: dayOfMonth
      }));
    }
  }, [taskData.startDate]);
  
  useEffect(() => {
    const checkNotificationPermission = async () => {
      const notificationService = NotificationService.getInstance();
      const isEnabled = await notificationService.requestPermission();
      setNotificationsAvailable(isEnabled);
    };
    
    checkNotificationPermission();
  }, []);

  const toggleWeekday = (dayId: string) => {
    setTaskData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(dayId)
        ? prev.weekdays.filter(d => d !== dayId)
        : [...prev.weekdays, dayId]
    }));
  };

  const handleMonthDayChange = (day: number) => {
    setTaskData(prev => ({
      ...prev,
      monthDay: day
    }));
  };

  const handleDurationTypeChange = (durationType: string) => {
    const startDate = new Date(taskData.startDate);
    let endDate = startDate;

    switch (durationType) {
      case 'oneWeek':
        endDate = addWeeks(startDate, 1);
        break;
      case 'twoWeek':
        endDate = addWeeks(startDate, 2);
        break;
      case 'threeWeek':
        endDate = addWeeks(startDate, 3);
        break;
      case 'oneMonth':
        endDate = addMonths(startDate, 1);
        break;
      case 'twoMonth':
        endDate = addMonths(startDate, 2);
        break;
      case 'threeMonths':
        endDate = addMonths(startDate, 3);
        break;
      case 'sixMonths':
        endDate = addMonths(startDate, 6);
        break;
      case 'oneYear':
        endDate = addYears(startDate, 1);
        break;
    }

    setTaskData(prev => ({
      ...prev,
      durationType,
      endDate: durationType === 'custom' ? prev.endDate : format(endDate, 'yyyy-MM-dd')
    }));
  };

  const toggleNotification = () => {
    setTaskData(prev => ({
      ...prev,
      notifyBefore: !prev.notifyBefore
    }));
  };

  const handleNotificationOptionChange = (option: number) => {
    if (option === -1) {
      // L'utente ha selezionato l'opzione personalizzata
      setShowCustomNotifyTime(true);
      setTaskData(prev => ({
        ...prev,
        notifyOption: option
      }));
      return;
    }
    
    setShowCustomNotifyTime(false);
    
    // Gestisci le opzioni predefinite
    let timeValue = option;
    let timeUnit: NotificationTimeUnit = 'minutes';
    
    // Converti ore in minuti per l'interfaccia utente
    if (option >= 60) {
      if (option % 60 === 0) {
        timeValue = option / 60;
        timeUnit = 'hours';
      }
    }
    
    setTaskData(prev => ({
      ...prev,
      notifyOption: option,
      notifyInAdvance: timeValue,
      notifyTimeUnit: timeUnit
    }));
  };

  const handleCustomNotifyTimeChange = (value: string) => {
    setTaskData(prev => ({
      ...prev,
      customNotifyTime: value,
      notifyInAdvance: parseInt(value) || prev.notifyInAdvance
    }));
  };
  
  const handleNotifyTimeUnitChange = (unit: NotificationTimeUnit) => {
    setTaskData(prev => ({
      ...prev,
      notifyTimeUnit: unit
    }));
  };

  const handleRecurrenceTypeChange = (recurrenceType: RecurrenceType) => {
    setTaskData(prev => {
      // Imposta intervalli di default per i tipi di ricorrenza preimpostati
      let recurrenceInterval = prev.recurrenceInterval;
      let recurrenceUnit: TimeUnit = prev.recurrenceUnit;
      let weekdays = prev.weekdays;
      
      if (recurrenceType === 'weekly') {
        recurrenceInterval = 1;
        recurrenceUnit = 'weeks';
      } else if (recurrenceType === 'biweekly') {
        recurrenceInterval = 2;
        recurrenceUnit = 'weeks';
      } else if (recurrenceType === 'monthly') {
        recurrenceInterval = 1;
        recurrenceUnit = 'months';
        // Resetta i weekdays se si passa a ricorrenza mensile
        weekdays = [];
      } else if (recurrenceType === 'custom') {
        // Mantieni l'unità attuale se si sta cambiando da un altro tipo
        // o se l'utente ha già interagito con la selezione dell'unità
        if (prev.recurrenceType !== 'custom') {
          recurrenceInterval = 1;
          
          // Se l'utente non ha mai cambiato manualmente l'unità di misura, imposta un default
          if (!prev.interactionState.hasChangedRecurrenceUnit) {
            if (prev.recurrenceType === 'weekly' || prev.recurrenceType === 'biweekly') {
              recurrenceUnit = 'weeks';
            } else if (prev.recurrenceType === 'monthly') {
              recurrenceUnit = 'months';
            } else {
              recurrenceUnit = 'days';
            }
          }
        }
      }
      
      return {
        ...prev,
        recurrenceType,
        recurrenceInterval,
        recurrenceUnit,
        weekdays
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepara l'oggetto task da inviare
    const task: any = {
      title: taskData.title,
      type: taskData.type,
      time: taskData.time,
      date: taskData.type === 'oneTime' ? taskData.date : undefined,
      startDate: taskData.type === 'routine' ? taskData.startDate : undefined,
      endDate: taskData.type === 'routine' ? taskData.endDate : undefined,
      notifyBefore: taskData.notifyBefore,
      notifyInAdvance: taskData.notifyBefore ? taskData.notifyInAdvance : undefined,
      notifyTimeUnit: taskData.notifyBefore ? taskData.notifyTimeUnit : undefined,
      recurrenceType: taskData.type === 'routine' ? taskData.recurrenceType : undefined,
      // Aggiungi l'intervallo per tutti i tipi di ricorrenza
      recurrenceInterval: taskData.type === 'routine' ? taskData.recurrenceInterval : undefined,
      recurrenceUnit: taskData.type === 'routine' ? taskData.recurrenceUnit : undefined
    };
    
    // Aggiungi weekdays per ricorrenze settimanali, bisettimanali o personalizzate con settimane
    if (taskData.type === 'routine' && 
        (taskData.recurrenceType === 'weekly' || 
         taskData.recurrenceType === 'biweekly' || 
         (taskData.recurrenceType === 'custom' && taskData.recurrenceUnit === 'weeks'))) {
      task.weekdays = taskData.weekdays;
    }
    
    // Aggiungi monthDay per ricorrenze mensili o personalizzate con mesi
    if (taskData.type === 'routine' && 
        (taskData.recurrenceType === 'monthly' || 
         (taskData.recurrenceType === 'custom' && taskData.recurrenceUnit === 'months'))) {
      task.monthDay = taskData.monthDay;
    }
    
    // Aggiungi descrizione solo se non è vuota
    if (taskData.description.trim()) {
      task.description = taskData.description;
    }
    
    onSubmit(task);
    
    // In modalità pagina, torniamo indietro dopo il submit
    if (!isDialog && !onClose) {
      navigate(-1);
    }
  };
  
  const handleCancel = () => {
    if (isDialog && onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // Determina se ci sono giorni della settimana selezionati
  const hasSelectedWeekdays = taskData.weekdays.length > 0;

  // Determina se mostrare la sezione cadenza
  const showRecurrenceSection = taskData.type === 'routine';
  
  // Determina se è richiesta la selezione di giorni della settimana
  const needsWeekdaySelection = taskData.type === 'routine' && 
    (taskData.recurrenceType === 'weekly' || 
     taskData.recurrenceType === 'biweekly' || 
     (taskData.recurrenceType === 'custom' && taskData.recurrenceUnit === 'weeks'));
  
  // Determina se è richiesta la selezione del giorno del mese
  const needsMonthDaySelection = taskData.type === 'routine' && 
    (taskData.recurrenceType === 'monthly' || 
     (taskData.recurrenceType === 'custom' && taskData.recurrenceUnit === 'months'));

  // Formatta l'etichetta per il tempo di notifica
  const formatNotificationTimeLabel = () => {
    if (!taskData.notifyBefore) return "";
    
    if (taskData.notifyOption === -1) {
      return "Personalizzato";
    }
    
    const option = NOTIFICATION_TIME_OPTIONS.find(opt => opt.value === taskData.notifyOption);
    return option ? option.label : "";
  };

  // Determina se il pulsante di salvataggio deve essere disabilitato
  const isSaveDisabled = () => {
    if (taskData.type !== 'routine') return false;
    
    if (!taskData.startDate) return true;
    if (taskData.durationType === 'custom' && !taskData.endDate) return true;
    
    // Per ricorrenze che richiedono giorni della settimana, verifica che almeno uno sia selezionato
    if (needsWeekdaySelection && taskData.weekdays.length === 0) return true;
    
    // Per ricorrenze personalizzate, controlla che l'intervallo sia maggiore di 0
    if (taskData.recurrenceType === 'custom' && 
        (!taskData.recurrenceInterval || taskData.recurrenceInterval <= 0)) {
      return true;
    }
    
    return false;
  };

  // Renderizzazione in modalità dialog
  if (isDialog) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-xl font-bold text-gray-900">Nuovo Impegno</h2>
            <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="overflow-y-auto flex-1 p-6">
            <form id="taskDialogForm" onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="form-label">
                  Titolo
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={taskData.title}
                  onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Descrizione (opzionale)
                </label>
                <textarea
                  className="form-textarea"
                  value={taskData.description}
                  onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  Tipo
                </label>
                <select
                  className="form-select"
                  value={taskData.type}
                  onChange={(e) => setTaskData({
                    ...taskData, 
                    type: e.target.value as TaskType,
                    weekdays: []
                  })}
                >
                  <option value="routine">Routine</option>
                  <option value="oneTime">Una tantum</option>
                </select>
              </div>

              {taskData.type === 'routine' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      Orario
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      value={taskData.time}
                      onChange={(e) => setTaskData({...taskData, time: e.target.value})}
                    />
                  </div>
                  
                  {/* Sezione Cadenza */}
                  <div className="form-group">
                    <label className="form-label">
                      Cadenza
                    </label>
                    <select
                      className="form-select mb-3"
                      value={taskData.recurrenceType}
                      onChange={(e) => handleRecurrenceTypeChange(e.target.value as RecurrenceType)}
                    >
                      {RECURRENCE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    
                    {taskData.recurrenceType === 'custom' && (
                      <div className="flex items-center space-x-3 mb-2 mt-4">
                        <label className="whitespace-nowrap text-sm text-gray-700">
                          Ogni
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          className="w-20 py-3 px-4 rounded-lg border-gray-300 shadow-sm"
                          value={taskData.recurrenceInterval}
                          onChange={(e) => setTaskData({
                            ...taskData, 
                            recurrenceInterval: parseInt(e.target.value) || 1
                          })}
                        />
                        <select
                          className="form-select ml-2"
                          value={taskData.recurrenceUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value as TimeUnit;
                            // Aggiorna l'unità e resetta i giorni della settimana se necessario
                            setTaskData(prev => ({
                              ...prev,
                              recurrenceUnit: newUnit,
                              // Resetta i weekdays se si sta passando da settimane a un'altra unità
                              weekdays: newUnit !== 'weeks' && prev.recurrenceUnit === 'weeks' ? [] : prev.weekdays,
                              interactionState: {
                                ...prev.interactionState,
                                hasChangedRecurrenceUnit: true
                              }
                            }));
                          }}
                        >
                          {RECURRENCE_UNITS.map(unit => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {/* Giorni della settimana (solo per ricorrenze settimanali o bisettimanali) */}
                  {needsWeekdaySelection && (
                    <div className="form-group">
                      <label className="form-label">
                        Giorni della settimana
                      </label>
                      <div className="options-group">
                        {WEEKDAYS.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            className={`option-button px-4 py-3 ${
                              taskData.weekdays.includes(day.id)
                                ? 'bg-primary-100 border-primary-500 text-primary-700'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => toggleWeekday(day.id)}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Giorno del mese (solo per ricorrenze mensili) */}
                  {needsMonthDaySelection && (
                    <div className="form-group">
                      <label className="form-label">
                        Giorno del mese
                      </label>
                      <select
                        className="form-select"
                        value={taskData.monthDay}
                        onChange={(e) => handleMonthDayChange(parseInt(e.target.value))}
                      >
                        {MONTH_DAYS.map(day => (
                          <option key={day.id} value={day.id}>
                            {day.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label className="form-label">
                      Data Inizio
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={taskData.startDate}
                      onChange={(e) => setTaskData({...taskData, startDate: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Durata
                    </label>
                    <select
                      className="form-select mb-3"
                      value={taskData.durationType}
                      onChange={(e) => handleDurationTypeChange(e.target.value)}
                    >
                      {DURATION_TYPES.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    
                    {taskData.durationType === 'custom' && (
                      <input
                        type="date"
                        className="form-input mt-3"
                        value={taskData.endDate}
                        min={taskData.startDate}
                        onChange={(e) => setTaskData({...taskData, endDate: e.target.value})}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      Data
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={taskData.date}
                      onChange={(e) => setTaskData({...taskData, date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Orario
                    </label>
                    <input
                      type="time"
                      className="form-input"
                      value={taskData.time}
                      onChange={(e) => setTaskData({...taskData, time: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              {/* Opzione per le notifiche */}
              {notificationsAvailable && (
                <div className="space-y-4">
                  <div className="notification-option">
                    <div>
                      <p className="font-medium text-gray-800">Notifica</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {taskData.notifyBefore 
                          ? formatNotificationTimeLabel() 
                          : "Notifiche disattivate"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={taskData.notifyBefore ? "default" : "outline"}
                      className="rounded-full h-12 w-12 p-0 flex items-center justify-center"
                      onClick={toggleNotification}
                    >
                      {taskData.notifyBefore ? (
                        <Bell className="h-6 w-6" />
                      ) : (
                        <BellOff className="h-6 w-6" />
                      )}
                    </Button>
                  </div>
                  
                  {taskData.notifyBefore && (
                    <div className="form-section">
                      <label className="form-label">
                        Notifica in anticipo
                      </label>
                      <select
                        className="form-select mb-3"
                        value={taskData.notifyOption}
                        onChange={(e) => handleNotificationOptionChange(parseInt(e.target.value))}
                      >
                        {NOTIFICATION_TIME_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      {showCustomNotifyTime && (
                        <div className="flex items-center space-x-3 mt-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="Tempo"
                            className="w-24 py-3 px-4 rounded-lg border-gray-300 shadow-sm"
                            value={taskData.customNotifyTime}
                            onChange={(e) => handleCustomNotifyTimeChange(e.target.value)}
                          />
                          <select
                            className="form-select"
                            value={taskData.notifyTimeUnit}
                            onChange={(e) => handleNotifyTimeUnitChange(e.target.value as NotificationTimeUnit)}
                          >
                            {NOTIFICATION_TIME_UNITS.map(unit => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-gray-500">prima</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Messaggio di notifica disabilitata */}
              {!notificationsAvailable && taskData.time && (
                <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-lg">
                  Per ricevere notifiche per questo impegno, abilita i permessi per le notifiche nel tuo browser.
                </div>
              )}
            </form>
          </div>

          <div className="border-t p-5 bg-gray-50 rounded-b-xl">
            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleCancel}
                className="px-6 py-3 text-base"
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                form="taskDialogForm"
                className="px-6 py-3 text-base"
                disabled={isSaveDisabled()}
              >
                Salva
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizzazione in modalità pagina
  return (
    <PageTransition>
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-4 border-b bg-white z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel} 
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold text-gray-900">Nuovo Impegno</h2>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="overflow-y-auto flex-1 pb-20">
          <div className="container max-w-md mx-auto p-4">
            <form id="taskPageForm" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={taskData.title}
                  onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </label>
                <textarea
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={taskData.description}
                  onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={taskData.type}
                  onChange={(e) => setTaskData({
                    ...taskData, 
                    type: e.target.value as TaskType,
                    weekdays: []
                  })}
                >
                  <option value="routine">Routine</option>
                  <option value="oneTime">Una tantum</option>
                </select>
              </div>

              {taskData.type === 'routine' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orario
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={taskData.time}
                      onChange={(e) => setTaskData({...taskData, time: e.target.value})}
                    />
                  </div>
                  
                  {/* Sezione Cadenza */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cadenza
                    </label>
                    <select
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 mb-2"
                      value={taskData.recurrenceType}
                      onChange={(e) => handleRecurrenceTypeChange(e.target.value as RecurrenceType)}
                    >
                      {RECURRENCE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    
                    {taskData.recurrenceType === 'custom' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <label className="whitespace-nowrap text-sm text-gray-700">
                          Ogni
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-16 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={taskData.recurrenceInterval}
                          onChange={(e) => setTaskData({
                            ...taskData, 
                            recurrenceInterval: parseInt(e.target.value) || 0
                          })}
                        />
                        <select
                          className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={taskData.recurrenceUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value as TimeUnit;
                            // Aggiorna l'unità e resetta i giorni della settimana se necessario
                            setTaskData(prev => ({
                              ...prev,
                              recurrenceUnit: newUnit,
                              // Resetta i weekdays se si sta passando da settimane a un'altra unità
                              weekdays: newUnit !== 'weeks' && prev.recurrenceUnit === 'weeks' ? [] : prev.weekdays,
                              interactionState: {
                                ...prev.interactionState,
                                hasChangedRecurrenceUnit: true
                              }
                            }));
                          }}
                        >
                          {RECURRENCE_UNITS.map(unit => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {/* Giorni della settimana (solo per ricorrenze settimanali o bisettimanali) */}
                  {needsWeekdaySelection && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giorni della settimana
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              taskData.weekdays.includes(day.id)
                                ? 'bg-primary-100 border border-primary-500 text-primary-700'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => toggleWeekday(day.id)}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Giorno del mese (solo per ricorrenze mensili) */}
                  {needsMonthDaySelection && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giorno del mese
                      </label>
                      <select
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        value={taskData.monthDay}
                        onChange={(e) => handleMonthDayChange(parseInt(e.target.value))}
                      >
                        {MONTH_DAYS.map(day => (
                          <option key={day.id} value={day.id}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Inizio
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={taskData.startDate}
                      onChange={(e) => setTaskData({...taskData, startDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durata
                    </label>
                    <select
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 mb-2"
                      value={taskData.durationType}
                      onChange={(e) => handleDurationTypeChange(e.target.value)}
                    >
                      {DURATION_TYPES.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    
                    {taskData.durationType === 'custom' && (
                      <input
                        type="date"
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        value={taskData.endDate}
                        min={taskData.startDate}
                        onChange={(e) => setTaskData({...taskData, endDate: e.target.value})}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={taskData.date}
                      onChange={(e) => setTaskData({...taskData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orario
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={taskData.time}
                      onChange={(e) => setTaskData({...taskData, time: e.target.value})}
                    />
                  </div>
                </>
              )}
              
              {/* Opzione per le notifiche */}
              {notificationsAvailable && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Notifica</p>
                      <p className="text-sm text-gray-500">
                        {taskData.notifyBefore 
                          ? formatNotificationTimeLabel() 
                          : "Notifiche disattivate"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={taskData.notifyBefore ? "default" : "outline"}
                      className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
                      onClick={toggleNotification}
                    >
                      {taskData.notifyBefore ? (
                        <Bell className="h-5 w-5" />
                      ) : (
                        <BellOff className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  
                  {taskData.notifyBefore && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notifica in anticipo
                      </label>
                      <select
                        className="w-full mb-2 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        value={taskData.notifyOption}
                        onChange={(e) => handleNotificationOptionChange(parseInt(e.target.value))}
                      >
                        {NOTIFICATION_TIME_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      {showCustomNotifyTime && (
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Tempo"
                            className="w-20 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            value={taskData.customNotifyTime}
                            onChange={(e) => handleCustomNotifyTimeChange(e.target.value)}
                          />
                          <select
                            className="rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            value={taskData.notifyTimeUnit}
                            onChange={(e) => handleNotifyTimeUnitChange(e.target.value as NotificationTimeUnit)}
                          >
                            {NOTIFICATION_TIME_UNITS.map(unit => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-gray-500">prima</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Messaggio di notifica disabilitata */}
              {!notificationsAvailable && taskData.time && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  Per ricevere notifiche per questo impegno, abilita i permessi per le notifiche nel tuo browser.
                </div>
              )}
            </form>
          </div>
        </div>
        
        {/* Footer - Sticky */}
        <div className="sticky bottom-0 left-0 right-0 border-t p-4 bg-white">
          <div className="container max-w-md mx-auto flex justify-between space-x-3">
            <Button 
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 h-12 text-base"
            >
              Annulla
            </Button>
            <Button 
              type="submit"
              form="taskPageForm"
              className="px-6 py-2 h-12 text-base"
              disabled={isSaveDisabled()}
            >
              Salva
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default TaskForm;