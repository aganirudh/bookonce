import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyA0jwCCRw-Sh8r6dX1ULDbQ5QhfUccmh_U',
  authDomain: 'book-once.firebaseapp.com',
  projectId: 'book-once',
  storageBucket: 'book-once.firebasestorage.app',
  messagingSenderId: '401504323538',
  appId: '1:401504323538:web:c1c6e30bf1163d19116a0b',
  measurementId: 'G-XD47BPPMBL',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Set session-based persistence (logout on browser close)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence).catch(error => {
    console.error('Failed to set session persistence:', error);
  });
}

export { auth, googleProvider, analytics };
