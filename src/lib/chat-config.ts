/* Heredita chat — Firebase config + public rooms. */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAsKqOZr0Xc2tdof2ZvbNoXvo3qKNJyQmE',
  authDomain: 'heredita-5f315.firebaseapp.com',
  databaseURL: 'https://heredita-5f315-default-rtdb.firebaseio.com',
  projectId: 'heredita-5f315',
  storageBucket: 'heredita-5f315.firebasestorage.app',
  messagingSenderId: '680751896623',
  appId: '1:680751896623:web:2a05a4fc3fc9b3b1a10eda',
  measurementId: 'G-PJYGBFRHVS',
};

export interface ChatRoom {
  id: string;
  name: string;
  blurb: string;
}

export const CHAT_ROOMS: ChatRoom[] = [
  { id: 'general', name: 'General', blurb: 'The main lobby. Anyone, any topic.' },
];

export function isChatConfigured() {
  return !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.databaseURL;
}
