// firebase-messaging-sw.js - Service Worker per Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configurazione Firebase (uguale a quella in config.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBCTPw3DHKBJmla0oQTHlEdfkjKM7Ao4mw",
  authDomain: "routine-69a4b.firebaseapp.com",
  projectId: "routine-69a4b",
  storageBucket: "routine-69a4b.firebasestorage.app",
  messagingSenderId: "783081813350",
  appId: "1:783081813350:web:1cfc46a7128ba27f9684a7",
  measurementId: "G-2QD5W55YR3"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Ottieni un'istanza di Firebase Messaging
const messaging = firebase.messaging();

// Gestione dei messaggi in background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Ricevuto messaggio in background:', payload);
  
  // Personalizza la notifica mostrata all'utente
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'default',
    data: payload.data
  };

  // Mostra la notifica
  return self.registration.showNotification(payload.notification.title, notificationOptions);
});

// Gestione del click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Click su notifica:', event);
  
  // Chiudi la notifica
  event.notification.close();
  
  // Recupera i dati dalla notifica
  const notificationData = event.notification.data;
  
  // URL di destinazione basato sul tipo di notifica
  let url = '/';
  
  if (notificationData) {
    // Reindirizza in base al tipo di notifica
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
    
    // Se c'è un ID specifico, aggiungi un parametro all'URL
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
            // Naviga alla pagina corretta e focalizza
            return client.navigate(url).then(() => client.focus());
          }
        }
        
        // Se non c'è una finestra aperta, aprine una nuova
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});