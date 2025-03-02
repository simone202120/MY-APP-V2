// push-server.js
// Server di notifiche push per MyRoutine

const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configurazione VAPID
// NOTA: Queste chiavi sono di esempio, devi generarne di nuove con:
// npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'BIHCRlRl15hmZ6jqHNK7ouCakdGe65ZV7b7c8P8RtbWxNlY25YZJjyriLMQn3lYt_JeM0d2o1OfmSiKVlTSrK9Q';
const VAPID_PRIVATE_KEY = 'ZCOQd0jjJ7L25IBKLZpeNT6oJVke3vPh7w_4rp8Xjns';

webpush.setVapidDetails(
  'simone94fortunato@gmail.com', // Cambia con la tua email
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Percorso dove salvare le sottoscrizioni
const SUBSCRIPTIONS_FILE = path.join(__dirname, 'subscriptions.json');

// Carica le sottoscrizioni esistenti o crea un oggetto vuoto
let subscriptions = {};
try {
  if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
    const data = fs.readFileSync(SUBSCRIPTIONS_FILE);
    subscriptions = JSON.parse(data);
    console.log(`Caricate ${Object.keys(subscriptions).length} sottoscrizioni esistenti`);
  }
} catch (error) {
  console.error('Errore durante il caricamento delle sottoscrizioni:', error);
}

// Salva le sottoscrizioni nel file
const saveSubscriptions = () => {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
  } catch (error) {
    console.error('Errore durante il salvataggio delle sottoscrizioni:', error);
  }
};

// Endpoint per ricevere/aggiornare le sottoscrizioni
app.post('/api/subscriptions', (req, res) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'UserId e subscription sono richiesti' });
  }
  
  // Salva la sottoscrizione
  subscriptions[userId] = subscription;
  saveSubscriptions();
  
  console.log(`Salvata sottoscrizione per l'utente ${userId}`);
  res.status(201).json({ success: true });
});

// Endpoint per cancellare sottoscrizioni
app.delete('/api/subscriptions', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'UserId è richiesto' });
  }
  
  // Rimuovi la sottoscrizione
  if (subscriptions[userId]) {
    delete subscriptions[userId];
    saveSubscriptions();
    console.log(`Eliminata sottoscrizione per l'utente ${userId}`);
  }
  
  res.status(200).json({ success: true });
});

// Endpoint per inviare notifiche
app.post('/api/send-notification', async (req, res) => {
  const { userId, title, body, data, actions } = req.body;
  
  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'UserId, title e body sono richiesti' });
  }
  
  const subscription = subscriptions[userId];
  
  if (!subscription) {
    return res.status(404).json({ error: 'Sottoscrizione non trovata per questo utente' });
  }
  
  const payload = JSON.stringify({
    title,
    body,
    data: data || {},
    actions: actions || []
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log(`Notifica inviata all'utente ${userId}: ${title}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Errore durante l\'invio della notifica:', error);
    
    // Se la sottoscrizione non è più valida, rimuovila
    if (error.statusCode === 410) {
      delete subscriptions[userId];
      saveSubscriptions();
      console.log(`Rimossa sottoscrizione non valida per l'utente ${userId}`);
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Endpoint per test
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Avvia il server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server notifiche push avviato sulla porta ${PORT}`);
  console.log(`Chiave VAPID pubblica: ${VAPID_PUBLIC_KEY}`);
});