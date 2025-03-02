// service-worker.js - Service Worker per gestire le notifiche push in background
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installazione completata');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Attivazione completata');
  return self.clients.claim();
});

// Gestione delle notifiche push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notifica push ricevuta', event);

  if (!event.data) {
    console.log('[Service Worker] Nessun dato nella notifica push');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Dati notifica push:', data);

    // Estrai le informazioni dalla notifica
    const { title, body, tag, icon, data: notificationData, actions } = data;

    // Crea le opzioni della notifica
    const options = {
      body: body || 'Notifica da MyRoutine',
      icon: icon || '/logo192.png',
      badge: '/favicon.ico',
      tag: tag || 'default',
      data: notificationData || {},
      vibrate: [100, 50, 100],
      actions: actions || [],
      requireInteraction: true // La notifica rimane visibile finché l'utente non interagisce
    };

    // Mostra la notifica
    event.waitUntil(
      self.registration.showNotification(title || 'MyRoutine', options)
    );
  } catch (error) {
    console.error('[Service Worker] Errore durante l\'elaborazione della notifica push:', error);
  }
});

// Gestione del click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Click su notifica:', event);
  
  // Chiudi la notifica
  event.notification.close();
  
  // Recupera dati e azione dalla notifica
  const notificationData = event.notification.data || {};
  const actionId = event.action;
  
  // URL di base per l'apertura dell'app
  let url = '/';
  let taskAction = null;
  
  // Gestisci azioni personalizzate
  if (actionId) {
    switch (actionId) {
      case 'complete-task':
        // L'utente ha completato il task direttamente dalla notifica
        taskAction = {
          action: 'complete-task',
          taskId: notificationData.taskId
        };
        url = '/';
        break;
      case 'snooze':
        // L'utente vuole posticipare il promemoria
        taskAction = {
          action: 'snooze-task',
          taskId: notificationData.taskId,
          minutes: 15 // Posticipa di 15 minuti di default
        };
        url = '/';
        break;
      case 'feedback-good':
      case 'feedback-neutral':
      case 'feedback-bad':
        // L'utente ha fornito un feedback rapido
        taskAction = {
          action: 'feedback',
          taskId: notificationData.taskId,
          feedback: actionId.replace('feedback-', '')
        };
        url = '/';
        break;
      default:
        // Per altre azioni, naviga alla pagina appropriata
        if (notificationData.type === 'task') {
          url = '/';
        } else if (notificationData.type === 'counter') {
          url = '/stats';
        } else {
          url = '/';
        }
    }
  } else if (notificationData.type) {
    // Se non è stata selezionata un'azione ma è specificato un tipo
    switch (notificationData.type) {
      case 'task':
        url = '/';
        break;
      case 'counter':
        url = '/stats';
        break;
      case 'system':
        url = '/settings';
        break;
      default:
        url = '/';
    }
    
    // Se c'è un ID correlato, aggiungi un parametro all'URL
    if (notificationData.relatedId) {
      url += `?id=${notificationData.relatedId}`;
    }
  }
  
  // Apri o focalizza la finestra dell'app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Verifica se c'è già una finestra aperta
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Se c'è un'azione da eseguire, invia un messaggio alla finestra
            if (taskAction) {
              client.postMessage(taskAction);
            }
            
            // Naviga alla pagina corretta e focalizza
            return client.navigate(url).then(() => client.focus());
          }
        }
        
        // Se non c'è una finestra aperta, aprine una nuova
        return clients.openWindow(url).then(client => {
          // Aspetta che la finestra sia caricata e poi invia il messaggio
          if (client && taskAction) {
            // Nota: al momento non è possibile inviare un messaggio direttamente
            // alla finestra appena aperta, quindi dobbiamo usare sessionStorage
            self.localStorage.setItem('pendingAction', JSON.stringify(taskAction));
          }
        });
      })
  );
});

// Gestione delle azioni nella notifica
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notifica chiusa', event);
});

// Gestione dei messaggi dal client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Messaggio ricevuto:', event.data);
  
  // Gestisci messaggi dal client
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    // Programma una notifica locale per più tardi
    const { title, options, delay } = event.data;
    
    setTimeout(() => {
      self.registration.showNotification(title, options);
    }, delay);
  }
});