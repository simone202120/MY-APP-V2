# Configurazione delle Notifiche Push in MyRoutine

Questo documento contiene istruzioni dettagliate per configurare e testare le notifiche push nella tua PWA.

## 1. Installazione delle Dipendenze

Prima di iniziare, installa le dipendenze necessarie per il server di notifiche push:

```bash
npm install express cors body-parser web-push
```

## 2. Generazione delle Chiavi VAPID

Le chiavi VAPID sono necessarie per autenticare le richieste push tra il tuo server e i servizi push del browser:

```bash
npx web-push generate-vapid-keys
```

Questo comando genererà una coppia di chiavi pubblica e privata. **Salva entrambe le chiavi** e aggiornale nei seguenti file:

- Nel file `push-server.js`, aggiorna le variabili `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`
- Nel file `src/services/NotificationManager.ts`, aggiorna la variabile `applicationServerKey` con la chiave pubblica

## 3. Creazione delle Icone per le Azioni

Segui le istruzioni nel file `/public/action-icons/README.md` per creare le icone necessarie per le azioni nelle notifiche.

## 4. Avvio del Server di Notifiche

Per avviare il server di notifiche push:

```bash
npm run push-server
```

Il server sarà in ascolto sulla porta 5000 (http://localhost:5000).

## 5. Configurazione HTTPS per lo Sviluppo (Opzionale, ma Consigliato)

Le notifiche push funzionano meglio con HTTPS. Per lo sviluppo locale, puoi utilizzare:

### Opzione 1: ngrok
```bash
npx ngrok http 3000
```

### Opzione 2: mkcert per HTTPS locale
```bash
# Installa mkcert (Mac)
brew install mkcert
mkcert -install
mkcert localhost

# Avvia React con HTTPS
HTTPS=true SSL_CRT_FILE=localhost.pem SSL_KEY_FILE=localhost-key.pem npm start
```

## 6. Test delle Notifiche Push

Per testare le notifiche push:

1. Avvia l'applicazione React:
   ```bash
   npm start
   ```

2. Avvia il server di notifiche push in un altro terminale:
   ```bash
   npm run push-server
   ```

3. Accedi all'app e vai nelle Impostazioni > Notifiche
4. Attiva le notifiche push
5. Premi "Invia notifica di test"

## 7. Test su Dispositivi Mobili

Per testare l'app con notifiche push su dispositivi mobili:

1. Assicurati che il tuo dispositivo e il computer siano sulla stessa rete
2. Utilizza ngrok o un server HTTPS
3. Accedi all'URL remoto dal browser mobile (Chrome per Android consigliato)
4. Aggiungi l'app alla schermata home quando richiesto
5. Nelle impostazioni dell'app, abilita le notifiche push
6. Testa le notifiche chiudendo l'app e inviando una notifica di test dal server

## 8. Risoluzione dei Problemi

### Notifiche non visualizzate
- Verifica che le notifiche siano abilitate nelle impostazioni del sistema operativo
- Controlla che il service worker sia registrato correttamente
- Assicurati che la chiave VAPID pubblica sia corretta

### Problemi con il server
- Verifica che il server delle notifiche sia in esecuzione
- Controlla i log del server per eventuali errori
- Verifica che le sottoscrizioni siano salvate correttamente nel file `subscriptions.json`

### Debug del Service Worker
```javascript
// Nel browser, apri la console e digita:
navigator.serviceWorker.ready.then(reg => console.log('Service Worker:', reg));
```

## 9. Personalizzazione delle Notifiche

Per personalizzare ulteriormente le notifiche:

- Modifica il file `service-worker.js` per gestire diversi tipi di notifiche
- Aggiorna i template delle notifiche in `NotificationManager.ts`
- Aggiungi più azioni per interagire con le notifiche

## 10. Implementazione in Produzione

Per l'implementazione in produzione:

1. Genera nuove chiavi VAPID da utilizzare nell'ambiente di produzione
2. Configura un server persistente per le notifiche push (ad es. su Heroku, Vercel, AWS, ecc.)
3. Aggiorna gli URL nel file `NotificationManager.ts` per puntare al tuo server di produzione
4. Considera l'implementazione di un database per la persistenza delle sottoscrizioni (MongoDB, Firebase, ecc.)

## Risorse Utili

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications/web-push-protocol)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)