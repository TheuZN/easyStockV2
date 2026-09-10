import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { environment } from './environments/environment';
 
const app = initializeApp(environment.firebaseConfig);
 
export const db = getFirestore(app);
export const auth = getAuth(app);