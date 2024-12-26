import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAyX9Oad7N8AxizdtK7MvMFkK0HIiE1oXQ",
  authDomain: "bankingapp-52159.firebaseapp.com",
  databaseURL: "https://bankingapp-52159-default-rtdb.firebaseio.com",
  projectId: "bankingapp-52159",
  storageBucket: "bankingapp-52159.firebasestorage.app",
  messagingSenderId: "807339322620",
  appId: "1:807339322620:web:67dc6c09e0e56e0afb3b79",
  measurementId: "G-GRQGHMXQZQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Create required indexes
const createIndexes = async () => {
  try {
    // These indexes will be created automatically in Firebase when the queries are first run
    // You can also create them manually in the Firebase Console
    // emails collection indexes:
    // - recipientId, timestamp DESC
    // - senderId, timestamp DESC
    // - archived, timestamp DESC
    console.log('Indexes will be created automatically when needed');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

createIndexes();

export { auth, db, storage };
export default app;
