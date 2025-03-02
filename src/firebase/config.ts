// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCTPw3DHKBJmla0oQTHlEdfkjKM7Ao4mw",
  authDomain: "routine-69a4b.firebaseapp.com",
  projectId: "routine-69a4b",
  storageBucket: "routine-69a4b.firebasestorage.app",
  messagingSenderId: "783081813350",
  appId: "1:783081813350:web:1cfc46a7128ba27f9684a7",
  measurementId: "G-2QD5W55YR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Firebase Cloud Messaging (condizionalmente, solo se supportato)
let messaging: any = null;

// Funzione per inizializzare FCM in modo asincrono
export const initializeMessaging = async () => {
  try {
    const isFCMSupported = await isSupported();
    if (isFCMSupported) {
      messaging = getMessaging(app);
      return messaging;
    } else {
      console.log('Firebase Cloud Messaging non è supportato in questo browser');
      return null;
    }
  } catch (error) {
    console.error('Errore durante l\'inizializzazione di Firebase Cloud Messaging:', error);
    return null;
  }
};

export { db, auth, messaging };
export default app;